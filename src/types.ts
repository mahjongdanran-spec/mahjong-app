export interface Member {
  id: string;
  name: string;
  created_at: string;
}

export interface MatchResult {
  id: string;
  match_id: string;
  member_id: string;
  placement: 1 | 2 | 3 | 4;
}

export interface Match {
  id: string;
  date: string;
  player_count: 3 | 4;
  created_by?: string;
  created_at: string;
  results?: MatchResult[];
}

export type PointType = '来店' | '新規来店' | '月間MVP' | 'その他';

export interface PointHistory {
  id: string;
  member_id: string;
  points_changed: number;
  point_type: PointType;
  reason: string;
  created_by?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  role: 'admin' | 'staff' | 'user';
  member_id: string | null;
  created_at: string;
}
