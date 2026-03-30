import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const leasersRouter = Router();
leasersRouter.use(authenticate);

// GET /api/leasers
leasersRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const leasers = await prisma.leaser.findMany({
      include: {
        contracts: {
          select: { id: true, reference: true, title: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(leasers);
  } catch (err) {
    console.error('GET leasers error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/leasers/:id
leasersRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const leaser = await prisma.leaser.findUnique({
      where: { id: req.params.id as string },
      include: {
        contracts: {
          select: { id: true, reference: true, title: true, status: true, amountHt: true, billingPeriod: true },
        },
      },
    });
    if (!leaser) {
      res.status(404).json({ error: 'Leaseur non trouvé' });
      return;
    }
    res.json(leaser);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/leasers
leasersRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const leaser = await prisma.leaser.create({
      data: {
        name: data.name,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        category: data.category || null,
        rating: data.rating || 3,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'CREATE',
        entity: 'leaser',
        entityId: leaser.id,
        details: { name: leaser.name },
        ipAddress: req.ip || null,
      },
    });

    res.status(201).json(leaser);
  } catch (err) {
    console.error('POST leaser error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/leasers/:id
leasersRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const leaser = await prisma.leaser.update({
      where: { id: req.params.id as string },
      data: {
        name: data.name,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        category: data.category || null,
        rating: data.rating,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'UPDATE',
        entity: 'leaser',
        entityId: leaser.id,
        details: { name: leaser.name },
        ipAddress: req.ip || null,
      },
    });

    res.json(leaser);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/leasers/:id
leasersRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    await prisma.leaser.delete({ where: { id: req.params.id as string } });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'DELETE',
        entity: 'leaser',
        entityId: req.params.id as string,
        ipAddress: req.ip || null,
      },
    });

    res.json({ message: 'Leaseur supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
