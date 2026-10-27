import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.smtpEnabled
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null;

// Dev email mode: no SMTP configured AND not production. Emails are printed to
// this terminal (and links returned to the browser) - never in production.
export const emailDevMode = !transporter && !env.isProd;
export const emailAvailable = Boolean(transporter) || emailDevMode;

const appUrl = () => env.clientUrls[0];

function layout(heading, body, cta, url) {
  return `<!doctype html><html><body style="margin:0;background:#0b0b0f;font-family:Arial,Helvetica,sans-serif;color:#eeeef2">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
    <table width="100%" style="max-width:480px;background:#15151c;border:1px solid #26262f;border-radius:16px;padding:32px">
      <tr><td style="font-size:22px;font-weight:bold;letter-spacing:-0.5px">boomerang<span style="color:#c8ff2e">.</span></td></tr>
      <tr><td style="padding-top:20px;font-size:20px;font-weight:bold">${heading}</td></tr>
      <tr><td style="padding-top:8px;font-size:15px;line-height:1.5;color:#b9b9c6">${body}</td></tr>
      <tr><td style="padding-top:24px"><a href="${url}" style="display:inline-block;background:#c8ff2e;color:#0b0b0f;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">${cta}</a></td></tr>
      <tr><td style="padding-top:20px;font-size:12px;color:#8a8a99;word-break:break-all">Or paste this link into your browser:<br>${url}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

async function send({ to, subject, text, html }) {
  if (!transporter) {
    if (!emailDevMode) throw new Error('Email is not configured (set SMTP_* and EMAIL_FROM)');
    console.log(`\n✉  [dev email mode] To: ${to}\n   Subject: ${subject}\n   ${text}\n`);
    return;
  }
  await transporter.sendMail({ from: env.emailFrom, to, subject, text, html });
}

export async function sendVerificationEmail(user, token) {
  const url = `${appUrl()}/verify-email?token=${token}`;
  await send({
    to: user.email,
    subject: 'Verify your college email',
    text: `Hi ${user.name}, confirm your email to start using the campus lost & found: ${url} (link expires in 24 hours)`,
    html: layout(
      `Hi ${escapeHtml(user.name)}, one tap left`,
      'Confirm this is your college email to start reporting and claiming items. The link expires in 24 hours.',
      'Verify my email',
      url,
    ),
  });
  return url;
}

export async function sendPasswordResetEmail(user, token) {
  const url = `${appUrl()}/reset-password?token=${token}`;
  await send({
    to: user.email,
    subject: 'Reset your password',
    text: `Reset your password here: ${url} (link expires in 30 minutes). If you didn't ask for this, ignore this email.`,
    html: layout(
      'Reset your password',
      "Someone (hopefully you) asked to reset your password. The link expires in 30 minutes. If it wasn't you, ignore this email.",
      'Choose a new password',
      url,
    ),
  });
  return url;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
