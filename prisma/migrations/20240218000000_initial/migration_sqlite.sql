-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "walletAddress" TEXT NOT NULL,
    "publicKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Agent" ("createdAt", "description", "id", "isActive", "name", "publicKey", "type", "updatedAt", "walletAddress") SELECT "createdAt", "description", "id", "isActive", "name", "publicKey", "type", "updatedAt", "walletAddress" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE UNIQUE INDEX "Agent_walletAddress_key" ON "Agent"("walletAddress");
CREATE INDEX "Agent_type_idx" ON "Agent"("type");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "script" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "ipfsHash" TEXT,
    "tokenId" TEXT,
    "chain" TEXT,
    "contractAddress" TEXT,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "streamCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("chain", "contractAddress", "createdAt", "id", "ipfsHash", "prompt", "status", "streamCount", "thumbnailUrl", "title", "tokenId", "totalRevenue", "updatedAt", "videoUrl", "script") SELECT "chain", "contractAddress", "createdAt", "id", "ipfsHash", "prompt", "status", "streamCount", "thumbnailUrl", "title", "tokenId", "totalRevenue", "updatedAt", "videoUrl", "script" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
CREATE TABLE "new_ProjectAgent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "output" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectAgent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProjectAgent" ("agentId", "completedAt", "createdAt", "id", "output", "projectId", "role", "startedAt", "status") SELECT "agentId", "completedAt", "createdAt", "id", "output", "projectId", "role", "startedAt", "status" FROM "ProjectAgent";
DROP TABLE "ProjectAgent";
ALTER TABLE "new_ProjectAgent" RENAME TO "ProjectAgent";
CREATE UNIQUE INDEX "ProjectAgent_projectId_agentId_key" ON "ProjectAgent"("projectId", "agentId");
CREATE INDEX "ProjectAgent_status_idx" ON "ProjectAgent"("status");
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ipfsHash" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("createdAt", "id", "ipfsHash", "metadata", "name", "projectId", "type", "url") SELECT "createdAt", "id", "ipfsHash", "metadata", "name", "projectId", "type", "url" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE INDEX "Asset_type_idx" ON "Asset"("type");
CREATE TABLE "new_Revenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "agentId" TEXT,
    "source" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "tokenSymbol" TEXT NOT NULL DEFAULT 'VVV',
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Revenue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Revenue_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Revenue" ("agentId", "amount", "createdAt", "id", "projectId", "source", "tokenSymbol", "txHash") SELECT "agentId", "amount", "createdAt", "id", "projectId", "source", "tokenSymbol", "txHash" FROM "Revenue";
DROP TABLE "Revenue";
ALTER TABLE "new_Revenue" RENAME TO "Revenue";
CREATE INDEX "Revenue_createdAt_idx" ON "Revenue"("createdAt");
CREATE INDEX "Revenue_agentId_idx" ON "Revenue"("agentId");
CREATE TABLE "new_FeeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scriptAgent" REAL NOT NULL DEFAULT 0.40,
    "directorAgent" REAL NOT NULL DEFAULT 0.20,
    "renderingAgent" REAL NOT NULL DEFAULT 0.10,
    "assetAgent" REAL NOT NULL DEFAULT 0.10,
    "voiceAgent" REAL NOT NULL DEFAULT 0.05,
    "humanProducer" REAL NOT NULL DEFAULT 0.10,
    "platformFee" REAL NOT NULL DEFAULT 0.05,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FeeConfig" ("assetAgent", "createdAt", "directorAgent", "humanProducer", "id", "isActive", "name", "platformFee", "renderingAgent", "scriptAgent", "updatedAt", "voiceAgent") SELECT "assetAgent", "createdAt", "directorAgent", "humanProducer", "id", "isActive", "name", "platformFee", "renderingAgent", "scriptAgent", "updatedAt", "voiceAgent" FROM "FeeConfig";
DROP TABLE "FeeConfig";
ALTER TABLE "new_FeeConfig" RENAME TO "FeeConfig";
CREATE UNIQUE INDEX "FeeConfig_name_key" ON "FeeConfig"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
