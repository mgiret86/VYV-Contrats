import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const agenciesRouter = Router();
agenciesRouter.use(authenticate);

// GET /api/agencies
agenciesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, region } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (region) where.region = region;

    const agencies = await prisma.agency.findMany({
      where,
      include: {
        _count: { select: { contracts: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(agencies);
  } catch (err) {
    console.error('GET agencies error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/agencies/:id
agenciesRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: req.params.id as string },
      include: {
        contracts: {
          include: {
            contract: {
              include: {
                supplier: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!agency) {
      res.status(404).json({ error: 'Agence non trouvée' });
      return;
    }
    res.json(agency);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/agencies
agenciesRouter.post('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const agency = await prisma.agency.create({
      data: {
        code: data.code,
        name: data.name,
        city: data.city,
        address: data.address,
        region: data.region,
        managerName: data.managerName,
        managerEmail: data.managerEmail,
        phone: data.phone,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'CREATE',
        entity: 'agency',
        entityId: agency.id,
        details: { name: agency.name },
        ipAddress: req.ip || null,
      },
    });

    res.status(201).json(agency);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/agencies/:id
agenciesRouter.put('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const agency = await prisma.agency.update({
      where: { id: req.params.id as string },
      data: {
        name: data.name,
        city: data.city,
        address: data.address,
        region: data.region,
        managerName: data.managerName,
        managerEmail: data.managerEmail,
        phone: data.phone,
        isActive: data.isActive,
      },
    });
    res.json(agency);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/agencies/:id
agenciesRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const contractCount = await prisma.contractAgency.count({
      where: { agencyId: req.params.id as string },
    });

    if (contractCount > 0) {
      res.status(400).json({
        error: `Impossible de supprimer : ${contractCount} contrat(s) lié(s)`,
      });
      return;
    }

    await prisma.agency.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Agence supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
