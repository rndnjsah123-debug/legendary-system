'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Download, RefreshCw, Search, ShieldCheck, Sprout, Trash2 } from 'lucide-react';

type Comment = { id: string; name: string; body: string; createdAt: string };
type Post = { id: string; name: string; body: string; createdAt: string; comments: Comment[]; reactions?: Record<string, number> };
const REACTION_LABELS: [string, string][] = [['heart', '❤️'], ['thumbs', '👍'], ['pray', '🙏'], ['smile', '😊'], ['tear', '😢']];
function reactionText(p: Post) {
  return REACTION_LABELS.filter(([k]) => (p.reactions?.[k] || 0) > 0).map(([k, e]) => `${e} ${p.reactions![k]}`).join('  ');
}

function fmt(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Admin() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setError('');
    try {
      const r = await fetch('/api/admin/posts', { cache: 'no-store' });
      const d = (await r.json()) as { posts?: Post[]; error?: string };
      if (r.status === 401) {
        setAuthorized(false);
        return;
      }
      if (!r.ok) throw Error(d.error);
      setPosts(d.posts || []);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : '글 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/admin/status', { cache: 'no-store' })
      .then((r) => r.json() as Promise<{ authorized: boolean }>)
      .then((d) => {
        setAuthorized(d.authorized);
        if (d.authorized) loadPosts();
      })
      .catch(() => setError('연결을 확인하고 새로고침해 주세요.'));
  }, [loadPosts]);

  async function login(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw Error(d.error || '로그인하지 못했습니다.');
      setPassword('');
      setAuthorized(true);
      loadPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setAuthorized(false);
    setPosts([]);
    setNotice('');
  }

  async function download(kind: 'posts' | 'comments') {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(kind === 'posts' ? '/api/admin/export' : '/api/admin/export-comments', { cache: 'no-store' });
      if (!r.ok) throw Error(((await r.json()) as { error: string }).error);
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = kind === 'posts' ? '수지함께하는교회_2026특새_은혜나눔.csv' : '수지함께하는교회_2026특새_댓글.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : '다운로드 실패');
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Post) {
    if (!window.confirm(`"${p.name}" 님의 글을 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return;
    setDeleting(p.id);
    setError('');
    setNotice('');
    try {
      const r = await fetch(`/api/admin/posts?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (r.status === 401) {
        setAuthorized(false);
        return;
      }
      if (!r.ok && r.status !== 404) throw Error(d.error || '삭제하지 못했습니다.');
      setPosts((list) => list.filter((x) => x.id !== p.id));
      setNotice(`"${p.name}" 님의 글을 삭제했어요. 정원에는 잠시 후(최대 20초) 반영돼요.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제하지 못했습니다.');
    } finally {
      setDeleting(null);
    }
  }

  async function removeComment(p: Post, c: Comment) {
    if (!window.confirm(`"${c.name}" 님의 댓글을 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return;
    setDeleting(c.id);
    setError('');
    setNotice('');
    try {
      const r = await fetch(`/api/admin/comments?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (r.status === 401) {
        setAuthorized(false);
        return;
      }
      if (!r.ok && r.status !== 404) throw Error(d.error || '삭제하지 못했습니다.');
      setPosts((list) =>
        list.map((x) => (x.id === p.id ? { ...x, comments: x.comments.filter((y) => y.id !== c.id) } : x))
      );
      setNotice(`"${c.name}" 님의 댓글을 삭제했어요. 정원에는 잠시 후(최대 20초) 반영돼요.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제하지 못했습니다.');
    } finally {
      setDeleting(null);
    }
  }

  const totalComments = posts.reduce((n, p) => n + p.comments.length, 0);
  const filtered = posts.filter(
    (p) =>
      !query ||
      (p.name + ' ' + p.body + ' ' + p.comments.map((c) => c.name + ' ' + c.body).join(' ')).includes(query)
  );

  return (
    <main className="admin-page">
      <a href="/" className="back">
        <ArrowLeft size={16} /> 은혜의 정원으로
      </a>
      <section className={'admin-card' + (authorized ? ' wide' : '')}>
        <span className="modal-icon">
          <ShieldCheck />
        </span>
        <div className="eyebrow dark">GARDEN KEEPER</div>
        <h1>은혜의 정원 관리</h1>

        {authorized === null ? (
          <p>관리자 권한을 확인하고 있어요…</p>
        ) : authorized ? (
          <>
            <p>
              성도님들이 나눠 주신 이야기를 확인하고,
              <br />
              부적절한 글은 삭제할 수 있어요.
            </p>
            <div className="admin-toolbar">
              <label className="search">
                <Search size={16} />
                <input
                  aria-label="이름 또는 내용 검색"
                  placeholder="이름이나 내용으로 찾기"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button className="ghost" onClick={loadPosts} disabled={loadingPosts}>
                <RefreshCw size={15} /> 새로고침
              </button>
              <button className="primary" disabled={busy} onClick={() => download('posts')}>
                <Download size={16} />
                {busy ? '파일 준비 중…' : '글 CSV'}
              </button>
              <button className="primary" disabled={busy} onClick={() => download('comments')}>
                <Download size={16} />
                댓글 CSV
              </button>
            </div>
            <p className="privacy">
              글 {posts.length.toLocaleString()}개 · 댓글 {totalComments.toLocaleString()}개{query && ` · 검색 결과 글 ${filtered.length.toLocaleString()}개`}
              <br />
              삭제한 글·댓글은 되돌릴 수 없어요. 글을 지우면 그 글의 댓글도 함께 지워져요. 필요하면 먼저 CSV로 백업해 두세요.
            </p>
            {notice && <p className="notice">{notice}</p>}

            {loadingPosts && posts.length === 0 ? (
              <p>글을 불러오고 있어요…</p>
            ) : filtered.length === 0 ? (
              <p>{posts.length === 0 ? '아직 올라온 글이 없어요.' : '검색 결과가 없어요.'}</p>
            ) : (
              <ul className="admin-list">
                {filtered.map((p) => (
                  <li key={p.id} className="admin-post">
                    <div className="admin-post-head">
                      <div>
                        <b>{p.name}</b>
                        <small>{fmt(p.createdAt)}</small>
                        {reactionText(p) && <small className="admin-reacts">{reactionText(p)}</small>}
                      </div>
                      <button className="danger" disabled={deleting === p.id} onClick={() => remove(p)}>
                        <Trash2 size={14} /> {deleting === p.id ? '삭제 중…' : '삭제'}
                      </button>
                    </div>
                    <p>{p.body}</p>
                    {p.comments.length > 0 && (
                      <ul className="admin-comments">
                        {p.comments.map((c) => (
                          <li key={c.id} className="admin-comment">
                            <div>
                              <b>{c.name}</b> <small>{fmt(c.createdAt)}</small>
                              <span>{c.body}</span>
                            </div>
                            <button
                              className="danger small"
                              disabled={deleting === c.id}
                              onClick={() => removeComment(p, c)}
                            >
                              <Trash2 size={12} /> {deleting === c.id ? '삭제 중…' : '삭제'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button className="admin-signout" onClick={logout}>
              로그아웃
            </button>
          </>
        ) : (
          <form onSubmit={login}>
            <p className="privacy">
              관리자 비밀번호를 입력해 주세요.
              <br />
              일반 성도님은 로그인 없이 글을 쓰실 수 있습니다.
            </p>
            <label>
              비밀번호
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="비밀번호"
              />
            </label>
            <button className="primary submit" type="submit" disabled={busy || !password}>
              {busy ? '확인 중…' : '관리자 로그인'} <Sprout size={18} />
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
