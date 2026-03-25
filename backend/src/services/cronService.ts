import cron from 'node-cron';
import { checkAndSendAlerts } from './alertService';
import { prisma } from '../utils/prisma';

export function startCronJobs(): void {
  const alertSchedule = process.env.ALERT_CRON_SCHEDULE || '0 7 * * *';
  cron.schedule(alertSchedule, async () => {
    console.log('⏰ CRON — Vérification des alertes');
    await checkAndSendAlerts();
  });
  console.log(`📅 CRON alertes programmé : ${alertSchedule}`);

  cron.schedule('0 1 * * *', async () => {
    console.log('⏰ CRON — Mise à jour des statuts');
    await updateContractStatuses();
  });
  console.log('📅 CRON statuts programmé : 0 1 * * *');

  cron.schedule('0 3 * * 0', async () => {
    const deleted = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    console.log(`🧹 ${deleted.count} refresh tokens expirés supprimés`);
  });
}

async function updateContractStatuses(): Promise<void> {
  const today = new Date();
  const in90Days = new Date();
  in90Days.setDate(in90Days.getDate() + 90);

  const expired = await prisma.contract.updateMany({
    where: {
      status: { in: ['ACTIVE', 'RENEWING', 'EXPIRING'] },
      endDate: { lt: today },
    },
    data: { status: 'EXPIRED' },
  });

  const expiring = await prisma.contract.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lte: in90Days, gte: today },
    },
    data: { status: 'EXPIRING' },
  });

  console.log(`✅ Statuts mis à jour : ${expired.count} expirés, ${expiring.count} expirants`);
}
