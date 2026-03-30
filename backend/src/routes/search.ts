import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const searchRouter = Router();
searchRouter.use(authenticate);

// GET /api/search?q=xxx
searchRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (q.length < 2) {
      res.json({ contracts: [], suppliers: [], agencies: [], leasers: [], budgetLines: [] });
      return;
    }

    const search = { contains: q, mode: 'insensitive' as const };

    const [contracts, suppliers, agencies, leasers, budgetLines] = await Promise.all([
      prisma.contract.findMany({
        where: {
          OR: [
            { title: search },
            { reference: search },
            { category: search },
            { notes: search },
            { supplier: { name: search } },
            { leaser: { name: search } },
          ],
        },
        select: {
          id: true,
          reference: true,
          title: true,
          category: true,
          status: true,
          amountHt: true,
          supplier: { select: { name: true } },
          leaser: { select: { name: true } },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.supplier.findMany({
        where: {
          OR: [
            { name: search },
            { contactName: search },
            { email: search },
            { phone: search },
            { category: search },
          ],
        },
        select: { id: true, name: true, contactName: true, category: true },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      prisma.agency.findMany({
        where: {
          OR: [
            { name: search },
            { code: search },
            { city: search },
            { region: search },
            { managerName: search },
          ],
        },
        select: { id: true, code: true, name: true, city: true },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      prisma.leaser.findMany({
        where: {
          OR: [
            { name: search },
            { contactName: search },
            { email: search },
          ],
        },
        select: { id: true, name: true },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      prisma.budgetLine.findMany({
        where: {
          OR: [
            { label: search },
            { category: search },
            { notes: search },
          ],
        },
        select: { id: true, label: true, category: true, year: true },
        take: 5,
        orderBy: { year: 'desc' },
      }),
    ]);

    res.json({ contracts, suppliers, agencies, leasers, budgetLines });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
