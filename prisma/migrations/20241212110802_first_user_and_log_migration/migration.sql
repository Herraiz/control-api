-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NO_BINARY');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'DELETED_BY_USER', 'DELETED_BY_ADMIN');

-- CreateEnum
CREATE TYPE "UserTimestampActionType" AS ENUM ('ACTIVATION_SEND', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "LoginLogType" AS ENUM ('NEW_TOKEN', 'RENEW_TOKEN');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Control-Core',
    "inputModel" TEXT NOT NULL,
    "inputModelId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "outputModel" TEXT,
    "outputModelId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "message" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "aclRole" "UserRole" NOT NULL DEFAULT 'USER',
    "name" TEXT,
    "lastname" TEXT,
    "birthday" TIMESTAMP(3),
    "gender" "Gender",
    "newsletterOptIn" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTimestampAction" (
    "userId" TEXT NOT NULL,
    "actionType" "UserTimestampActionType" NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "ip" TEXT,
    "type" "LoginLogType" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserTimestampAction_userId_actionType_key" ON "UserTimestampAction"("userId", "actionType");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
