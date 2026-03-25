import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const distributionTemplatesRouter = Router();
distributionTemplatesRouter.use(authenticate);

// GET /api/distribution-templates
distributionTemplatesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.distributionTemplate.findMany({
      include: {
        lines: {
          include: {
            agency: { select: { id: true, code: true, name: true, city: true } },
          },
          orderBy: { percentage: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(templates);
  } catch (err) {
    console.error('GET distribution-templates error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/distribution-templates/:id
distributionTemplatesRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const template = await prisma.distributionTemplate.findUnique({
      where: { id: req.params.id as string },
      include: {
        lines: {
          include: {
            agency: { select: { id: true, code: true, name: true, city: true } },
          },
          orderBy: { percentage: 'desc' },
        },
      },
    });
    if (!template) {
      res.status(404).json({ error: 'Modèle non trouvé' });
      return;
    }
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/distribution-templates
distributionTemplatesRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { name, description, isDefault, lines } = req.body;

    // Vérifier que les pourcentages = 100%
    if (lines && lines.length > 0) {
      const total = lines.reduce((sum: number, l: any) => sum + (l.percentage || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        res.status(400).json({ error: `Le total des pourcentages doit être 100% (actuellement ${total.toFixed(2)}%)` });
        return;
      }
    }

    // Si isDefault, retirer le défaut des autres
    if (isDefault) {
      await prisma.distributionTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.distributionTemplate.create({
      data: {
        name,
        description,
        isDefault: isDefault || false,
        lines: {
          create: (lines || []).map((l: any) => ({
            agencyId: l.agencyId,
            percentage: l.percentage,
          })),
        },
      },
      include: {
        lines: {
          include: {
            agency: { select: { id: true, code: true, name: true, city: true } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'CREATE',
        entity: 'distribution_template',
        entityId: template.id,
        details: { name: template.name },
        ipAddress: req.ip || null,
      },
    });

    res.status(201).json(template);
  } catch (err) {
    console.error('POST distribution-templates error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/distribution-templates/:id
distributionTemplatesRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { name, description, isDefault, lines } = req.body;

    // Vérifier pourcentages
    if (lines && lines.length > 0) {
      const total = lines.reduce((sum: number, l: any) => sum + (l.percentage || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        res.status(400).json({ error: `Le total des pourcentages doit être 100% (actuellement ${total.toFixed(2)}%)` });
        return;
      }
    }

    if (isDefault) {
      await prisma.distributionTemplate.updateMany({
        where: { isDefault: true, id: { not: req.params.id as string } },
        data: { isDefault: false },
      });
    }

    // Supprimer les anciennes lignes et recréer
    await prisma.distributionTemplateLine.deleteMany({
      where: { templateId: req.params.id as string },
    });

    const template = await prisma.distributionTemplate.update({
      where: { id: req.params.id as string },
      data: {
        name,
        description,
        isDefault: isDefault || false,
        lines: {
          create: (lines || []).map((l: any) => ({
            agencyId: l.agencyId,
            percentage: l.percentage,
          })),
        },
      },
      include: {
        lines: {
          include: {
            agency: { select: { id: true, code: true, name: true, city: true } },
          },
        },
      },
    });

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/distribution-templates/:id
distributionTemplatesRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    await prisma.distributionTemplate.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Modèle supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
