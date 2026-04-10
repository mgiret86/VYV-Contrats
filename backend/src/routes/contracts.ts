import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const contractsRouter = Router();
contractsRouter.use(authenticate);

// Mapping frontend scope -> backend enum
const SCOPE_MAP: Record<string, string> = {
  ALL_AGENCIES: 'NATIONAL',
  MULTI_AGENCY: 'REGIONAL',
  SINGLE_AGENCY: 'LOCAL',
  HEADQUARTERS: 'HEADQUARTERS',
  NATIONAL: 'NATIONAL',
  REGIONAL: 'REGIONAL',
  LOCAL: 'LOCAL',
};
function mapScope(scope: string): string {
  return SCOPE_MAP[scope] || 'NATIONAL';
}

async function generateReference(): Promise<string> {
  const year = new Date().getFullYear();
  const last = await prisma.contract.findFirst({
    where: { reference: { startsWith: 'CTR-' + year } },
    orderBy: { reference: 'desc' },
  });
  const num = last ? parseInt(last.reference.split('-')[2], 10) + 1 : 1;
  return 'CTR-' + year + '-' + String(num).padStart(4, '0');
}

function extractAgencyId(item: any): string | null {
  if (typeof item === 'string') return item;
  if (typeof item?.agencyId === 'string') return item.agencyId;
  if (item?.agencyId?.id) return item.agencyId.id;
  if (item?.id) return item.id;
  return null;
}

// GET /api/contracts
contractsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, category, scope, search } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (scope) where.scope = scope;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { reference: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        leaser: { select: { id: true, name: true } },
        agencies: { include: { agency: { select: { id: true, code: true, name: true } } } },
        articles: { include: { agency: { select: { id: true, code: true, name: true, city: true } } } },
        documents: { select: { id: true, originalName: true, size: true, uploadedAt: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    res.json(contracts);
  } catch (err) {
    console.error('GET contracts error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/contracts/:id
contractsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id as string },
      include: {
        supplier: true,
        leaser: true,
        agencies: {
          include: { agency: { select: { id: true, code: true, name: true, city: true } } },
          orderBy: { percentage: 'desc' },
        },
        articles: {
          include: { agency: { select: { id: true, code: true, name: true, city: true } } },
          orderBy: { createdAt: 'asc' },
        },
        documents: true,
        history: { orderBy: { createdAt: 'desc' } },
        budgetLines: { include: { budgetLine: true } },
      },
    });

    if (!contract) {
      res.status(404).json({ error: 'Contrat non trouve' });
      return;
    }
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/contracts
contractsRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const noticePeriodMonths = data.noticePeriodMonths || data.noticePeriod || 3;
    const tacitRenewal = data.tacitRenewal ?? data.autoRenewal ?? true;
    const renewalDurationMonths = data.renewalDurationMonths || data.renewalDuration || null;
    const allAgencies = data.allAgencies ?? (data.scope === 'ALL_AGENCIES');

    const endDate = new Date(data.endDate);
    const denounceDate = new Date(endDate);
    denounceDate.setMonth(denounceDate.getMonth() - noticePeriodMonths);

    const contract = await prisma.contract.create({
      data: {
        reference: await generateReference(),
        title: data.title,
        supplierReference: data.supplierReference || null,
        category: data.category,
        supplierId: data.supplierId,
        leaserId: data.leaserId || null,
        startDate: new Date(data.startDate),
        endDate,
        noticePeriodMonths,
        denounceBeforeDate: denounceDate,
        amountHt: data.amountHt,
        billingPeriod: data.billingPeriod || 'ANNUAL',
        vatRate: data.vatRate || 20,
        scope: mapScope(data.scope || 'NATIONAL') as any,
        allAgencies,
        tacitRenewal,
        renewalDurationMonths,
        notes: data.notes,
      },
    });

    const postItems = data.agencies || data.agencyIds || [];
    if (!allAgencies && postItems.length > 0) {
      const postRows = postItems
        .map((item: any) => {
          const aid = extractAgencyId(item);
          return aid ? { contractId: contract.id, agencyId: aid, percentage: item.percentage || 0 } : null;
        })
        .filter((r: any) => r !== null);
      if (postRows.length > 0) {
        await prisma.contractAgency.createMany({ data: postRows });
      }
    }

    // Create articles
    const articleItems = data.articles || [];
    if (articleItems.length > 0) {
      const articleRows = articleItems
        .filter((a: any) => a.designation && a.designation.trim())
        .map((a: any) => ({
          contractId: contract.id,
          designation: a.designation.trim(),
          quantity: a.quantity || 1,
          agencyId: a.agencyId || null,
        }));
      if (articleRows.length > 0) {
        await prisma.contractArticle.createMany({ data: articleRows });
      }
    }

    await prisma.contractHistory.create({
      data: {
        contractId: contract.id,
        action: 'CREATION',
        details: 'Contrat cree',
        userId: req.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'CREATE',
        entity: 'contract',
        entityId: contract.id,
        details: { reference: contract.reference },
        ipAddress: req.ip || null,
      },
    });

    res.status(201).json(contract);
  } catch (err) {
    console.error('POST contract error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/contracts/:id
contractsRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const noticePeriodMonths = data.noticePeriodMonths || data.noticePeriod || 3;
    const tacitRenewal = data.tacitRenewal ?? data.autoRenewal ?? true;
    const renewalDurationMonths = data.renewalDurationMonths || data.renewalDuration || null;
    const allAgencies = data.allAgencies ?? (data.scope === 'ALL_AGENCIES');

    const endDate = new Date(data.endDate);
    const denounceDate = new Date(endDate);
    denounceDate.setMonth(denounceDate.getMonth() - noticePeriodMonths);

    await prisma.contract.update({
      where: { id },
      data: {
        title: data.title,
        supplierReference: data.supplierReference || null,
        category: data.category,
        status: data.status || undefined,
        supplierId: data.supplierId,
        leaserId: data.leaserId || null,
        startDate: new Date(data.startDate),
        endDate,
        noticePeriodMonths,
        denounceBeforeDate: denounceDate,
        amountHt: data.amountHt,
        billingPeriod: data.billingPeriod || 'ANNUAL',
        vatRate: data.vatRate ?? 20,
        scope: mapScope(data.scope) as any,
        allAgencies,
        tacitRenewal,
        renewalDurationMonths,
        notes: data.notes,
      },
    });

    await prisma.contractAgency.deleteMany({ where: { contractId: id } });
    const putItems = data.agencies || data.agencyIds || [];
    if (!allAgencies && putItems.length > 0) {
      const putRows = putItems
        .map((item: any) => {
          const aid = extractAgencyId(item);
          return aid ? { contractId: id, agencyId: aid, percentage: item.percentage || 0 } : null;
        })
        .filter((r: any) => r !== null);
      if (putRows.length > 0) {
        await prisma.contractAgency.createMany({ data: putRows });
      }
    }

    // Recreate articles
    await prisma.contractArticle.deleteMany({ where: { contractId: id } });
    const putArticles = data.articles || [];
    if (putArticles.length > 0) {
      const articleRows = putArticles
        .filter((a: any) => a.designation && a.designation.trim())
        .map((a: any) => ({
          contractId: id,
          designation: a.designation.trim(),
          quantity: a.quantity || 1,
          agencyId: a.agencyId || null,
        }));
      if (articleRows.length > 0) {
        await prisma.contractArticle.createMany({ data: articleRows });
      }
    }

    await prisma.contractHistory.create({
      data: {
        contractId: id,
        action: 'MODIFICATION',
        details: 'Contrat modifie',
        userId: req.userId,
      },
    });

    const updated = await prisma.contract.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        leaser: { select: { id: true, name: true } },
        agencies: { include: { agency: { select: { id: true, code: true, name: true } } } },
        articles: { include: { agency: { select: { id: true, code: true, name: true, city: true } } } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT contract:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/contracts/:id/denounce
contractsRouter.patch('/:id/denounce', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const contract = await prisma.contract.update({
      where: { id: req.params.id as string },
      data: {
        status: 'DENOUNCED',
        denouncedAt: new Date(),
      },
    });

    await prisma.contractHistory.create({
      data: {
        contractId: contract.id,
        action: 'DENONCIATION',
        details: 'Contrat denonce',
        userId: req.userId,
      },
    });

    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/contracts/:id
contractsRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    await prisma.contract.delete({ where: { id: req.params.id as string } });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'DELETE',
        entity: 'contract',
        entityId: req.params.id as string,
        ipAddress: req.ip || null,
      },
    });

    res.json({ message: 'Contrat supprime' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
