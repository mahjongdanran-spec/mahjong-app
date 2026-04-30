import { useState, useEffect } from 'react';
import { getMatches, getMembers, deleteMatch } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import type { Match, Member } from '../types';
import { Calendar, Trash2 } from 'lucide-react';

type Period = 'all' | 'monthly';

const MatchHistory = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [matches, setMatches] = useState<Match[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [period, setPeriod] = useState<Period>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [mt, m] = await Promise.all([getMatches(), getMembers()]);
    setMatches(mt);
    setMembers(m);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const getMemberName = (id: string) =>
    members.find(m => m.id === id)?.name || '不明';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const now = new Date();
  const filteredMatches =
    period === 'monthly'
      ? matches.filter(m => {
          const d = new Date(m.date);
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth()
          );
        })
      : matches;

  const handleDelete = async (id: string) => {
    if (!window.confirm('この対戦結果を削除しますか？この操作は取り消せません。')) return;
    await deleteMatch(id);
    await load();
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2 style={{ marginBottom: 0 }}>対戦履歴</h2>
        <div className="period-toggle">
          <button
            className={`period-btn ${period === 'all' ? 'active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            全期間
          </button>
          <button
            className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            今月
          </button>
        </div>
      </div>

      <div className="mt-4">
        {filteredMatches.length === 0 ? (
          <div className="card text-center">
            <p className="text-muted">履歴がありません。</p>
          </div>
        ) : (
          filteredMatches.map(match => {
            const sortedResults = [...(match.results || [])].sort(
              (a, b) => a.placement - b.placement
            );
            return (
              <div key={match.id} className="history-item">
                <div className="history-header">
                  <div
                    className="flex align-center gap-2 text-muted"
                    style={{ fontWeight: 700 }}
                  >
                    <Calendar size={14} />
                    {formatDate(match.date)}
                  </div>
                  <div className="flex align-center gap-2">
                    <div className="badge" style={{ background: '#F2F2F7' }}>
                      {match.player_count ?? 3}人戦
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(match.id)}
                        className="btn-icon-danger"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="history-grid">
                  {sortedResults.map((res, idx) => (
                    <div key={res.id || idx} className={`rank-pill rank-${res.placement}`}>
                      <span>{res.placement}着</span>
                      <span style={{ fontWeight: 800 }}>{getMemberName(res.member_id)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MatchHistory;
