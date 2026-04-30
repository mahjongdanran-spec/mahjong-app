-- Tiger Mahjong Ranking System - Supabase Schema
-- Run this in the Supabase SQL editor after creating a new project

-- =====================
-- Tables
-- =====================

CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- player_count: 3 = 3-player match (default), 4 = optional 4-player
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  player_count INTEGER NOT NULL DEFAULT 3 CHECK (player_count IN (3, 4)),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No points_changed: points are managed separately via point_history
CREATE TABLE match_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  placement INTEGER NOT NULL CHECK (placement BETWEEN 1 AND 4),
  UNIQUE(match_id, placement),
  UNIQUE(match_id, member_id)
);

-- point_type: store-issued point categories (not tied to match placements)
CREATE TABLE point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  points_changed INTEGER NOT NULL,
  point_type TEXT NOT NULL DEFAULT 'その他' CHECK (point_type IN ('来店', '新規来店', '月間MVP', 'その他')),
  reason TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles extends auth.users with role info
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user')),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- Auto-create profile on signup
-- =====================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================
-- Row Level Security
-- =====================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- members: all authenticated users can read; admin/staff can write
CREATE POLICY "members_read" ON members FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_insert" ON members FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "members_update" ON members FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin');

-- matches: all authenticated users can read; admin/staff can insert; admin can delete
CREATE POLICY "matches_read" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_insert" ON matches FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "matches_delete" ON matches FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- match_results: same as matches
CREATE POLICY "match_results_read" ON match_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "match_results_insert" ON match_results FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "match_results_delete" ON match_results FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- point_history: admin/staff read+write; admin can delete
CREATE POLICY "point_history_read" ON point_history FOR SELECT TO authenticated
  USING (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "point_history_insert" ON point_history FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'staff'));
CREATE POLICY "point_history_delete" ON point_history FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

-- profiles: users can read their own; admin/staff can read all
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR get_my_role() IN ('admin', 'staff'));
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin');

-- =====================
-- To create admin user:
-- 1. Sign up via Supabase Auth (or create user in dashboard)
-- 2. Run: UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
-- =====================
