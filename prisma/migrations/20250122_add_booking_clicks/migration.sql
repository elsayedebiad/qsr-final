-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_clicks" (
    "id" SERIAL NOT NULL,
    "salesPageId" TEXT NOT NULL,
    "cvId" TEXT,
    "cvName" TEXT,
    "action" TEXT DEFAULT 'BOOKING_CLICK',
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceType" TEXT,
    "messageSent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "booking_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_clicks_salesPageId_idx" ON "booking_clicks"("salesPageId");
CREATE INDEX IF NOT EXISTS "booking_clicks_createdAt_idx" ON "booking_clicks"("createdAt");
CREATE INDEX IF NOT EXISTS "booking_clicks_messageSent_idx" ON "booking_clicks"("messageSent");
