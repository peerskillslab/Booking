const nodemailer = require('nodemailer');

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

async function sendResetEmail(toEmail, token, appBaseUrl) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP nicht konfiguriert (SMTP_USER / SMTP_PASSWORD fehlen in .env)');
  }

  const resetUrl = `${appBaseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

  const text =
    'Hallo,\n\n' +
    'du hast einen Passwort-Reset für dein PeerSkills-Konto angefordert.\n\n' +
    'Klicke auf den folgenden Link, um ein neues Passwort zu setzen:\n' +
    `${resetUrl}\n\n` +
    'Der Link ist 1 Stunde gültig und kann nur einmal verwendet werden.\n\n' +
    'Falls du keinen Reset angefordert hast, kannst du diese Mail ignorieren.\n\n' +
    'PeerSkills';

  const transport = createTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: 'Passwort zurücksetzen – PeerSkills',
    text,
  });
}

module.exports = { sendResetEmail };
