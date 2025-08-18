/*
  Warnings:

  - You are about to drop the column `additionalAttributes` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `aiTitle` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `itemSpecifics` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `keyFeatures` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `longDescription` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `uniqueSellingPoints` on the `ai_content` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ai_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "productDescription" TEXT,
    "bulletPoints" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "specifications" TEXT,
    "marketingCopy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "aiModel" TEXT,
    "generatedAt" DATETIME,
    "processingTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_content_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ai_content" ("aiModel", "createdAt", "generatedAt", "id", "productId", "specifications", "status", "tags", "updatedAt") SELECT "aiModel", "createdAt", "generatedAt", "id", "productId", "specifications", "status", "tags", "updatedAt" FROM "ai_content";
DROP TABLE "ai_content";
ALTER TABLE "new_ai_content" RENAME TO "ai_content";
CREATE UNIQUE INDEX "ai_content_productId_key" ON "ai_content"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
