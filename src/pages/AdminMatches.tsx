import { useState, useEffect } from 'react';
import { getMembers, addMatch } from '../lib/db';
import type { Member } from '../types';
import { Trophy, Star, Target, Users, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';

type ResultRow = {
  placement: 1 | 2 | 3 | 4;
  memberId: string;
};

const placementConfig = [
  { icon: <Trophy size={14} />, color: '#FF3B30', label: '1着' },
  { icon: <Star size={14} />, color: '#007AFF', label: '2着' },
  { icon: <Target size={14} />, color: '#FF9500', label: '3着' },
  { icon: <Users size={14} />, color: '#8E8E93', label: '4着' },
];

const defaultResults = (count: 3 | 4): ResultRow[] =>
  ([1, 2, 3, 4] as const).slice(0, count).map(p => ({ placement: p, memberId: '' }));

const AdminMatches = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [playerCount, setPlayerCount] = useState<3 | 4>(3);
  const [results, setResults] = useState<ResultRow[]>(defaultResults(3));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getMembers().then(setMembers);
  }, []);

  const togglePlayerCount = () => {
    const next = playerCount === 3 ? 4 : 3;
    setPlayerCount(next);
    setResults(defaultResults(next));
    setErrors([]);
    setSuccess(false);
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const ids = results.map(r => r.memberId);
    if (ids.some(id => !id)) errs.push('すべての順位の会員を選択してください。');
    else if (new Set(ids).size < playerCount) errs.push('同じ会員を重複して選択することはできません。');
    return errs;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSaving(true);
    try {
      await addMatch(
        results.map(r => ({ member_id: r.memberId, placement: r.placement })),
        playerCount
      );
      setSuccess(true);
      setResults(defaultResults(playerCount));
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setErrors(['保存中にエラーが発生しました。もう一度お試しください。']);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (index: number, memberId: string) => {
    setResults(prev => {
      const next = [...prev];
      next[index] = { ...next[index], memberId };
      return next;
    });
    if (errors.length > 0) setErrors([]);
    if (success) setSuccess(false);
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || '';

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h2>対戦結果入力</h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
            対戦の着順を記録します。ポイントは別途「ポイント更新」から付与してください。
          </p>
        </div>
        <button
          type="button"
          onClick={togglePlayerCount}
          className={`player-count-btn ${playerCount === 4 ? 'active' : ''}`}
        >
          {playerCount === 3 ? (
            <><Plus size={13} /> 4人目を追加</>
          ) : (
            <><X size={13} /> 3人に戻す</>
          )}
        </button>
      </div>

      {success && (
        <div className="alert-success">
          <CheckCircle size={16} />
          対戦結果を保存しました！
        </div>
      )}

      {errors.length > 0 && (
        <div className="alert-error">
          {errors.map((e, i) => (
            <div key={i} className="flex align-center gap-2">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {e}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handlePreSubmit}>
        <div className="placement-grid">
          {results.map((result, index) => {
            const cfg = placementConfig[index];
            const usedIds = results.filter((_, i) => i !== index).map(r => r.memberId).filter(Boolean);
            return (
              <div key={index} className="placement-card" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <div className="placement-header" style={{ color: cfg.color }}>
                  {cfg.icon}
                  <span>{cfg.label}</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select
                    className="form-control"
                    value={result.memberId}
                    onChange={e => handleChange(index, e.target.value)}
                  >
                    <option value="">-- 会員を選択 --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} disabled={usedIds.includes(m.id)}>
                        {m.name}{usedIds.includes(m.id) ? ' (選択済)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          style={{ padding: '1rem', marginTop: '1rem' }}
          disabled={saving}
        >
          {saving ? '保存中...' : '内容を確認して保存'}
        </button>
      </form>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              この内容で登録しますか？
            </h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              {playerCount}人対戦 · {new Date().toLocaleDateString('ja-JP')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                }}>
                  <span style={{ fontWeight: 800, color: placementConfig[i].color, fontSize: '0.85rem', width: '28px' }}>
                    {placementConfig[i].label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {getMemberName(r.memberId)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn w-full"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', padding: '0.85rem', border: '1px solid var(--border)' }}
                onClick={() => setShowConfirm(false)}
              >
                修正する
              </button>
              <button
                className="btn btn-primary w-full"
                style={{ padding: '0.85rem' }}
                onClick={handleConfirm}
              >
                登録する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMatches;
