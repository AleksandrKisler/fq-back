const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (process.env.NODE_ENV === 'test') {
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return transporter;
  }

  const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing SMTP configuration: ${missing.join(', ')}`);
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  return transporter;
}

async function sendEmail({to, subject, text, html, from, headers}) {
  const mailTransporter = getTransporter();
  const defaultFrom = process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: from || defaultFrom,
    to,
    subject,
    text,
    html,
    headers
  };

  return mailTransporter.sendMail(mailOptions);
}

function buildVerificationLink(token) {
  const baseUrl = process.env.EMAIL_VERIFICATION_URL
    || `${process.env.APP_URL || 'http://localhost:3000'}/verify-email`;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
}

async function sendVerificationEmail({to, token}) {
  const verificationLink = buildVerificationLink(token);

  const subject = 'Подтверждение email';
  const text = `Для подтверждения email перейдите по ссылке: ${verificationLink}`;
  const html = `<p>Для подтверждения email перейдите по ссылке: <a href="${verificationLink}">${verificationLink}</a></p>`;

  await sendEmail({to, subject, text, html});
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  buildVerificationLink,
  getTransporter
};
