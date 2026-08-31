class ApiError extends Error {
  constructor(status, data) {
    super((data && data.error) || "UNKNOWN_ERROR");
    this.status = status;
    this.data = data;
  }
}

const MOCK_USERS = [
  { username: "Title", email: "title@petbuddy.com", password: "Password1", role: "owner" },
];
const REGISTERED_EMAILS = new Set(["title@petbuddy.com", "duplicate@petbuddy.com"]);
const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms)); // จำลอง latency เพื่อเห็น loading state

const api = {
  async post(path, body = {}) {
    await delay();
    switch (path) {
      case "/auth/register":
        if (REGISTERED_EMAILS.has(body.email)) throw new ApiError(409, { error: "EMAIL_DUPLICATE" });
        REGISTERED_EMAILS.add(body.email);
        MOCK_USERS.push({ username: body.username, email: body.email, password: body.password, role: body.role });
        return { userId: MOCK_USERS.length };
      case "/auth/login": {
        const u = MOCK_USERS.find((x) => x.email === body.email && x.password === body.password);
        if (!u) throw new ApiError(401, { error: "INVALID_CREDENTIALS" });
        return { token: "mock-jwt-" + Date.now(), user: { username: u.username, email: u.email, role: u.role } };
      }
      case "/auth/logout":
        return {};
      case "/auth/forgot-password":
        return {}; // ไม่บอกว่าอีเมลมีอยู่จริงไหม (ป้องกัน user enumeration)
      case "/auth/reset-password":
        if (!body.token || body.token === "expired") throw new ApiError(400, { error: "TOKEN_EXPIRED" });
        return {};
      default:
        throw new ApiError(404, { error: "NOT_FOUND" });
    }
  },
};
export { api, ApiError };