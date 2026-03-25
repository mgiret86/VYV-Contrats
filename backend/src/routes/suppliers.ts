import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const suppliersRouter = Router();
suppliersRouter.use(authenticate);

// GET /api/suppliers
suppliersRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, category } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { contactName: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { contracts: true } },
        contracts: {
          select: { id: true, reference: true, title: true, amountHt: true, billingPeriod: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(suppliers);
  } catch (err) {
    console.error('GET suppliers error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/suppliers/:id
suppliersRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.i as string as string },
      include: {
        contracts: {
          include: {
            agencies: { include: { agency: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!supplier) {
      res.status(404).json({ error: 'Fournisseur non trouvé' });
      return;
    }
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/suppliers
suppliersRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        category: data.category,
        rating: data.rating || 3,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'CREATE',
        entity: 'supplier',
        entityId: supplier.id,
        details: { name: supplier.name },
        ipAddress: req.ip,
      },
    });

    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/suppliers/:id
suppliersRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: req.params.i as string as string },
      data: {
        name: data.name,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        category: data.category,
        rating: data.rating,
      },
    });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/suppliers/:id
suppliersRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const contractCount = await prisma.contract.count({
      where: { supplierId: req.params.i as string as string },
    });

    if (contractCount > 0) {
      res.status(400).json({
        error: `Impossible de supprimer : ${contractCount} contrat(s) lié(s)`,
      });
      return;
    }

    await prisma.supplier.delete({ where: { id: req.params.i as string as string } });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'DELETE',
        entity: 'supplier',
        entityId: req.params.i as string as string,
        ipAddress: req.ip,
      },
    });

    res.json({ message: 'Fournisseur supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
