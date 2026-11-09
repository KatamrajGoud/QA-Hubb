-- ==============================================================================
-- Company Project & QA Hub - Supabase PostgreSQL Schema Script
-- Generated for PostgreSQL 14+ / Supabase
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. User Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DEVELOPER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- ------------------------------------------------------------------------------
-- 2. Project Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "techStack" TEXT NOT NULL DEFAULT '',
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Project_code_idx" ON "Project"("code");
CREATE INDEX IF NOT EXISTS "Project_ownerId_idx" ON "Project"("ownerId");

-- ------------------------------------------------------------------------------
-- 3. ProjectMember Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ProjectMember" (
    "id" TEXT PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'DEVELOPER',
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");
CREATE INDEX IF NOT EXISTS "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- ------------------------------------------------------------------------------
-- 4. Resource Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Resource" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Resource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Resource_projectId_idx" ON "Resource"("projectId");

-- ------------------------------------------------------------------------------
-- 5. Build Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Build" (
    "id" TEXT PRIMARY KEY,
    "version" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildUrl" TEXT NOT NULL DEFAULT '',
    "releaseNotes" TEXT NOT NULL DEFAULT '',
    "qaStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "testingNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "uploadedById" TEXT,
    CONSTRAINT "Build_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Build_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Build_projectId_idx" ON "Build"("projectId");
CREATE INDEX IF NOT EXISTS "Build_uploadedById_idx" ON "Build"("uploadedById");

-- ------------------------------------------------------------------------------
-- 6. Bug Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Bug" (
    "id" TEXT PRIMARY KEY,
    "bugId" TEXT NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "module" TEXT NOT NULL DEFAULT '',
    "stepsToRepro" TEXT NOT NULL DEFAULT '',
    "expected" TEXT NOT NULL DEFAULT '',
    "actual" TEXT NOT NULL DEFAULT '',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "evidenceUrl" TEXT NOT NULL DEFAULT '',
    "retestNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "buildId" TEXT,
    "fixedBuildId" TEXT,
    "reporterId" TEXT,
    "assigneeId" TEXT,
    CONSTRAINT "Bug_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bug_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bug_fixedBuildId_fkey" FOREIGN KEY ("fixedBuildId") REFERENCES "Build"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bug_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bug_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Bug_projectId_idx" ON "Bug"("projectId");
CREATE INDEX IF NOT EXISTS "Bug_buildId_idx" ON "Bug"("buildId");
CREATE INDEX IF NOT EXISTS "Bug_reporterId_idx" ON "Bug"("reporterId");
CREATE INDEX IF NOT EXISTS "Bug_assigneeId_idx" ON "Bug"("assigneeId");
CREATE INDEX IF NOT EXISTS "Bug_status_idx" ON "Bug"("status");

-- ------------------------------------------------------------------------------
-- 7. BugComment Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BugComment" (
    "id" TEXT PRIMARY KEY,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bugId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BugComment_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "Bug"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BugComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BugComment_bugId_idx" ON "BugComment"("bugId");
CREATE INDEX IF NOT EXISTS "BugComment_userId_idx" ON "BugComment"("userId");

-- ------------------------------------------------------------------------------
-- 8. DailyUpdate Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "DailyUpdate" (
    "id" TEXT PRIMARY KEY,
    "workDone" TEXT NOT NULL DEFAULT '',
    "currentTask" TEXT NOT NULL DEFAULT '',
    "blockers" TEXT NOT NULL DEFAULT '',
    "nextSteps" TEXT NOT NULL DEFAULT '',
    "timeSpent" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "DailyUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DailyUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DailyUpdate_userId_idx" ON "DailyUpdate"("userId");
CREATE INDEX IF NOT EXISTS "DailyUpdate_projectId_idx" ON "DailyUpdate"("projectId");

-- ------------------------------------------------------------------------------
-- 9. Notification Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT NOT NULL DEFAULT '',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");

-- ------------------------------------------------------------------------------
-- 10. ActivityLog Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "projectId" TEXT,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX IF NOT EXISTS "ActivityLog_projectId_idx" ON "ActivityLog"("projectId");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC);
