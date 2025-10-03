-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'SUB_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."CVStatus" AS ENUM ('NEW', 'BOOKED', 'HIRED', 'REJECTED', 'RETURNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "public"."SkillLevel" AS ENUM ('YES', 'NO', 'WILLING');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('CV_CREATED', 'CV_UPDATED', 'CV_DELETED', 'CV_STATUS_CHANGED', 'CV_EXPORTED', 'USER_LOGIN', 'USER_LOGOUT', 'EXCEL_IMPORT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cvs" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "fullNameArabic" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "referenceCode" TEXT,
    "monthlySalary" TEXT,
    "contractPeriod" TEXT,
    "position" TEXT,
    "passportNumber" TEXT,
    "passportIssueDate" TEXT,
    "passportExpiryDate" TEXT,
    "passportIssuePlace" TEXT,
    "nationality" TEXT,
    "religion" TEXT,
    "dateOfBirth" TEXT,
    "placeOfBirth" TEXT,
    "livingTown" TEXT,
    "maritalStatus" "public"."MaritalStatus",
    "numberOfChildren" INTEGER,
    "weight" TEXT,
    "height" TEXT,
    "complexion" TEXT,
    "age" INTEGER,
    "englishLevel" "public"."SkillLevel",
    "arabicLevel" "public"."SkillLevel",
    "babySitting" "public"."SkillLevel",
    "childrenCare" "public"."SkillLevel",
    "tutoring" "public"."SkillLevel",
    "disabledCare" "public"."SkillLevel",
    "cleaning" "public"."SkillLevel",
    "washing" "public"."SkillLevel",
    "ironing" "public"."SkillLevel",
    "arabicCooking" "public"."SkillLevel",
    "sewing" "public"."SkillLevel",
    "driving" "public"."SkillLevel",
    "previousEmployment" TEXT,
    "profileImage" TEXT,
    "videoLink" TEXT,
    "experience" TEXT,
    "education" TEXT,
    "skills" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "notes" TEXT,
    "attachments" TEXT,
    "status" "public"."CVStatus" NOT NULL DEFAULT 'NEW',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,

    CONSTRAINT "cvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cv_versions" (
    "id" SERIAL NOT NULL,
    "cvId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "cv_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" SERIAL NOT NULL,
    "cvId" INTEGER NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "contractStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cvId" INTEGER,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "cvs_referenceCode_key" ON "public"."cvs"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "cv_versions_cvId_version_key" ON "public"."cv_versions"("cvId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_cvId_key" ON "public"."contracts"("cvId");

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cvs" ADD CONSTRAINT "cvs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cvs" ADD CONSTRAINT "cvs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cv_versions" ADD CONSTRAINT "cv_versions_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "public"."cvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
