# Wombat

Wombat, SvelteKit ve MongoDB ile yazılmış hafif bir yorum platformudur. Tek bir widget script'i ile herhangi bir siteye gömülebilir; panelden yorumlar yönetilir ve kullanıcılar kendi sitelerini görebilir.

## Özellikler

- Hafif widget ve gömme kolaylığı
- Markdown + DOMPurify ile güvenli içerik render'ı
- Thread yapısı ile yanıt verme desteği
- Emoji reaksiyonları
- Admin panelinde proje bazlı yorum yönetimi
- Admin kullanıcılar için dashboard istatistikleri
- Admin rol yönetimi
- Cookie tabanlı güvenli oturum açma
- Yorum ve reaksiyonlar için oran sınırlama

## Teknoloji

- SvelteKit
- MongoDB
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
3. MongoDB çalıştırın.
4. `.env` dosyasını oluşturun.

## Ortam Değişkenleri

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=wombat
JWT_SECRET=super-long-random-secret
```

## İlk Admin

İlk kullanıcı hesabını `/auth` ekranından oluşturun, sonra MongoDB'de `users` koleksiyonundaki ilgili kayda `is_admin: true` verin.

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

- Kullanıcı `/auth` ekranından giriş yapar veya hesap oluşturur.
- `/dashboard` altında projelerini görür.
- Bir proje içinde yorumları onaylar, siler ve yanıtlar.
- Widget, `/api/comments` üzerinden yorumları çeker ve yeni yorumları aynı endpoint'e gönderir.
- Reaksiyonlar aynı API üzerinden yönetilir.

### Dashboard erişimi

- Kullanıcı giriş yapmadıysa `/auth`'a yönlendirilir.
- Proje sayfaları, kullanıcının sahip olmadığı `project_id` için açılmaz.
- `is_admin = true` olan kullanıcılar dashboard ana sayfasında ek analiz kartları görür.
- `is_admin = true` olan kullanıcılar admin yönetim kartını görür.

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

## Veri Modeli

Ana koleksiyonlar:

- `users`
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

## Güvenlik

- Tüm yorum render'ı Markdown + DOMPurify ile temizlenir.
- Yorum gönderiminde input normalizasyonu uygulanır.
- Widget API'si origin uyumu kontrol eder.
- Dashboard tarafında proje sahipliği kontrol edilir.
- Dış bağlantılarda `rel="noreferrer noopener"` kullanılır.
- Yorum ve reaksiyon endpoint'lerinde IP bazlı oran sınırlama uygulanır.
- Admin rol değişiklikleri yalnızca mevcut adminlerce yapılabilir.

## Proje Yapısı

- `src/routes/api/comments/+server.ts`: yorum ve reaksiyon API'si
- `src/routes/dashboard`: panel sayfaları
- `src/lib/widget`: gömülebilir widget
- `src/lib/server`: MongoDB, auth ve rate-limit yardımcıları

## Sık Sorulanlar

### Yorumlar neden görünmüyor?

- `appId` ile `pageId` eşleşiyor mu kontrol edin.
- Yorumun `approved` durumunda olduğundan emin olun.
- Widget'ın aynı origin'den yorumları çektiğini doğrulayın.

### Admin kartları neden görünmüyor?

- Kullanıcının `is_admin` alanı `true` olmalı.

## Lisans

Bu proje için henüz açık bir lisans tanımlı değil. İsterseniz uygun bir OSS lisansı ekleyebiliriz.
