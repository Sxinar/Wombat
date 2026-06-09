import './styles/theme.css';
import { buildThread } from './core/thread';
import { escapeHtml } from './core/dom';
import type { CommentRecord, CommentThread } from './types/comment';
import { supabaseService } from './services/supabase-service';

type ViewMode = 'pending' | 'approved';
type Density = 'comfortable' | 'compact';

class WombatAdmin extends HTMLElement {
  private viewMode: ViewMode = 'pending';
  private density: Density = 'comfortable';
  private query = '';

  connectedCallback() {
    document.body.classList.add('wombat-admin');
    void this.render();
  }

  async render() {
    this.innerHTML = this.loadingView();
    const session = await supabaseService.getSession();
    if (!session?.accessToken) {
      this.renderLogin();
      return;
    }
    await this.renderDashboard();
  }

  private loadingView() {
    return `
      <div class="shell page-shell">
        <section class="panel">
          <div class="panel-inner">Yönetim paneli hazırlanıyor...</div>
        </section>
      </div>`;
  }

  private renderLogin() {
    this.innerHTML = `
      <div class="shell page-shell">
        <section class="panel">
          <div class="panel-inner">
            <div class="hero">
              <div class="eyebrow">Wombat Admin</div>
              <h1 class="title">Giriş yap</h1>
              <p class="subtitle">Yorumları onaylamak ve yanıtlamak için hesabınla oturum aç.</p>
            </div>
            <form id="login-form" class="field-grid" style="max-width:460px;margin-top:18px">
              <div class="field">
                <label for="email">E-posta</label>
                <input class="input" id="email" name="email" type="email" placeholder="admin@site.com" required />
              </div>
              <div class="field">
                <label for="password">Parola</label>
                <input class="input" id="password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <div class="actions">
                <button class="btn btn-primary" type="submit">Giriş yap</button>
              </div>
              <p id="login-status" class="status" aria-live="polite"></p>
            </form>
          </div>
        </section>
      </div>`;

    const form = this.querySelector<HTMLFormElement>('#login-form');
    const status = this.querySelector<HTMLElement>('#login-status');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!status) return;
      status.textContent = 'Giriş yapılıyor...';
      const data = new FormData(form!);
      try {
        await supabaseService.signIn(String(data.get('email')), String(data.get('password')));
        await this.render();
      } catch (error) {
        console.error(error);
        status.textContent = 'Giriş başarısız.';
      }
    });
  }

  private async renderDashboard() {
    const all = await supabaseService.listAll();
    const filtered = this.query.trim()
      ? all.filter((comment) => {
          const q = this.query.toLowerCase();
          return [comment.name, comment.email, comment.comment, comment.page_id].some((value) =>
            value.toLowerCase().includes(q),
          );
        })
      : all;
    const pending = filtered.filter((c) => !c.is_approved);
    const approved = buildThread(filtered.filter((c) => c.is_approved));
    const densityClass = this.density === 'compact' ? 'density-compact' : 'density-comfortable';

    this.innerHTML = `
      <div class="shell page-shell ${densityClass}">
        <section class="panel">
          <div class="panel-inner">
            <div class="admin-hero">
              <div class="admin-hero__title">
                <div class="eyebrow">Yönetim Paneli</div>
                <h1 class="title">Wombat</h1>
                <p class="subtitle">Bekleyen yorumları onayla, istenmeyenleri kaldır ve yanıtları düzenli biçimde yayınla.</p>
              </div>
              <div class="actions">
                <button id="logout" class="btn btn-ghost">Çıkış yap</button>
              </div>
            </div>

            <div class="admin-grid">
              <div class="admin-column admin-column--summary">
                <div class="stats controls">
                  <div class="stat"><strong>${pending.length}</strong><span>bekleyen</span></div>
                  <div class="stat"><strong>${countComments(approved)}</strong><span>yayındaki yorum</span></div>
                  <div class="stat"><strong>${approved.length}</strong><span>konu başlığı</span></div>
                  <div class="stat">
                    <strong>Arama</strong>
                    <span><input id="query" class="input input-inline" value="${escapeHtml(this.query)}" placeholder="isim, email, yorum, sayfa" /></span>
                  </div>
                  <div class="stat">
                    <strong>Yoğunluk</strong>
                    <span>
                      <select id="density" class="input input-inline">
                        <option value="comfortable" ${this.density === 'comfortable' ? 'selected' : ''}>Rahat</option>
                        <option value="compact" ${this.density === 'compact' ? 'selected' : ''}>Kompakt</option>
                      </select>
                    </span>
                  </div>
                </div>
              </div>

              <div class="admin-column admin-column--context">
                <div class="context-card">
                  <div class="context-card__header">
                    <div>
                      <div class="context-label">Sayfa Bağlamı</div>
                      <div class="context-title">Yorumların ait olduğu içerikler</div>
                    </div>
                    <span class="badge">${this.viewMode === 'pending' ? `${pending.length} kayıt` : `${approved.length} konu`}</span>
                  </div>
                  <div class="context-list">
                    ${renderPageSummary(filtered)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-inner">
            <div class="toolbar">
              <div class="tabs" role="tablist" aria-label="Yorum sekmeleri">
                <button class="tab" data-view="pending" aria-selected="${this.viewMode === 'pending'}">Onay Bekleyenler</button>
                <button class="tab" data-view="approved" aria-selected="${this.viewMode === 'approved'}">Onaylanmış Yorumlar</button>
              </div>
              <span class="badge">${this.viewMode === 'pending' ? `${pending.length} kayıt` : `${approved.length} konu`}</span>
            </div>
            <div class="stack" style="margin-top:16px">
              ${this.viewMode === 'pending'
                ? this.renderPending(pending)
                : this.renderApproved(approved)}
            </div>
          </div>
        </section>
      </div>`;

    this.bindDashboardEvents();
  }

  private renderPending(items: CommentRecord[]) {
    if (!items.length) {
      return `<div class="empty-state">Onay bekleyen yorum yok.</div>`;
    }

    return items.map((item) => `
      <article class="comment-card">
        <div class="comment-meta">
          <div class="avatar" aria-hidden="true">${escapeHtml(initials(item.name))}</div>
          <div style="display:grid;gap:2px">
            <div class="comment-author">${escapeHtml(item.name)}</div>
            <div class="comment-email">${escapeHtml(item.email)}</div>
          </div>
          <span class="badge badge-warning">Bekliyor</span>
        </div>
        <p class="comment-body">${escapeHtml(item.comment)}</p>
        <div class="actions">
          <button class="btn btn-primary" data-approve="${item.id}">Onayla</button>
          <button class="btn btn-danger" data-delete="${item.id}">Sil</button>
        </div>
      </article>`).join('');
  }

  private renderApproved(items: CommentThread[]) {
    if (!items.length) {
      return `<div class="empty-state">Onaylanmış yorum yok.</div>`;
    }

    return items.map(renderAdminThread).join('');
  }

  private bindDashboardEvents() {
    this.querySelector('#logout')?.addEventListener('click', async () => {
      await supabaseService.signOut();
      this.renderLogin();
    });

    this.querySelectorAll<HTMLButtonElement>('.tab').forEach((button) => {
      button.addEventListener('click', async () => {
        this.viewMode = button.dataset.view as ViewMode;
        await this.renderDashboard();
      });
    });

    this.querySelector<HTMLInputElement>('#query')?.addEventListener('input', async (event) => {
      this.query = (event.currentTarget as HTMLInputElement).value;
      await this.renderDashboard();
    });

    this.querySelector<HTMLSelectElement>('#density')?.addEventListener('change', async (event) => {
      this.density = (event.currentTarget as HTMLSelectElement).value as Density;
      await this.renderDashboard();
    });

    this.querySelectorAll<HTMLButtonElement>('[data-approve]').forEach((button) => {
      button.addEventListener('click', async () => {
        await supabaseService.approveComment(button.dataset.approve!);
        await this.renderDashboard();
      });
    });

    this.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        await supabaseService.deleteComment(button.dataset.delete!);
        await this.renderDashboard();
      });
    });

    this.querySelectorAll<HTMLButtonElement>('[data-reply]').forEach((button) => {
      button.addEventListener('click', async () => {
        const comment = window.prompt('Admin yanıtını yazın');
        if (!comment) return;

        await supabaseService.replyToComment(button.dataset.reply!, {
          pageId: button.dataset.page!,
          name: 'Admin',
          email: 'admin@local',
          comment,
        });
        await this.renderDashboard();
      });
    });
  }
}

function renderAdminThread(node: CommentThread): string {
  return `
    <article class="comment-card">
      <div class="comment-meta">
        <div class="avatar" aria-hidden="true">${escapeHtml(initials(node.name))}</div>
        <div style="display:grid;gap:2px">
          <div class="comment-author">${escapeHtml(node.name)}</div>
          <div class="comment-date">${new Date(node.created_at).toLocaleString('tr-TR')}</div>
        </div>
        <span class="badge badge-success">Yayında</span>
      </div>
      <div class="comment-context">
        <div class="comment-context__line"><span>Sayfa</span><strong>${escapeHtml(node.page_id)}</strong></div>
        <div class="comment-context__line"><span>ID</span><strong>${escapeHtml(node.id)}</strong></div>
        <div class="comment-context__line"><span>Parent</span><strong>${escapeHtml(node.parent_id ?? 'root')}</strong></div>
        <div class="comment-context__line"><span>Tarih</span><strong>${new Date(node.created_at).toLocaleString('tr-TR')}</strong></div>
      </div>
      <p class="comment-body">${escapeHtml(node.comment)}</p>
      <div class="actions">
        <button class="btn btn-primary" data-reply="${node.id}" data-page="${node.page_id}">Yanıt ver</button>
      </div>
      ${node.replies.length ? `<div class="reply-thread">${node.replies.map(renderAdminThread).join('')}</div>` : ''}
    </article>`;
}

function countComments(nodes: CommentThread[]): number {
  return nodes.reduce((count, node) => count + 1 + countComments(node.replies), 0);
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'SC';
}

function renderPageSummary(comments: CommentRecord[]): string {
  if (!comments.length) {
    return '<div class="empty-state">Aramaya uyan kayıt yok.</div>';
  }

  const pages = new Map<string, number>();
  for (const comment of comments) {
    pages.set(comment.page_id, (pages.get(comment.page_id) ?? 0) + 1);
  }

  return Array.from(pages.entries())
    .map(
      ([pageId, count]) => `
        <div class="context-item">
          <div class="context-item__title">${escapeHtml(pageId)}</div>
          <div class="context-item__meta">${count} yorum</div>
        </div>`,
    )
    .join('');
}

customElements.define('wombat-admin', WombatAdmin);
