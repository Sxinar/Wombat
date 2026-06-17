
# Wombat Yorum Widget'ı – Türkçe README

> **Wombat**, Supabase ile çalışan, Svelte‑Kit tabanlı hafif bir yorum sistemidir.  
> Tek bir script (`widget.js`) ile herhangi bir statik ya da Svelte‑Kit sitesine kolayca entegre edilebilir.

---

## 📦 İçindekiler
- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
- [Ortam Değişkenleri (`.env`)](#ortam-değişkenleri-env)
- [Widget'ı Sayfaya Ekleme](#widgetı-sayfaya-ekleme)
- [Supabase Şeması](#supabase-şeması)
- [Geliştirme ve Çalıştırma](#geliştirme-ve-çalıştırma)
- [Yayına Alma (Production)](#yayına-alma-production)
- [Sık Karşılaşılan Sorunlar](#sık-karşılaşılan-sorunlar)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)

---

## Özellikler
- **Sıfırdan kurulum** – sadece bir `.env` dosyası ve bir script yeterli.
- **Markdown desteği** – `marked` ve `DOMPurify` ile güvenli render.
- **Cevap ve yanıtlayan yorum** – `parent_id` üzerinden hiyerarşik yorumlar.
- **Admin (moderasyon) desteği** – `is_admin` flag’i ile admin yorumları.
- **Dark‑mode uyumu** – CSS `prefers-color-scheme` desteği.
- **Supabase ile tam uyumlu** – veri depolama, oturum açma ve CORS otomatik ayarları.

---

## Kurulum

1. **Depoyu klonlayın**  
   ```bash
   git clone https://github.com/your-username/wombat-widget.git
   cd wombat-widget
   ```

2. **Bağımlılıkları yükleyin** (npm, pnpm ya da yarn kullanabilirsiniz)  
   ```bash
   npm install    # veya: pnpm install / yarn install
   ```

3. **Supabase projesi oluşturun**  
   - https://supabase.com/ adresinden ücretsiz bir proje açın.  
   - `auth`, `threads` ve `comments` tablolarını oluşturmak için `supabase/migrations/00000_init.sql` dosyasındaki SQL’i çalıştırın (Supabase UI > SQL > New Query).

4. **`.env` dosyasını ayarlayın** (aşağıda detaylar).

5. **Geliştirme sunucusunu başlatın**  
   ```bash
   npm run dev
   ```

   Tarayıcıda `http://localhost:5173` adresine gidin, widget’ın çalıştığını doğrulayın.

---

## Ortam Değişkenleri (`.env`)

Projenin kök dizininde bir `.env` dosyası oluşturun ve aşağıdaki satırları ekleyin.  
Değerleri Supabase projenizden alın.

```dotenv
# Supabase URL ve anon key (Supabase > Settings > API)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI...

# (Opsiyonel) Wombat widget’ının barındırıldığı host
# (Hem local geliştirme hem de prod ortamda aynı kalabilir)
WIDGET_HOST=https://wombatc.vercel.app
```

> **Not:** `VITE_` ile başlayan değişkenler Vite tarafından otomatik olarak `import.meta.env` içinde kullanılabilir.

---

## Widget'ı Sayfaya Ekleme

### 1️⃣ HTML Snippet (Svelte‑Kit)

```svelte
<script lang="ts">
  // Sayfa‑özgü verileri (ID, başlık, URL) örnek
  export let data;   // SvelteKit load() fonksiyonundan gelen veri
  const postId   = data?.post?.id ?? 'unknown-id';
  const postTitle = data?.post?.title ?? document.title;
  const postUrl   = `${window.location.origin}${window.location.pathname}`;
</script>

<!-- Wombat yorum alanı -->
<div
  id="wombat_thread"
  data-host="{import.meta.env.VITE_SUPABASE_URL}"
  data-appid="eae7e901-dc94-40b5-ad11-99a9077fe672"
  data-pageid="{postId}"
  data-pagetitle="{postTitle}"
  data-pageurl="{postUrl}"
></div>

<!-- Widget script’i (asenkron) -->
<script async defer src="https://wombatc.vercel.app/widget.js"></script>
```

> **Önemli:** `data-appid` değerini **kendi APP ID’niz** ile değiştirin. `data-host` Supabase URL’niz (veya API hostunuz) olmalı.

### 2️⃣ Statik HTML (Jekyll / Hugo / Markdown)

```html
<div id="wombat_thread"
     data-host="https://YOUR-PROJECT.supabase.co"
     data-appid="eae7e901-dc94-40b5-ad11-99a9077fe672"
     data-pageid="{{ page.id }}"
     data-pagetitle="{{ page.title | xml_escape }}"
     data-pageurl="{{ site.url }}{{ page.url }}">
</div>

<script async defer src="https://wombatc.vercel.app/widget.js"></script>
```

> `{{ page.id }}` ve `{{ page.title }}` gibi Liquid/Markdown değişkenlerini kendi static site motorunuza göre uyarlayın.

---

## Supabase Şeması

`supabase/migrations/00000_init.sql` içinde tanımlanan tablolar:

```sql
-- Threads (her sayfa için bir thread)
create table threads (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null,
  page_id text not null,
  page_title text,
  page_url text,
  created_at timestamp with time zone default now()
);

-- Comments
create table comments (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid references threads(id) on delete cascade,
  parent_id uuid references comments(id),
  content text not null,
  author_name text not null,
  author_email text,
  is_admin boolean default false,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamp with time zone default now()
);
```

- **`status = 'approved'`** yorumlar listelenirken gösterilir.  
- Admin (yönetici) yorumlarını `is_admin = true` ile işaretleyebilirsiniz.  

---

## Geliştirme ve Çalıştırma

| Komut | Açıklama |
|------|----------|
| `npm run dev` | Vite dev server (localhost:5173). Hot‑reload aktif. |
| `npm run build` | Projeyi `dist/` klasörüne üret (production bundle). |
| `npm run preview` | `npm run build` sonrası statik server ile çıktıyı test et. |
| `npm run lint` | ESLint + Prettier ile kod kalitesini kontrol eder. |
| `npm run test` | (Henüz test yok, ileride Jest/Svelte‑Testing‑Library eklenebilir.) |

---

## Yayına Alma (Production)

1. **Build**  
   ```bash
   npm run build
   ```

2. **Static dosyaları Vercel / Netlify / Cloudflare Pages** gibi bir CDN’ye yükleyin. `widget.js` otomatik olarak Vercel’de (`https://wombatc.vercel.app/widget.js`) barındırılıyor, **dış script** olduğu için ayrı bir adım gerekmez.

3. **Ortam değişkenlerini production’da ayarlayın**  
   - Vercel → Settings → Environment Variables  
   - Netlify → Build & Deploy → Environment  

   `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini production anahtarlarıyla değiştirin.

---

## Sık Karşılaşılan Sorunlar

| Sorun | Neden | Çözüm |
|------|-------|-------|
| **`Uncaught DOMException: CustomElementRegistry.define: 'cusdis-clone' has already been defined`** | `widget.js` iki kez yüklendi (örn. hem layout’da hem sayfada <script> eklenmiş) | `widget.js` scriptini yalnızca bir kez, genellikle `src/routes/+layout.svelte` içinde ekleyin ve diğer yerlerde kaldırın. |
| **Yorumlar gelmiyor – 401/403** | Supabase URL veya `anon‑key` eksik/yanlış | `.env` dosyasındaki `VITE_SUPABASE_URL` ve `V
İki parça düşün:

- \`widcom.html\` için halka açık bir statik URL
- \`admin.html\` için daha kontrollü bir alan

Örnek:

- Widget: \`https://comments.example.com/widcom.html?id=post-123\`
- Admin: \`https://comments.example.com/admin.html\`

Admin panelini mümkünse:

- ayrı subdomain
- IP kısıtı
- ek giriş politikası

ile daha kontrollü hale getir.

## Test Akışı

### Widget testi

1. \`widcom.html?id=blog-post-1\` sayfasını aç
2. Yorum gönder
3. “Yorumunuz onay bekliyor” mesajını gör
4. Supabase tablosunda kaydın \`is_approved = false\` geldiğini doğrula

### Admin testi

1. \`admin.html\` sayfasını aç
2. admin hesabıyla giriş yap
3. bekleyen yorumu onayla
4. yorumun widget'ta görünmesini doğrula

### Reply testi

1. onaylanmış yorumda “Yanıt ver”e tıkla
2. cevap yaz
3. cevabın ağaç içinde göründüğünü kontrol et

### RLS testi

1. çıkış yap
2. anonim kullanıcıyla sadece onaylı yorumların görüldüğünü kontrol et
3. anonim olarak update/delete yapılamadığını doğrula

## Tasarım Notları

Widget ve admin arayüzü şu hedefle tasarlandı:

- minimal ama cansız olmayan bir görünüm
- sıkışık olmayan spacing
- mobilde de rahat okunabilen kart düzeni
- form alanlarında net odak görünümü
- sekmeler ve etiketlerle hızlı taranabilirlik

Bu tasarım kasıtlı olarak:

- ağır pazarlama hero'ları kullanmaz
- gereksiz süslemelere yaslanmaz
- yorum sistemi gibi operasyonel bir araç için temiz ve düzenli kalır

## PocketBase Desteği

\`src/services/pocketbase-service.ts\` aynı servis arayüzünü uygular. Şu anda başlangıç iskeletidir.

PocketBase'e geçerken doldurman gereken yerler:

- collection tanımları
- auth akışı
- yorum listeleme
- yorum oluşturma
- admin onay / silme / reply

Bu yüzden frontend tarafı tekrar yazılmak zorunda kalmaz.

## İyileştirme Fikirleri

Bir sonraki adımda eklenebilecekler:

- yorum formuna anti-spam alanı
- reply için modal pencere
- admin panelinde tarih ve sayfa filtresi
- pagination / infinite scroll
- e-posta doğrulama akışı
- markdown desteği
- webhook veya e-posta bildirimleri

## Sorun Giderme

### Yorumlar görünmüyor

- \`VITE_SUPABASE_URL\` doğru mu?
- \`VITE_SUPABASE_ANON_KEY\` doğru mu?
- \`db/supabase.sql\` çalıştı mı?
- RLS policy’leri aktif mi?

### Admin giriş olmuyor

- Supabase Authentication’da kullanıcı oluşturuldu mu?
- e-posta ve parola doğru mu?
- session tarayıcıda saklanıyor mu?

### Widget bozuk görünüyor

- iframe genişliği yeterli mi?
- yayınlanan dosyada \`dist/\` içeriği var mı?
- CSS dosyası doğru yükleniyor mu?

## Kısa Özet

Wombat:

- statik siteler için gömülebilir yorum sistemi
- Supabase öncelikli, PocketBase uyarlanabilir
- self-host edilebilir
- güvenlik katmanı RLS ile kurulu
- modern ve sade bir arayüz sunar
