import { useState, useEffect } from 'react';
import { getMembers, updateMemberName } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Member } from '../types';
import { UserPlus, List, Pencil, Check, X } from 'lucide-react';

const AdminMembers = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setMembers(await getMembers());
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim()) return;
    setSaving(true);
    setAddError('');
    const { data, error } = await supabase.functions.invoke('create-member', {
      body: { name: newMemberName.trim(), email: newMemberEmail.trim(), password: newMemberPassword.trim() },
    });
    if (error || data?.error) {
      setAddError(data?.error || error?.message || '登録に失敗しました');
      setSaving(false);
      return;
    }
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPassword('');
    await load();
    setSaving(false);
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditingName(member.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setSaving(true);
    await updateMemberName(id, editingName.trim());
    setEditingId(null);
    await load();
    setSaving(false);
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
      {isAdmin && (
        <div className="card">
          <h2 style={{ fontSize: '1.2rem' }}>
            <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            新規会員登録
          </h2>
          <form onSubmit={handleAddMember} className="mt-4">
            <div className="form-group">
              <label className="form-label">会員名</label>
              <input
                type="text"
                className="form-control"
                placeholder="例：山田 太郎"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">メールアドレス</label>
              <input
                type="email"
                className="form-control"
                placeholder="example@email.com"
                value={newMemberEmail}
                onChange={e => setNewMemberEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">パスワード</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={newMemberPassword}
                onChange={e => setNewMemberPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {addError && <p className="error-msg">{addError}</p>}
            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: '1rem' }}
              disabled={saving}
            >
              {saving ? '登録中...' : '会員を登録する'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: '1.2rem' }}>
          <List size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          登録済み会員一覧
          <span
            className="badge"
            style={{ marginLeft: '0.5rem', fontWeight: 600, fontSize: '0.75rem' }}
          >
            {members.length} 名
          </span>
        </h2>
        <div
          className="list-container mt-4"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          {members.length === 0 ? (
            <p className="text-muted text-center py-4">登録されている会員はいません。</p>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                className="card"
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {editingId === member.id ? (
                  <>
                    <input
                      type="text"
                      className="form-control"
                      style={{
                        marginRight: '0.5rem',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.9rem',
                        flex: 1,
                      }}
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(member.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(member.id)}
                        className="btn-icon btn-icon-success"
                        disabled={saving}
                      >
                        <Check size={16} />
                      </button>
                      <button onClick={cancelEdit} className="btn-icon">
                        <X size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 700 }}>{member.name}</span>
                    <div className="flex align-center gap-2">
                      <span className="badge" style={{ fontSize: '0.7rem' }}>
                        {member.id.slice(0, 8)}
                      </span>
                      {isAdmin && (
                        <button onClick={() => startEdit(member)} className="btn-icon">
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMembers;
