import { prisma } from '../utils/prisma';
import { sendEmail, buildAlertHtml } from './emailService';

export async function checkAndSendAlerts(): Promise<void> {
  console.log('🔍 Vérification des alertes de dénonciation...');

  const rules = await prisma.alertRule.findMany({
    where: { enabled: true },
  });

  const activeContracts = await prisma.contract.findMany({
    where: {
      status: { in: ['ACTIVE', 'RENEWING', 'EXPIRING'] },
      denounceBeforeDate: { not: null },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let alertsSent = 0;

  for (const contract of activeContracts) {
    if (!contract.denounceBeforeDate) continue;

    const deadline = new Date(contract.denounceBeforeDate);
    const diffMs = deadline.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / 86400000);

    if (daysRemaining < 0) continue;

    for (const rule of rules) {
      if (daysRemaining <= rule.daysBefore) {
        const alreadySent = await prisma.alertLog.findFirst({
          where: {
            contractId: contract.id,
            ruleId: rule.id,
            sentAt: { gte: today },
          },
        });

        if (alreadySent) continue;

        const deadlineStr = deadline.toLocaleDateString('fr-FR');
        const html = buildAlertHtml(
          contract.reference,
          contract.title,
          deadlineStr,
          daysRemaining,
          rule.label
        );

        const recipients = rule.recipients.split(',').map((r) => r.trim());

        for (const recipient of recipients) {
          const sent = await sendEmail(
            recipient,
            `[DSI] ${rule.label} — ${contract.reference} (J-${daysRemaining})`,
            html
          );

          if (sent) {
            await prisma.alertLog.create({
              data: {
                ruleId: rule.id,
                contractId: contract.id,
                recipients: recipient,
                subject: `${rule.label} — ${contract.reference}`,
                body: html,
                status: 'SENT',
              },
            });
            alertsSent++;
          }
        }
      }
    }
  }

  console.log(`✅ ${alertsSent} alerte(s) envoyée(s)`);
}
