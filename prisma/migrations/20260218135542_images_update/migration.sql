/*
  Warnings:

  - You are about to drop the column `usersId` on the `Images` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `urlExpirationDate` to the `Images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Images` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Images" DROP CONSTRAINT "Images_usersId_fkey";

-- AlterTable
ALTER TABLE "Images" DROP COLUMN "usersId",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "urlExpirationDate" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
