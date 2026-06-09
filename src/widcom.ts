import './styles/theme.css';
import { buildThread } from './core/thread';
import { escapeHtml } from './core/dom';
import type { CommentThread } from './types/comment';
import { supabaseService } from './services/supabase-service';

class WombatWidget extends HTMLElement {
  private quoteTarget: CommentThread | null = null;
  private currentThread: CommentThread[] = [];

  connectedCallback() {
    document.body.classList.add('wombat-widget');
    void this.render();
  }

  async render() {
    const pageId = new URL(window.location.href).searchParams.get('id') ?? 'default';
    this.innerHTML = this.loadingView();

    try {
      const comments = await supabaseService.listApproved(pageId);
      const thread = buildThread(comments);
      this.currentThread = thread;
      this.innerHTML = this.view(pageId, thread);
      this.bindForm(pageId);
    } catch (error) {
      console.error(error);
      this.innerHTML = this.errorView();
    }
  }

  private loadingView() {
    return `
      <div class="shell compact">
        <section class="panel quiet-panel">
          <div class="panel-inner">
            <div class="toolbar">
              <div class="widget-hero">
                <div class="eyebrow">Wombat Widget</div>
                <h2 class="title">Yorumlar yükleniyor</h2>
              </div>
            </div>
            <div class="empty-state" style="margin-top:12px">Yorumlar hazırlanıyor...</div>
          </div>
        </section>
      </div>`;
  }

  private errorView() {
    return `
      <div class="shell compact">
        <section class="panel quiet-panel">
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
      <div class="shell compact page-shell">
        <section class="panel quiet-panel">
          <div class="panel-inner">
            <div class="toolbar">
              <div class="widget-hero">
                <div class="eyebrow">Wombat Widget</div>
                <h2 class="title">Yorumlar</h2>
                <p class="subtitle">Onaylı yorumları ve cevapları sade bir akışta gösterir.</p>
              </div>
              <div class="stats">
                <div class="stat"><strong>${totalCount}</strong><span>görünür yorum</span></div>
                <div class="stat"><strong>1x</strong><span>kompakt akış</span></div>
              </div>
            </div>
          </div>
        </section>

        <section class="panel quiet-panel widget-frame">
          <div class="panel-inner widget-surface">
            <div class="widget-main">
              <div class="stack">
                <div class="section-head">
                  <h2>Yorum akışı</h2>
                  <span class="badge">${thread.length ? `${thread.length} başlık` : 'boş'}</span>
                </div>
                <div class="stack">
                  ${thread.length ? thread.map(renderThreadNode).join('') : `<div class="empty-state">Henüz yorum yok. İlk yorumu sen bırak.</div>`}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="panel quiet-panel">
          <div class="panel-inner">
            <div class="section-head">
              <h2>Yeni yorum</h2>
              <span class="badge badge-success">Onay bekler</span>
            </div>
            <form id="comment-form" class="widget-form widget-form--compact">
              <div id="quote-preview" class="quote-preview" hidden></div>
              <div class="form-row form-row--compact">
                <div class="field">
                  <label for="name">İsim</label>
                  <input class="input" id="name" name="name" placeholder="Adınız" autocomplete="name" required />
                </div>
                <div class="field">
                  <label for="email">E-posta</label>
                  <input class="input" id="email" name="email" type="email" placeholder="ornek@site.com" autocomplete="email" required />
                </div>
              </div>
              <div class="field">
                <label for="comment">Yorum</label>
                <textarea class="textarea" id="comment" name="comment" rows="4" placeholder="Yorumunuzu yazın" required></textarea>
              </div>
              <div class="actions">
                <button class="btn btn-primary" type="submit">Yorumu gönder</button>
                <button class="btn btn-ghost" type="reset">Temizle</button>
              </div>
              <p id="status" class="status" aria-live="polite"></p>
            </form>
          </div>
        </section>
      </div>`;
  }

  private bindForm(pageId: string) {
    const form = this.querySelector<HTMLFormElement>('#comment-form');
    const status = this.querySelector<HTMLElement>('#status');
    const submit = this.querySelector<HTMLButtonElement>('button[type="submit"]');
    const quotePreview = this.querySelector<HTMLElement>('#quote-preview');
    const quoteComment = this.querySelector<HTMLTextAreaElement>('#comment');

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form || !status || !submit) return;
      submit.disabled = true;
      status.textContent = 'Gönderiliyor...';
      try {
        const data = new FormData(form);
        await supabaseService.createComment({
          pageId,
          parentId: this.quoteTarget?.id ?? null,
          name: String(data.get('name') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          comment: String(data.get('comment') ?? '').trim(),
        });
        form.reset();
        this.clearQuote();
        status.textContent = 'Yorumunuz onay bekliyor.';
      } catch (error) {
        console.error(error);
        status.textContent = 'Yorum gönderilemedi. Lütfen tekrar deneyin.';
      } finally {
        submit.disabled = false;
      }
    });

    this.querySelectorAll<HTMLButtonElement>('[data-quote]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.quote!;
        const target = this.findThreadNode(this.currentThread, id);
        if (!target) return;
        this.quoteTarget = target;
        if (quotePreview && quoteComment) {
          quotePreview.hidden = false;
          quotePreview.innerHTML = `
            <div class="quote-preview__label">Alıntı</div>
            <div class="quote-preview__meta">${escapeHtml(target.name)} · ${new Date(target.created_at).toLocaleString('tr-TR')}</div>
            <div class="quote-preview__body">${escapeHtml(target.comment)}</div>`;
          quoteComment.placeholder = `@${target.name} alıntısı üzerine yazın`;
        }
      });
    });

    form?.addEventListener('reset', () => {
      this.clearQuote();
      if (quotePreview) quotePreview.hidden = true;
      if (quoteComment) quoteComment.placeholder = 'Yorumunuzu yazın';
      this.quoteTarget = null;
    });
  }

  private clearQuote() {
    const quotePreview = this.querySelector<HTMLElement>('#quote-preview');
    const quoteComment = this.querySelector<HTMLTextAreaElement>('#comment');
    if (quotePreview) quotePreview.hidden = true;
    if (quoteComment) quoteComment.placeholder = 'Yorumunuzu yazın';
    this.quoteTarget = null;
  }

  private findThreadNode(nodes: CommentThread[], id: string): CommentThread | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const child = this.findThreadNode(node.replies, id);
      if (child) return child;
    }
    return null;
  }
}

function renderThreadNode(node: CommentThread, depth = 0): string {
  return `
    <article class="comment-card ${depth > 0 ? 'comment-card-reply' : ''}">
      <div class="comment-meta">
        <div class="avatar" aria-hidden="true">${escapeHtml(initials(node.name))}</div>
        <div style="display:grid;gap:2px">
          <div class="comment-author">${escapeHtml(node.name)}</div>
          <div class="comment-date">${new Date(node.created_at).toLocaleString('tr-TR')}</div>
        </div>
      </div>
      <p class="comment-body">${escapeHtml(node.comment)}</p>
      ${depth === 0 ? `<button class="reply-toggle" data-quote="${node.id}">Alıntıla</button>` : ''}
      ${node.replies.length ? `<div class="reply-thread">${node.replies.map((child) => renderThreadNode(child, depth + 1)).join('')}</div>` : ''}
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
