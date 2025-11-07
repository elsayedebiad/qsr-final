-- AlterTable
-- Add createdById column to contracts table to track who created the contract
ALTER TABLE "contracts" ADD COLUMN "createdById" INTEGER;

-- Update existing records to set a default user (first admin user)
-- You may need to adjust this based on your actual user data
UPDATE "contracts" 
SET "createdById" = (SELECT id FROM "users" WHERE role = 'ADMIN' LIMIT 1)
WHERE "createdById" IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE "contracts" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_createdById_fkey" 
FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
