import { supabase } from './supabase';
import type { Member, Match, PointHistory, PointType } from '../types';

export const getMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const addMember = async (name: string): Promise<Member> => {
  const { data, error } = await supabase
    .from('members')
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateMemberName = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase.from('members').update({ name }).eq('id', id);
  if (error) throw error;
};

export const getMatches = async (): Promise<Match[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select('*, results:match_results(*)')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []) as Match[];
};

export const addMatch = async (
  results: { member_id: string; placement: 1 | 2 | 3 | 4 }[],
  player_count: 3 | 4
): Promise<void> => {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({ date: new Date().toISOString(), player_count })
    .select()
    .single();
  if (matchError) throw matchError;

  const { error: resultsError } = await supabase
    .from('match_results')
    .insert(results.map(r => ({ ...r, match_id: match.id })));
  if (resultsError) throw resultsError;
};

export const deleteMatch = async (id: string): Promise<void> => {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
};

export const getPointHistory = async (memberId?: string): Promise<PointHistory[]> => {
  let query = supabase
    .from('point_history')
    .select('*')
    .order('created_at', { ascending: false });
  if (memberId) query = query.eq('member_id', memberId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const addPointHistory = async (
  member_id: string,
  points_changed: number,
  point_type: PointType,
  reason: string
): Promise<void> => {
  const { error } = await supabase
    .from('point_history')
    .insert({ member_id, points_changed, point_type, reason: reason || point_type });
  if (error) throw error;
};

export const deletePointHistory = async (id: string): Promise<void> => {
  const { error } = await supabase.from('point_history').delete().eq('id', id);
  if (error) throw error;
};

export interface MemberStats {
  member: Member;
  totalMatches: number;
  placements: { 1: number; 2: number; 3: number; 4: number };
  totalPoints: number;
  avgRank: number;
}

export const computeStats = (
  member: Member,
  allMatches: Match[],
  allHistory: PointHistory[],
  period: 'all' | 'today' | 'monthly' | 'yearly'
): MemberStats => {
  const now = new Date();

  const isInPeriod = (iso: string) => {
    if (period === 'all') return true;
    const d = new Date(iso);
    if (period === 'today') {
      return d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
    }
    if (period === 'yearly') return d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const myResults = allMatches
    .filter(m => isInPeriod(m.date))
    .flatMap(m => m.results || [])
    .filter(r => r.member_id === member.id);

  const myHistory = allHistory.filter(
    h => h.member_id === member.id && isInPeriod(h.created_at)
  );

  const placements: { 1: number; 2: number; 3: number; 4: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
  myResults.forEach(r => { placements[r.placement as 1 | 2 | 3 | 4]++; });

  const totalPoints = myHistory.reduce((sum, h) => sum + h.points_changed, 0);
  const totalMatches = myResults.length;
  const totalRank = placements[1] * 1 + placements[2] * 2 + placements[3] * 3 + placements[4] * 4;
  const avgRank = totalMatches > 0 ? totalRank / totalMatches : 0;

  return { member, totalMatches, placements, totalPoints, avgRank };
};
