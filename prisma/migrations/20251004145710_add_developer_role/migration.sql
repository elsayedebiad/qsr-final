-- AlterEnum
-- Add DEVELOPER to the beginning of the Role enum
ALTER TYPE "Role" ADD VALUE 'DEVELOPER' BEFORE 'ADMIN';
