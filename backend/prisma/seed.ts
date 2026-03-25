import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangezCeMotDePasse2026!', 12);

  await prisma.user.upsert({
    where: { email: 'mickael.giret@vyv-ambulance.fr' },
    update: {},
    create: {
      firstName: 'Mickael',
      lastName: 'Giret',
      email: 'mickael.giret@vyv-ambulance.fr',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      alertsEnabled: true,
      alertDaysBefore: 30,
    },
  });

  const alertRules = [
    { label: 'Dénonciation — Urgente', daysBefore: 30, recipients: 'mickael.giret@vyv-ambulance.fr' },
    { label: 'Dénonciation — Planification', daysBefore: 90, recipients: 'mickael.giret@vyv-ambulance.fr' },
    { label: 'Dénonciation — Anticipation', daysBefore: 180, recipients: 'mickael.giret@vyv-ambulance.fr' },
    { label: 'Rappel fin de contrat', daysBefore: 15, recipients: 'mickael.giret@vyv-ambulance.fr' },
  ];

  for (const rule of alertRules) {
    await prisma.alertRule.create({ data: rule });
  }

  console.log('✅ Seed terminé : admin + règles d\'alerte créés');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
