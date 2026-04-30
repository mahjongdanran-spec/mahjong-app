import { useState, useEffect } from 'react';
import { getMembers, addPointHistory, getPointHistory, deletePointHistory } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import type { Member, PointHistory, PointType } from '../types';
import { Coins, Clock, Trash2, CheckCircle } from 'lucide-react';

const POINT_TYPES: { type: PointType; label: string; defaultPts: number; color: string }[] = [
  { type: '来店', label: '来店ポイント', defaultPts: 100, color: 'var(--primary)' },
  { type: '新規来店', label: '新規来店ポイント', defaultPts: 300, color: 'var(--success)' },
  { type: '月間MVP', label: '月間MVPポイント', defaultPts: 500, color: '#FFD700' },
  { type: 'その他', label: 'その他', defaultPts: 0, color: 'var(--text-muted)' },
];

const AdminPoints = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [members, setMembers] = useState<Member[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [pointType, setPointType] = useState<PointType>('来店');
  const [pointDelta, setPointDelta] = useState<number | ''>(100);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  const load = async () => {
    const [m, h] = await Promise.all([getMembers(), getPointHistory()]);
    setMembers(m);
    setPointHistory(h);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handleTypeChange = (t: PointType) => {
    setPointType(t);
    const cfg = POINT_TYPES.find(p => p.type === t);
    if (cfg && cfg.defaultPts !== 0) setPointDelta(cfg.defaultPts);
  };

  const handleUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || pointDelta === '' || pointDelta === 0) return;
    setSaving(true);
    await addPointHistory(
      selectedMemberId,
      Number(pointDelta),
      pointType,
      reason.trim()
    );
    const memberName = members.find(m => m.id === selectedMemberId)?.name || '';
    setSuccess(`${memberName} に ${Number(pointDelta) > 0 ? '+' : ''}${pointDelta} pt（${pointType}）を付与しました。`);
    setPointDelta(POINT_TYPES.find(p => p.type === pointType)?.defaultPts || 0);
    setReason('');
    await load();
    setSaving(false);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('このポイント記録を削除しますか？この操作は取り消せません。')) return;
    await deletePointHistory(id);
    await load();
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || '不明';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  if (loading) {
    return <div className="loading-center"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="animate-fade">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Coins size={20} color="var(--primary)" />
          <h2 style={{ marginBottom: 0 }}>ポイント付与</h2>
        </div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          来店ポイント・新規来店・月間MVPなどを会員に付与します。
        </p>

        {success && (
          <div className="alert-success" style={{ marginBottom: '1rem' }}>
            <CheckCircle size={15} />
            {success}
          </div>
        )}

        <form onSubmit={handleUpdatePoints}>
          <div className="form-group">
            <label className="form-label">会員を選択</label>
            <select
              className="form-control"
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
              required
            >
              <option value="">-- 会員を選択してください --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ポイント種別</label>
            <div className="point-type-grid">
              {POINT_TYPES.map(cfg => (
                <button
                  key={cfg.type}
                  type="button"
                  className={`point-type-btn ${pointType === cfg.type ? 'active' : ''}`}
                  style={pointType === cfg.type ? { borderColor: cfg.color, color: cfg.color, background: cfg.color + '14' } : {}}
                  onClick={() => handleTypeChange(cfg.type)}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ポイント数</label>
            <input
              type="number"
              className="form-control"
              value={pointDelta}
              onChange={e => setPointDelta(e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="例：100"
              required
              style={{ fontWeight: 800, fontSize: '1.1rem' }}
            />
            <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.35rem' }}>
              ※減算する場合はマイナスで入力（例：-100）
            </p>
          </div>

          {pointType === 'その他' && (
            <div className="form-group">
              <label className="form-label">理由・メモ</label>
              <input
                type="text"
                className="form-control"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="例：キャンペーンボーナス"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ padding: '1rem' }}
            disabled={saving || !selectedMemberId || pointDelta === '' || pointDelta === 0}
          >
            {saving ? '付与中...' : `${selectedMemberId ? getMemberName(selectedMemberId) + ' に' : ''}ポイントを付与する`}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Clock size={17} color="var(--text-muted)" />
          <h2 style={{ fontSize: '1rem', marginBottom: 0 }}>ポイント付与履歴</h2>
        </div>
        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {pointHistory.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '1.5rem' }}>履歴がありません。</p>
          ) : (
            pointHistory.map(h => (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.7rem 0',
                  borderBottom: '1px solid var(--border)',
                  gap: '0.5rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getMemberName(h.member_id)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    <span className="history-type-badge">{h.point_type || h.reason}</span>
                    {h.reason && h.reason !== h.point_type && (
                      <span style={{ marginLeft: '0.35rem' }}>· {h.reason}</span>
                    )}
                    <span style={{ marginLeft: '0.35rem' }}>· {formatDate(h.created_at)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: h.points_changed >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {h.points_changed > 0 ? '+' : ''}{h.points_changed} pt
                  </span>
                  {isAdmin && (
                    <button className="btn-icon-danger" onClick={() => handleDelete(h.id)} title="削除">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPoints;
