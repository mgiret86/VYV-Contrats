import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const settingsRouter = Router();
settingsRouter.use(authenticate);
settingsRouter.use(requireRole('ADMIN'));

// GET /api/settings
settingsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const result: Record<string, any> = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/settings
settingsRouter.put('/', async (req: AuthRequest, res) => {
  try {
    const data = req.body;

    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'UPDATE',
        entity: 'settings',
        details: { keys: Object.keys(data) },
        ipAddress: req.ip,
      },
    });

    res.json({ message: 'Paramètres enregistrés' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/settings/alert-rules
settingsRouter.get('/alert-rules', async (req: AuthRequest, res) => {
  try {
    const rules = await prisma.alertRule.findMany({
      orderBy: { daysBefore: 'desc' },
    });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/settings/alert-rules/:id
settingsRouter.put('/alert-rules/:id', async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const rule = await prisma.alertRule.update({
      where: { id: req.params.i as string as string },
      data: {
        label: data.label,
        daysBefore: data.daysBefore,
        enabled: data.enabled,
        recipients: data.recipients,
      },
    });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
