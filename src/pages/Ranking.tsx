import { useState, useEffect } from 'react';
import { getMembers, getMatches, getPointHistory, computeStats } from '../lib/db';
import type { Member, Match, PointHistory } from '../types';
import { Medal, Crown } from 'lucide-react';

type Period = 'all' | 'monthly';

const Ranking = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [period, setPeriod] = useState<Period>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMembers(), getMatches(), getPointHistory()])
      .then(([m, mt, h]) => {
        setMembers(m);
        setMatches(mt);
        setHistory(h);
      })
      .finally(() => setLoading(false));
  }, []);

  const rankedMembers = members
    .map(m => computeStats(m, matches, history, period))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown size={20} color="#FFD700" fill="#FFD700" />;
    if (index === 1) return <Medal size={20} color="#C0C0C0" fill="#C0C0C0" />;
    if (index === 2) return <Medal size={20} color="#CD7F32" fill="#CD7F32" />;
    return (
      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#8E8E93' }}>{index + 1}</span>
    );
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
        <h2 style={{ marginBottom: 0 }}>ランキング</h2>
        <div className="period-toggle">
          <button
            className={`period-btn ${period === 'all' ? 'active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            通算
          </button>
          <button
            className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            今月
          </button>
        </div>
      </div>

      <p className="text-muted mb-4" style={{ fontSize: '0.8rem' }}>
        累積ポイント順（対戦結果 + 手動調整の合計）
      </p>

      <div className="list-container">
        {rankedMembers.length === 0 ? (
          <div className="card text-center">
            <p className="text-muted">会員データがありません。</p>
          </div>
        ) : (
          rankedMembers.map((s, index) => (
            <div
              key={s.member.id}
              className="card"
              style={{
                padding: '1rem',
                borderLeft:
                  index < 3
                    ? `4px solid ${
                        index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                      }`
                    : '',
              }}
            >
              <div className="flex align-center justify-between">
                <div className="flex align-center gap-4">
                  <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{s.member.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {s.totalMatches} 試合 ・ 平均着順{' '}
                      {s.totalMatches > 0 ? s.avgRank.toFixed(2) : '---'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: s.totalPoints >= 0 ? 'var(--primary)' : 'var(--danger)',
                      fontSize: '1.1rem',
                    }}
                  >
                    {s.totalPoints > 0 ? '+' : ''}{s.totalPoints}
                    <span style={{ fontSize: '0.75rem' }}> pts</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Ranking;
