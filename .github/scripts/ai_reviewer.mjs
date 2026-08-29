import https from 'node:https';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.ANTIGRAVITY_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY;

async function postRequest(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetBuddy-AI-Reviewer',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function getDiff() {
  try {
    if (fs.existsSync(GITHUB_EVENT_PATH)) {
      const eventData = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
      if (eventData.pull_request) {
        const baseRef = eventData.pull_request.base.sha || `origin/${eventData.pull_request.base.ref}`;
        try {
          return execSync(`git diff ${baseRef}...HEAD`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
        } catch {
          return execSync('git diff HEAD~1', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
        }
      }
    }
    return execSync('git diff HEAD~1', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    console.warn('Could not retrieve full git diff, falling back to git show:', err.message);
    try {
      return execSync('git show HEAD', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    } catch {
      return '';
    }
  }
}

async function generateReview(diff) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY or ANTIGRAVITY_API_KEY secret is not configured in GitHub Secrets.');
  }

  // Truncate diff if extremely large to prevent payload overflow
  const maxDiffLength = 60000;
  const truncatedDiff = diff.length > maxDiffLength ? diff.substring(0, maxDiffLength) + '\n...[Diff truncated for length]' : diff;

  const prompt = `You are Antigravity AI Code Reviewer for the PetBuddy project.
Analyze the following Git Diff and provide an insightful, actionable, and structured review for the team.

Diff:
\`\`\`diff
${truncatedDiff}
\`\`\`

Format your response in GitHub Markdown using this structure:
### 🤖 Antigravity AI Code Review
- **Summary**: Concise overview of changes.
- **Highlights & Strengths**: What was implemented well.
- **Security & Potential Issues**: Any security vulnerabilities, edge cases, bugs, or performance bottlenecks.
- **Suggestions & Refactoring**: Clear, actionable improvements (include short code snippets if helpful).
- **Verdict**: ✅ LGTM / ⚠️ Minor Improvements Recommended / 🛑 Changes Requested
`;

  const requestedModel = process.env.GEMINI_MODEL;
  const candidateModels = Array.from(new Set([
    requestedModel,
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ].filter(Boolean)));

  let lastError = null;

  for (const model of candidateModels) {
    try {
      console.log(`🤖 Attempting AI review with model: ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
        }
      };

      const response = await postRequest(url, {}, payload);
      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`✅ Successfully generated review using model: ${model}`);
        const modelBadge = `\n\n---\n*🤖 Reviewed by Antigravity AI using model \`${model}\`*`;
        return text.trim() + modelBadge;
      }
    } catch (err) {
      console.warn(`⚠️ Model ${model} failed: ${err.message}. Trying next candidate model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('No candidate Gemini model succeeded.');
}

async function postCommentToPR(comment) {
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !fs.existsSync(GITHUB_EVENT_PATH)) {
    return;
  }

  const eventData = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
  const prNumber = eventData.pull_request?.number;

  if (!prNumber) {
    console.log('Not a Pull Request event. Skipping PR comment posting.');
    return;
  }

  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${prNumber}/comments`;
  await postRequest(
    url,
    {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
    { body: comment }
  );
  console.log(`Successfully posted AI review comment to PR #${prNumber}`);
}

async function main() {
  console.log('Starting Antigravity AI Review Agent...');

  const diff = await getDiff();
  if (!diff || diff.trim().length === 0) {
    console.log('No diff found to review.');
    return;
  }

  console.log(`Extracted diff (${diff.length} bytes). Requesting AI review...`);
  try {
    const review = await generateReview(diff);

    // Write to Step Summary if running in GitHub Actions
    if (GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(GITHUB_STEP_SUMMARY, review + '\n');
    }

    console.log('\n--- AI REVIEW OUTPUT ---\n');
    console.log(review);
    console.log('\n------------------------\n');

    await postCommentToPR(review);
  } catch (err) {
    console.error('Error during AI Review:', err.message);
    if (GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        GITHUB_STEP_SUMMARY,
        `### ⚠️ Antigravity AI Review Note\nCould not complete review: ${err.message}\nMake sure \`GEMINI_API_KEY\` or \`ANTIGRAVITY_API_KEY\` is added to repository Secrets.`
      );
    }
  }
}

main();
