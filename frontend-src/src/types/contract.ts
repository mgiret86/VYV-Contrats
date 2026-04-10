export type ContractStatus = 'ACTIVE' | 'DENOUNCED' | 'EXPIRED' | 'NEGOTIATING' | 'TO_TRANSFER' | 'TRANSFERRING';
export type ContractScope = 'ALL_AGENCIES' | 'MULTI_AGENCY' | 'SINGLE_AGENCY';
export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type DistributionMode = 'PRORATA' | 'FIXED' | null;

export interface ContractSupplier {
  id: string;
  name: string;
}

export interface ContractLeaser {
  id: string;
  name: string;
}

export interface ContractOwner {
  id: string;
  fullName: string;
}

export interface ContractArticle {
  id: string;
  designation: string;
  quantity: number;
  agencyId?: string | null;
  agency?: {
    id: string;
    code: string;
    name: string;
    city: string;
  } | null;
}

export interface Contract {
  id: string;
  reference: string;
  supplierReference?: string;
  title: string;
  category: string;
  subCategory?: string;
  status: ContractStatus;
  scope: ContractScope;
  supplier: ContractSupplier;
  supplierId?: string;
  leaser?: ContractLeaser | null;
  leaserId?: string | null;
  owner: ContractOwner;
  startDate: string;
  endDate: string;
  autoRenewal: boolean;
  renewalDuration?: number;
  renewalUnit?: string;
  noticePeriod: number;
  noticePeriodUnit: string;
  noticeDeadline?: string;
  denouncedAt?: string | null;
  amountHt: number;
  vatRate: number;
  billingPeriod: BillingPeriod;
  tariffRevision?: string;
  distributionMode?: DistributionMode;
  notes?: string;
  budgetLineId?: string | null;
  agencies: string[] | 'ALL';
  articles?: ContractArticle[];
}
