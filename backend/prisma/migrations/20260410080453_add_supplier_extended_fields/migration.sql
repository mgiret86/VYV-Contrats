-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "website" TEXT;
