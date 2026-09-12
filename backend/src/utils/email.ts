import nodemailer, { Transporter } from 'nodemailer'

let transporterPromise: Promise<Transporter> | null = null

const getTransporter = (): Promise<Transporter> => {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      })
      console.log(`Ethereal test account ready: ${testAccount.user}`)
      return transporter
    })
  }
  return transporterPromise
}

export const sendPasswordResetEmail = async (to: string, resetLink: string): Promise<void> => {
  const transporter = await getTransporter()

  const info = await transporter.sendMail({
    from: '"PetBuddy" <no-reply@petbuddy.local>',
    to,
    subject: 'Reset your PetBuddy password',
    text: `Reset your password using this link (valid for 15 minutes): ${resetLink}`,
    html: `<p>Reset your password using the link below (valid for 15 minutes):</p><p><a href="${resetLink}">${resetLink}</a></p>`,
  })

  console.log(`Password reset email preview: ${nodemailer.getTestMessageUrl(info)}`)
}
