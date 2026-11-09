-- ==============================================================================
-- Supabase Row Level Security (RLS) Policies
-- Optional: Enable RLS on tables when using Supabase Direct Client / PostgREST
-- Note: When accessed via the Node.js Express backend using the connection string,
-- the backend acts as a trusted service role with session authentication.
-- ==============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Build" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bug" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BugComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyUpdate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;

-- Allow full access to postgres / service_role (used by Express backend)
CREATE POLICY "Full access for backend service role" ON "User" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "Project" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "ProjectMember" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "Resource" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "Build" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "Bug" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "BugComment" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "DailyUpdate" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "Notification" FOR ALL USING (true);
CREATE POLICY "Full access for backend service role" ON "ActivityLog" FOR ALL USING (true);
