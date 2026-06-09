import './styles/theme.css';
import { buildThread } from './core/thread';
import { escapeHtml } from './core/dom';
import type { CommentThread } from './types/comment';
import { supabaseService } from './services/supabase-service';

class WombatWidget extends HTMLElement {
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
                <div class="stat"><strong>Auto</strong><span>tema uyumu</span></div>
              </div>
            </div>
          </div>
        </section>

        <section class="split widget-layout">
          <div class="panel quiet-panel">
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

          <div class="panel quiet-panel widget-form">
            <div class="form-card">
              <div class="section-head">
                <h2>Yeni yorum</h2>
                <span class="badge badge-success">Onay bekler</span>
              </div>
              <form id="comment-form" class="widget-form">
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

    this.querySelectorAll<HTMLButtonElement>('[data-reply-open]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.replyOpen!;
        const replyForm = this.querySelector<HTMLFormElement>(`[data-reply-form="${id}"]`);
        replyForm?.removeAttribute('hidden');
        button.setAttribute('hidden', 'true');
      });
    });

    this.querySelectorAll<HTMLButtonElement>('[data-reply-cancel]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.replyCancel!;
        const replyForm = this.querySelector<HTMLFormElement>(`[data-reply-form="${id}"]`);
        const replyToggle = this.querySelector<HTMLButtonElement>(`[data-reply-open="${id}"]`);
        replyForm?.setAttribute('hidden', 'true');
        replyToggle?.removeAttribute('hidden');
      });
    });

    this.querySelectorAll<HTMLFormElement>('[data-reply-form]').forEach((replyForm) => {
      replyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = replyForm.dataset.replyForm!;
        const replyStatus = this.querySelector<HTMLElement>(`[data-reply-status="${id}"]`);
        const replyName = this.querySelector<HTMLInputElement>(`[data-reply-name="${id}"]`);
        const replyEmail = this.querySelector<HTMLInputElement>(`[data-reply-email="${id}"]`);
        const replyComment = this.querySelector<HTMLTextAreaElement>(`[data-reply-comment="${id}"]`);
        const replyToggle = this.querySelector<HTMLButtonElement>(`[data-reply-open="${id}"]`);
        if (!replyStatus || !replyName || !replyEmail || !replyComment || !replyToggle) return;

        replyStatus.textContent = 'Gönderiliyor...';
        try {
          await supabaseService.createComment({
            pageId,
            parentId: id,
            name: replyName.value.trim(),
            email: replyEmail.value.trim(),
            comment: replyComment.value.trim(),
          });
          replyForm.reset();
          replyForm.setAttribute('hidden', 'true');
          replyToggle.removeAttribute('hidden');
          replyStatus.textContent = 'Yanıtınız gönderildi.';
        } catch (error) {
          console.error(error);
          replyStatus.textContent = 'Yanıt gönderilemedi.';
        }
      });
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
      <button class="reply-toggle" data-reply-open="${node.id}">Yanıtla</button>
      <form class="reply-form" data-reply-form="${node.id}" hidden>
        <input class="input" data-reply-name="${node.id}" placeholder="İsminiz" autocomplete="name" required />
        <input class="input" data-reply-email="${node.id}" type="email" placeholder="E-posta" autocomplete="email" required />
        <textarea class="textarea" data-reply-comment="${node.id}" rows="4" placeholder="Yanıtınız" required></textarea>
        <div class="actions">
          <button class="btn btn-primary" type="submit" data-reply-submit="${node.id}">Yanıtı gönder</button>
          <button class="btn btn-ghost" type="button" data-reply-cancel="${node.id}">Vazgeç</button>
        </div>
        <p class="status" data-reply-status="${node.id}" aria-live="polite"></p>
      </form>
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
