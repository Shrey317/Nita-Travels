import nodemailer from 'nodemailer';
export async function sendAccountEmail(to: string, subject: string, text: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Email delivery unavailable');
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass }, connectionTimeout: 10000, socketTimeout: 15000, logger: false, debug: false });
  await transport.sendMail({ from: user, to, subject, text });
}
