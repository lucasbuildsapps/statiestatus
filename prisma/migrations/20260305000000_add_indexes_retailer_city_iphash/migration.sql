-- CreateIndex: Location.retailer for /api/keten/[retailer] queries
CREATE INDEX "Location_retailer_idx" ON "Location"("retailer");

-- CreateIndex: Location.city for /api/stad/[city] queries
CREATE INDEX "Location_city_idx" ON "Location"("city");

-- CreateIndex: Report(ipHash, createdAt) for rate-limit window queries
CREATE INDEX "Report_ipHash_createdAt_idx" ON "Report"("ipHash", "createdAt");
