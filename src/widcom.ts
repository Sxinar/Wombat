import './styles/theme.css';
import { buildThread } from './core/thread';
import { escapeHtml } from './core/dom';
import type { CommentThread } from './types/comment';
import { supabaseService } from './services/supabase-service';

class WombatWidget extends HTMLElement {
  connectedCallback() {
    void this.render();
  }

  async render() {
    const pageId = new URL(window.location.href).searchParams.get('id') ?? 'default';
    this.innerHTML = this.loadingView();

    try {
      const comments = await supabaseService.listApproved(pageId);
      const thread = buildThread(comments);
      this.innerHTML = this.view(pageId, thread);
      this.bindForm(pageId);
    } catch (error) {
      console.error(error);
      this.innerHTML = this.errorView();
    }
  }

  private loadingView() {
    return `
      <div class="shell">
        <section class="panel">
          <div class="panel-inner">
            <div class="toolbar">
              <div>
                <div class="eyebrow">Wombat Widget</div>
                <h2 class="title" style="font-size:22px;margin-top:10px">Yorumlar yükleniyor</h2>
              </div>
            </div>
            <div class="empty-state" style="margin-top:16px">Yorumlar hazırlanıyor...</div>
          </div>
        </section>
      </div>`;
  }

  private errorView() {
    return `
      <div class="shell">
        <section class="panel">
          <div class="panel-inner">
            <div class="badge badge-warning">Hata</div>
            <h2 class="title" style="font-size:22px;margin-top:10px">Yorumlar şu anda alınamadı</h2>
            <p class="subtitle">Bağlantı ya da yapılandırma tarafında bir sorun olabilir.</p>
          </div>
        </section>
      </div>`;
  }

  private view(pageId: string, thread: CommentThread[]) {
    const totalCount = countComments(thread);
    return `
      <div class="shell page-shell">
        <section class="panel">
          <div class="panel-inner">
            <div class="toolbar">
              <div class="hero">
                <div class="eyebrow">Wombat Widget</div>
                <h2 class="title">Yorumlar</h2>
                <p class="subtitle">Onaylı yorumları ve cevapları temiz, sakin bir akışta gösterir.</p>
              </div>
              <div class="stats">
                <div class="stat"><strong>${totalCount}</strong><span>görünür yorum</span></div>
                <div class="stat"><strong>Auto</strong><span>light / dark</span></div>
              </div>
            </div>
          </div>
        </section>

        <section class="split">
          <div class="panel">
            <div class="panel-inner">
              <div class="section-head">
                <h2>Yorum akışı</h2>
                <span class="badge">${thread.length ? `${thread.length} başlık` : 'boş'}</span>
              </div>
              <div class="stack">
                ${thread.length ? thread.map(renderThreadNode).join('') : `<div class="empty-state">Henüz yorum yok. İlk yorumu sen bırak.</div>`}
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="form-card">
              <div class="section-head">
                <h2>Yeni yorum</h2>
                <span class="badge badge-success">Onay bekler</span>
              </div>
              <form id="comment-form" class="field-grid">
                <div class="field">
                  <label for="name">İsim</label>
                  <input class="input" id="name" name="name" placeholder="Adınız" autocomplete="name" required />
                </div>
                <div class="field">
                  <label for="email">E-posta</label>
                  <input class="input" id="email" name="email" type="email" placeholder="ornek@site.com" autocomplete="email" required />
                </div>
                <div class="field">
                  <label for="comment">Yorum</label>
                  <textarea class="textarea" id="comment" name="comment" rows="7" placeholder="Yorumunuzu yazın" required></textarea>
                </div>
                <div class="actions">
                  <button class="btn btn-primary" type="submit">Yorumu gönder</button>
                  <button class="btn btn-ghost" type="reset">Temizle</button>
                </div>
                <p id="status" class="status" aria-live="polite"></p>
              </form>
            </div>
          </div>
        </section>
      </div>`;
  }

  private bindForm(pageId: string) {
    const form = this.querySelector<HTMLFormElement>('#comment-form');
    const status = this.querySelector<HTMLElement>('#status');
    const submit = this.querySelector<HTMLButtonElement>('button[type="submit"]');

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form || !status || !submit) return;
      submit.disabled = true;
      status.textContent = 'Gönderiliyor...';
      try {
        const data = new FormData(form);
        await supabaseService.createComment({
          pageId,
          name: String(data.get('name') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          comment: String(data.get('comment') ?? '').trim(),
        });
        form.reset();
        status.textContent = 'Yorumunuz onay bekliyor.';
      } catch (error) {
        console.error(error);
        status.textContent = 'Yorum gönderilemedi. Lütfen tekrar deneyin.';
      } finally {
        submit.disabled = false;
      }
    });
  }
}

function renderThreadNode(node: CommentThread): string {
  return `
    <article class="comment-card">
      <div class="comment-meta">
        <div class="avatar" aria-hidden="true">${escapeHtml(initials(node.name))}</div>
        <div style="display:grid;gap:2px">
          <div class="comment-author">${escapeHtml(node.name)}</div>
          <div class="comment-date">${new Date(node.created_at).toLocaleString('tr-TR')}</div>
        </div>
      </div>
      <p class="comment-body">${escapeHtml(node.comment)}</p>
      ${node.replies.length ? `<div class="reply-thread">${node.replies.map(renderThreadNode).join('')}</div>` : ''}
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

customElements.define('wombat-widget', WombatWidget);
