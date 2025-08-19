-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "upc" TEXT NOT NULL,
    "ean" TEXT,
    "gtin" TEXT,
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "size" TEXT,
    "dimensions" JSONB,
    "weight" DOUBLE PRECISION,
    "weightUnit" TEXT NOT NULL DEFAULT 'g',
    "condition" TEXT NOT NULL DEFAULT 'New',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lowestRecordedPrice" DOUBLE PRECISION,
    "highestRecordedPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastScanned" TIMESTAMP(3),
    "ageGroup" TEXT,
    "character" TEXT,
    "exclusivity" TEXT,
    "features" TEXT,
    "funkoPop" BOOLEAN NOT NULL DEFAULT false,
    "isbn" TEXT,
    "itemHeight" TEXT,
    "itemLength" TEXT,
    "itemWidth" TEXT,
    "material" TEXT,
    "mpn" TEXT,
    "releaseDate" TEXT,
    "series" TEXT,
    "theme" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageNumber" INTEGER NOT NULL,
    "originalUrl" TEXT,
    "localPath" TEXT,
    "uploadStatus" TEXT NOT NULL DEFAULT 'pending',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_categories" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offers" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "domain" TEXT,
    "title" TEXT,
    "price" DOUBLE PRECISION,
    "listPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "shipping" TEXT,
    "condition" TEXT,
    "availability" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_content" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "productDescription" TEXT,
    "bulletPoints" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "specifications" TEXT,
    "marketingCopy" TEXT,
    "ebayTitle" TEXT,
    "shortDescription" TEXT,
    "uniqueSellingPoints" TEXT,
    "keyFeatures" TEXT,
    "specificationsArray" TEXT,
    "itemSpecifics" TEXT,
    "additionalAttributes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiModel" TEXT,
    "generatedAt" TIMESTAMP(3),
    "processingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scan_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "uniqueItems" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "scan_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scan_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_logs" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "endpoint" TEXT,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "statusCode" INTEGER,
    "requestData" TEXT,
    "responseData" TEXT,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "bin" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."listing_drafts" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'EBAY',
    "siteId" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "conditionId" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "format" TEXT NOT NULL DEFAULT 'FIXED_PRICE',
    "duration" TEXT NOT NULL DEFAULT 'GTC',
    "shippingProfileId" TEXT,
    "returnProfileId" TEXT,
    "paymentProfileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "ebayOfferId" TEXT,
    "ebayListingId" TEXT,
    "baselinkerListingId" TEXT,
    "errorMessage" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."integration_tokens" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accountId" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."listing_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'EBAY',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "shippingProfileId" TEXT,
    "returnProfileId" TEXT,
    "paymentProfileId" TEXT,
    "duration" TEXT NOT NULL DEFAULT 'GTC',
    "format" TEXT NOT NULL DEFAULT 'FIXED_PRICE',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_upc_key" ON "public"."products"("upc");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_productId_imageNumber_key" ON "public"."product_images"("productId", "imageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "categories_type_categoryId_key" ON "public"."categories"("type", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_productId_categoryId_key" ON "public"."product_categories"("productId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_content_productId_key" ON "public"."ai_content"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "scan_items_sessionId_productId_key" ON "public"."scan_items"("sessionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "public"."settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_productId_location_bin_key" ON "public"."inventory_items"("productId", "location", "bin");

-- CreateIndex
CREATE INDEX "listing_drafts_status_marketplace_idx" ON "public"."listing_drafts"("status", "marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "integration_tokens_provider_accountId_environment_key" ON "public"."integration_tokens"("provider", "accountId", "environment");

-- AddForeignKey
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_content" ADD CONSTRAINT "ai_content_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scan_items" ADD CONSTRAINT "scan_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scan_items" ADD CONSTRAINT "scan_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."scan_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listing_drafts" ADD CONSTRAINT "listing_drafts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

