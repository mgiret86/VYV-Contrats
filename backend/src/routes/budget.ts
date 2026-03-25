import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const budgetRouter = Router();
budgetRouter.use(authenticate);

// GET /api/budget?year=2025
budgetRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    const budgetLines = await prisma.budgetLine.findMany({
      where: { year },
      include: {
        linkedContracts: {
          include: {
            contract: {
              select: { id: true, reference: true, title: true },
            },
          },
        },
        agencies: {
          include: {
            agency: { select: { id: true, code: true, name: true, city: true } },
          },
          orderBy: { percentage: 'desc' },
        },
      },
      orderBy: { category: 'asc' },
    });

    res.json(budgetLines);
  } catch (err) {
    console.error('GET budget error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/budget/years
budgetRouter.get('/years', async (req: AuthRequest, res) => {
  try {
    const years = await prisma.budgetLine.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    res.json(years.map((y) => y.year));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/budget/:id
budgetRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const line = await prisma.budgetLine.findUnique({
      where: { id: req.params.id as string },
      include: {
        linkedContracts: {
          include: { contract: true },
        },
      },
    });

    if (!line) {
      res.status(404).json({ error: 'Ligne budgétaire non trouvée' });
      return;
    }
    res.json(line);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/budget
budgetRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;

    const line = await prisma.budgetLine.create({
      data: {
        label: data.label,
        type: data.type || 'CONTRACT',
        category: data.category,
        year: data.year,
        budgetHt: data.budgetHt || 0,
        actualHt: data.actualHt || 0,
        vatRate: data.vatRate || 20,
        isRecurring: data.isRecurring || false,
        notes: data.notes,
      },
    });

    // Lier aux contrats
    if (data.linkedContractIds?.length > 0) {
      await prisma.budgetLineContract.createMany({
        data: data.linkedContractIds.map((contractId: string) => ({
          budgetLineId: line.id,
          contractId,
        })),
      });
    }

    // Lier aux agences avec ventilation
    if (data.agencies?.length > 0) {
      await prisma.budgetLineAgency.createMany({
        data: data.agencies.map((a: any) => ({
          budgetLineId: line.id,
          agencyId: a.agencyId,
          percentage: a.percentage || 0,
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'CREATE',
        entity: 'budget_line',
        entityId: line.id,
        details: { label: line.label },
        ipAddress: req.ip || null,
      },
    });

    res.status(201).json(line);
  } catch (err) {
    console.error('POST budget error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/budget/:id
budgetRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const line = await prisma.budgetLine.update({
      where: { id },
      data: {
        label: data.label,
        type: data.type,
        category: data.category,
        year: data.year,
        budgetHt: data.budgetHt,
        actualHt: data.actualHt,
        vatRate: data.vatRate,
        isRecurring: data.isRecurring,
        notes: data.notes,
      },
    });

    // Mettre à jour les liens contrats
    await prisma.budgetLineContract.deleteMany({ where: { budgetLineId: id } });
    if (data.linkedContractIds?.length > 0) {
      await prisma.budgetLineContract.createMany({
        data: data.linkedContractIds.map((contractId: string) => ({
          budgetLineId: id,
          contractId,
        })),
      });
    }

    // Mettre a jour les agences
    await prisma.budgetLineAgency.deleteMany({ where: { budgetLineId: id } });
    if (data.agencies?.length > 0) {
      await prisma.budgetLineAgency.createMany({
        data: data.agencies.map((a: any) => ({
          budgetLineId: id,
          agencyId: a.agencyId,
          percentage: a.percentage || 0,
        })),
      });
    }

    res.json(line);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/budget/:id
budgetRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    await prisma.budgetLine.delete({ where: { id: req.params.id as string } });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'DELETE',
        entity: 'budget_line',
        entityId: req.params.id as string,
        ipAddress: req.ip || null,
      },
    });

    res.json({ message: 'Ligne budgétaire supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
