import { useState, useEffect } from 'react';
import { getMembers, getMatches, getPointHistory, computeStats } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import type { Member, Match, PointHistory } from '../types';

type Period = 'all' | 'today' | 'monthly' | 'yearly';

const pct = (count: number, total: number) =>
  total === 0 ? '---' : `${((count / total) * 100).toFixed(1)}%`;

const UserDashboard = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMembers(), getMatches(), getPointHistory()])
      .then(([m, mt, h]) => {
        setMembers(m);
        setMatches(mt);
        setHistory(h);
        // non-admin: force own member only
        const defaultId = profile?.member_id || (m.length > 0 ? m[0].id : '');
        setSelectedMemberId(defaultId);
      })
      .finally(() => setLoading(false));
  }, [profile]);

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const stats = selectedMember
    ? computeStats(selectedMember, matches, history, period)
    : null;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Non-admin with no member linkage
  if (!isAdmin && !profile?.member_id) {
    return (
      <div className="animate-fade">
        <div className="card text-center">
          <p className="text-muted">成績データが紐付けられていません。店舗スタッフにお問い合わせください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2 style={{ marginBottom: 0 }}>個人成績</h2>
        <div className="period-toggle">
          <button
            className={`period-btn ${period === 'today' ? 'active' : ''}`}
            onClick={() => setPeriod('today')}
          >
            本日
          </button>
          <button
            className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            月間
          </button>
          <button
            className={`period-btn ${period === 'yearly' ? 'active' : ''}`}
            onClick={() => setPeriod('yearly')}
          >
            年間
          </button>
          <button
            className={`period-btn ${period === 'all' ? 'active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            通算
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="card text-center">
          <p className="text-muted">会員がいません。店舗にお問い合わせください。</p>
        </div>
      ) : (
        <>
          {/* Admin can switch members; regular users see only their own */}
          {isAdmin && (
            <div className="form-group mb-4">
              <select
                className="form-control"
                value={selectedMemberId}
                onChange={e => setSelectedMemberId(e.target.value)}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} さん</option>
                ))}
              </select>
            </div>
          )}

          {!isAdmin && selectedMember && (
            <div className="mb-4" style={{ fontWeight: 700, fontSize: '1rem', padding: '0.5rem 0' }}>
              {selectedMember.name} さんの成績
            </div>
          )}

          {stats && (
            <div className="card" style={{ padding: '0.5rem' }}>
              <table className="stats-table">
                <tbody>
                  <tr>
                    <th>平均着順</th>
                    <td>
                      {stats.totalMatches === 0
                        ? <span className="text-muted">---</span>
                        : stats.avgRank.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <th>打半荘数</th>
                    <td>
                      {stats.totalMatches}
                      <span style={{ fontSize: '0.75rem' }}> 回</span>
                    </td>
                  </tr>
                  <tr>
                    <th>1着</th>
                    <td>
                      {stats.placements[1]}
                      <span style={{ fontSize: '0.75rem' }}> 回</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                        ({pct(stats.placements[1], stats.totalMatches)})
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>2着</th>
                    <td>
                      {stats.placements[2]}
                      <span style={{ fontSize: '0.75rem' }}> 回</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                        ({pct(stats.placements[2], stats.totalMatches)})
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>3着</th>
                    <td>
                      {stats.placements[3]}
                      <span style={{ fontSize: '0.75rem' }}> 回</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                        ({pct(stats.placements[3], stats.totalMatches)})
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>4着</th>
                    <td>
                      {stats.placements[4]}
                      <span style={{ fontSize: '0.75rem' }}> 回</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                        ({pct(stats.placements[4], stats.totalMatches)})
                      </span>
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #FFF0E0' }}>
                    <th style={{ background: 'var(--primary)', color: 'white' }}>合計ポイント</th>
                    <td style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>
                      {stats.totalPoints}
                      <span style={{ fontSize: '0.75rem' }}> pt</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserDashboard;
