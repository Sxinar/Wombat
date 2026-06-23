# Wombat

Wombat, Supabase ve SvelteKit ile yazılmış hafif bir yorum platformudur. Tek bir widget script'i ile herhangi bir siteye gömülebilir; panelden yorumlar yönetilir, admin kullanıcılar ise ek analiz kartlarını ve admin yönetimini görür.

## Özellikler

- Hafif widget ve gömme kolaylığı
- Markdown + DOMPurify ile güvenli içerik render'ı
- Thread yapısı ile yanıt verme desteği
- Emoji reaksiyonları
- Admin panelinde proje bazlı yorum yönetimi
- Admin kullanıcılar için dashboard istatistikleri
- Admin rol yönetimi
- Supabase RLS tabanlı erişim kontrolü
- Yorum ve reaksiyonlar için oran sınırlama

## Teknoloji

- SvelteKit
- Supabase
- TypeScript
- Marked
- DOMPurify

## Kurulum

1. Depoyu klonlayın.
   ```bash
   git clone <repo-url>
   cd wombat
   ```
2. Bağımlılıkları yükleyin.
   ```bash
   npm install
   ```
3. Supabase projesi oluşturun.
4. `supabase/migrations/00000_init.sql` içindeki SQL'i çalıştırın.
5. `.env` dosyasını oluşturun.

## Ortam Değişkenleri

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

İsteğe bağlı olarak widget host'unu da ayrı bir ortam değişkeniyle kullanabilirsiniz. Uygulama içinde widget, mevcut origin'i de kullanabilir.

## Admin Oluşturma

Mevcut bir admin, dashboard ana sayfasındaki `Admin yönetimi` alanından başka bir kullanıcıya admin yetkisi verebilir.

İlk admin'i başlatmak için Supabase SQL Editor'da bir kez şu komutu çalıştırın:

```sql
update public.profiles
set is_admin = true
where email = 'admin@example.com';
```

Sonrasında admin yetkileri panel üzerinden güvenli RPC ile yönetilir.

## Geliştirme

```bash
npm run dev
```

Kontrol:

```bash
npm run check
```

Üretim build'i:

```bash
npm run build
```

Widget build'i:

```bash
npm run build:widget
```

## Mimari

### Ana akış

- Kullanıcı `/auth` ekranından giriş yapar veya kayıt olur.
- `/dashboard` altında projelerini görür.
- Bir proje içinde yorumları onaylar, siler ve yanıtlar.
- Widget, `/api/comments` üzerinden yorumları çeker ve yeni yorumları aynı endpoint'e gönderir.
- Reaksiyonlar aynı API üzerinden güvenli biçimde yönetilir.

### Dashboard erişimi

- Kullanıcı giriş yapmadıysa `/auth`'a yönlendirilir.
- Proje sayfaları, kullanıcının sahip olmadığı `project_id` için açılmaz.
- `profiles.is_admin = true` olan kullanıcılar dashboard ana sayfasında ek analiz kartları görür.
- `profiles.is_admin = true` olan kullanıcılar admin yönetim kartını görür.

## Widget Kullanımı

Dashboard içindeki `Settings` sekmesinde üretilen örnek snippet şuna benzer:

```html
<div id="wombat_thread"
  data-host="https://your-domain.com"
  data-app-id="PROJECT_ID"
  data-page-id="PAGE_ID"
  data-page-url="PAGE_URL"
  data-page-title="PAGE_TITLE"
></div>
<script async defer src="https://your-domain.com/widget.js"></script>
```

Notlar:

- `data-app-id` proje kimliğidir.
- `data-page-id` her sayfa için benzersiz olmalıdır.
- `data-page-url` ve `data-page-title` mümkünse gerçek sayfa verileriyle doldurulmalıdır.

## Veri Modeli

Ana tablolar:

- `profiles`
- `projects`
- `threads`
- `comments`
- `comment_reactions`
- `abuse_limits`

### `comments`

- `status`: `pending`, `approved`, `spam`
- `is_admin`: admin yorumlarını ayırmak için kullanılır
- `parent_id`: yanıt ağacı oluşturur

### `comment_reactions`

- Her yorum için emoji reaksiyonlarını tutar
- Aynı kullanıcı/cihaz için aynı emoji tekrar eklenirse toggle mantığıyla kaldırılabilir
- Reaksiyonlar IP bazlı oran sınırlamasına tabidir.

## Güvenlik

- Tüm yorum render'ı Markdown + DOMPurify ile temizlenir.
- Yorum gönderiminde input normalizasyonu uygulanır.
- Widget API'si origin uyumu kontrol eder.
- Dashboard tarafında proje sahipliği kontrol edilir.
- Dış bağlantılarda `rel="noreferrer noopener"` kullanılır.
- Yorum ve reaksiyon endpoint'lerinde IP bazlı oran sınırlama uygulanır.
- Admin rol değişiklikleri `SECURITY DEFINER` RPC ile yapılır ve yalnızca mevcut adminlerce çalıştırılabilir.

## Admin Analitikleri

Admin kullanıcılar dashboard ana sayfasında şu özetleri görür:

- Toplam proje sayısı
- Toplam yorum sayısı
- Bekleyen yorum sayısı
- Onaylı yorum sayısı
- Son 7 gündeki yorum sayısı
- Toplam reaksiyon sayısı

## Reaksiyonlar

Widget'ta varsayılan emoji seti:

- `👍`
- `❤️`
- `😂`
- `🎉`

Reaksiyonlar public olarak okunur ve aynı kullanıcı için toggle mantığıyla değiştirilebilir.

## Sık Sorulanlar

### Yorumlar neden görünmüyor?

- `appId` ile `pageId` eşleşiyor mu kontrol edin.
- Yorumun `approved` durumunda olduğundan emin olun.
- Supabase RLS politikalarının uygulanmış olduğunu doğrulayın.

### Widget neden iki kez görünüyor?

- Aynı sayfada `widget.js` birden fazla yüklenmiş olabilir.
- Sadece tek bir `wombat_thread` container kullanın.

### Admin kartları neden görünmüyor?

- `profiles.is_admin` alanı `true` olmalı.
- Kullanıcı gerçekten giriş yapmış olmalı.

## Proje Yapısı

- `src/routes/api/comments/+server.ts`: yorum ve reaksiyon API'si
- `src/routes/dashboard`: panel sayfaları
- `src/lib/widget`: gömülebilir widget
- `supabase/migrations/00000_init.sql`: şema ve RLS
- `supabase/migrations/00000_init.sql`: `abuse_limits` ve admin RPC'leri

## Güvenlik Notları

- Supabase anahtarlarını client tarafında yalnızca anon key olarak kullanın.
- Production'da HTTPS kullanın.
- Gerekirse widget ve panel için ayrı domain/subdomain ayırın.
- Supabase tarafında e-posta onayı, güçlü şifre politikası ve MFA açın.
- Admin rolünü yalnızca güvendiğiniz hesaplara verin.

## Lisans

Bu proje için henüz açık bir lisans tanımlı değil. İsterseniz uygun bir OSS lisansı ekleyebiliriz.


<div id="wombat_thread"
  data-host="https://wombatc.vercel.app"
  data-app-id="79e1da8c-f79e-4d83-9879-43ea36a325d2"
  data-page-id="{{ PAGE_ID }}"
  data-page-url="{{ PAGE_URL }}"
  data-page-title="{{ PAGE_TITLE }}"
></div>
<script async defer src="https://wombatc.vercel.app/widget.js"></script>
