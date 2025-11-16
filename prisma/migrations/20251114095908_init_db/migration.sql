-- CreateTable
CREATE TABLE "GameRule" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "GameRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combatant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Combatant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "combatantId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRule_key_key" ON "GameRule"("key");

-- AddForeignKey
ALTER TABLE "CardTemplate" ADD CONSTRAINT "CardTemplate_combatantId_fkey" FOREIGN KEY ("combatantId") REFERENCES "Combatant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
