-- AlterTable
ALTER TABLE "contract_agencies" ADD COLUMN     "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "distribution_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_template_lines" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "distribution_template_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_line_agencies" (
    "budgetLineId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "budget_line_agencies_pkey" PRIMARY KEY ("budgetLineId","agencyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "distribution_templates_name_key" ON "distribution_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_template_lines_templateId_agencyId_key" ON "distribution_template_lines"("templateId", "agencyId");

-- AddForeignKey
ALTER TABLE "distribution_template_lines" ADD CONSTRAINT "distribution_template_lines_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "distribution_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_template_lines" ADD CONSTRAINT "distribution_template_lines_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_agencies" ADD CONSTRAINT "budget_line_agencies_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "budget_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_agencies" ADD CONSTRAINT "budget_line_agencies_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
