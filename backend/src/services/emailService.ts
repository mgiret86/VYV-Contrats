import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email envoyé à ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`❌ Erreur envoi email à ${to}:`, err);
    return false;
  }
}

export function buildAlertHtml(
  contractRef: string,
  contractTitle: string,
  deadline: string,
  daysRemaining: number,
  alertType: string
): string {
  const urgencyColor =
    daysRemaining <= 30 ? '#dc2626' :
    daysRemaining <= 90 ? '#f59e0b' : '#3b82f6';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">⚠️ ${alertType}</h2>
      </div>
      <div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Contrat :</td>
            <td style="padding: 8px 0;">${contractRef} — ${contractTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Date limite :</td>
            <td style="padding: 8px 0; font-weight: bold; color: ${urgencyColor};">${deadline}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Jours restants :</td>
            <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: ${urgencyColor};">${daysRemaining} jours</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
        <p style="color: #64748b; font-size: 12px;">
          DSI Contract Manager — Vyv Ambulance<br>
          Cet email est envoyé automatiquement.
        </p>
      </div>
    </div>
  `;
}
