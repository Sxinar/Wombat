# Wombat

Wombat, statik siteler için self-host edilebilir, TypeScript tabanlı yorum sistemidir. Widget tarafı tek bir iframe ile gömülebilir; admin paneli ise Supabase Auth ile giriş yaparak yorumları onaylama, silme ve yanıt verme akışı sunar.

Proje özellikle şu kullanım senaryoları için tasarlandı:

- Jekyll, Hugo, Astro, Next static export, GitHub Pages, Netlify, Vercel, Cloudflare Pages gibi statik yayın ortamları
- Kendi alan adında çalışan bağımsız bir yorum servisi
- Supabase ile hızlı başlangıç
- İleride PocketBase'e geçebilecek servis katmanı

## Ne Kuruyoruz?

Bu proje iki ana yüz içerir:

1. `widcom` widget'i
   - Blog yazısı, doküman sayfası veya ürün sayfasına gömülür
   - `?id=...` parametresiyle çalışır
   - Sadece onaylı yorumları gösterir
   - Yeni yorumu onay beklemeye düşürür
   - Sistem temasına otomatik uyum sağlar

2. `admin` paneli
   - Supabase Auth ile giriş yapar
   - Bekleyen yorumları listeler
   - Onaylar, siler, yanıtlar
   - Yanıtları `parent_id` ile ağaç yapısına bağlar

## Özellikler

- TypeScript ile yazılmış modern frontend
- Supabase odaklı, PocketBase'e uyarlanabilir servis katmanı
- Row Level Security destekli güvenlik modeli
- Responsive ve temiz arayüz
- Light / dark mode otomatik uyum
- Widget içinde yorum ağacı görünümü
- Self-host için uygun build çıktısı

## Dosya Yapısı

- `widcom.html` - widget için Vite giriş sayfası
- `admin.html` - admin paneli için Vite giriş sayfası
- `src/widcom.ts` - widget UI ve form akışı
- `src/admin.ts` - admin UI, giriş ve yönetim akışı
- `src/styles/theme.css` - ortak tasarım sistemi
- `src/services/supabase-service.ts` - Supabase uygulama katmanı
- `src/services/pocketbase-service.ts` - PocketBase adaptör başlangıcı
- `src/core/thread.ts` - yorumları ağaç yapısına dönüştürür
- `db/supabase.sql` - tablo şeması ve RLS politikaları

## Kurulum

### 1. Bağımlılıkları kur

```bash
npm install
```

### 2. Ortam değişkenlerini tanımla

Proje kökünde `.env` oluştur:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Not:
- `anon` key frontend'de kullanılabilir.
- `service_role` key kesinlikle frontend'e konmamalıdır.

### 3. Supabase SQL'i çalıştır

`db/supabase.sql` içindeki SQL'i Supabase SQL Editor'da çalıştır.

Bu script şunları oluşturur:

- `public.comments` tablosu
- `parent_id` ilişkisi
- `created_at` alanı
- RLS aktifliği
- anon ve authenticated policy'leri

### 4. Admin hesabı oluştur

Supabase Dashboard > Authentication bölümüne git ve bir admin kullanıcısı oluştur.

Bu kullanıcı:
- admin paneline giriş yapacak
- yorumları onaylayacak
- silme ve yanıt işlemlerini gerçekleştirecek

## Geliştirme

Geliştirme sunucusunu başlat:

```bash
npm run dev
```

Tarayıcıda:

- Widget: `http://localhost:5173/widcom.html?id=blog-post-1`
- Admin: `http://localhost:5173/admin.html`

## Production Build

Build al:

```bash
npm run build
```

Çıktı `dist/` klasörüne gider.

Bu klasörü şu şekillerde dağıtabilirsin:

- kendi VPS'inde Nginx ile servis ederek
- Netlify / Vercel / Cloudflare Pages'e yükleyerek
- statik hosting üzerinde yayınlayarak

## Self-Host Mantığı

Wombat'i self-host etmek demek yalnızca frontend'i değil, backend'i de kendi kurduğun Supabase veya PocketBase ortamında çalıştırmak demektir.

### Supabase ile self-host hissi

Aslında iki dağıtım katmanı vardır:

- frontend: `dist/` klasörü
- backend: Supabase projesi veya kendi Supabase kurulumun

Kendi Supabase kurulumunu yapıyorsan:
- `VITE_SUPABASE_URL` kendi domain'ini göstermeli
- `VITE_SUPABASE_ANON_KEY` o ortamın anon key'i olmalı
- SQL script aynı şekilde uygulanmalı

### PocketBase ile self-host hissi

PocketBase kullanacaksan:
- auth, collection, CRUD ve reply akışını PocketBase servis katmanına taşırsın
- frontend aynı arayüzü kullanır
- sadece `src/services/pocketbase-service.ts` içini gerçek sorgularla doldurursun

Bu mimaride widget ve admin kodu değişmeden kalır; sadece servis katmanı değişir.

## Widget Nasıl Gömülür?

Widget'ı tek başına statik bir sayfaya ya da iframe olarak kullanabilirsin.

### En basit kullanım

Önce `widcom.html` dosyasını yayınladığın URL'i düşün:

```text
https://comments.example.com/widcom.html?id=blog-post-1
```

Sonra blog yazına iframe ekle:

```html
<iframe
  src="https://comments.example.com/widcom.html?id=blog-post-1"
  style="width:100%;border:0;min-height:900px"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```

### Sayfa ID nasıl seçilir?

`id` parametresi benzersiz olmalı.

Örnekler:

- `blog-post-1`
- `docs-installation`
- `product-page-pricing`

Kural basit:
- aynı içerik aynı `id`
- farklı içerik farklı `id`

Bu sayede yorumlar sayfa bazında ayrılır.

## Widget Tasarımı Nasıl Çalışır?

Widget tarafı özellikle sade tutuldu:

- üstte küçük bilgi bandı
- solda yorum akışı
- sağda yorum formu
- onay bekleme durumu açık biçimde gösteriliyor
- yorumlar ağaç yapısında render ediliyor

Bu yapı widget'in hangi siteye gömülürse gömülsün “yabancı” görünmemesine yardım eder.

### Tasarım prensibi

- geniş, boş ve sakin paneller
- yumuşak border ve gölge kullanımı
- sistem renk moduna uyum
- okunabilir tipografi
- küçük ama net durum etiketleri

### İstersen nasıl özelleştirirsin?

`src/styles/theme.css` dosyasında şu alanlar üzerinden kolayca değişiklik yapabilirsin:

- `--accent`
- `--panel`
- `--bg`
- `--text`
- `--radius`

Widget başka bir site tasarımına daha sıkı uysun istiyorsan, iframe dışındaki sürümde bu değişkenleri kendi marka renginle yeniden tanımlayabilirsin.

## Admin Paneli Nasıl Çalışır?

Admin sayfası şu akışa sahiptir:

1. Giriş ekranı
2. Oturum doğrulama
3. İki sekmeli yönetim görünümü
4. Bekleyen yorumları onaylama
5. Onaylı yorumlara yanıt verme

### Bekleyenler

- yeni gelen ama yayınlanmamış yorumlar
- burada onayla ve sil butonları bulunur

### Onaylanmış Yorumlar

- yayınlanan yorumlar
- burada yanıt ver butonu bulunur
- yanıtlar `parent_id` ile bağlanır

## Güvenlik Modeli

RLS ile amaç şu kuralları uygulamaktır:

- anonim kullanıcı sadece `is_approved = true` yorumları okuyabilir
- anonim kullanıcı yeni yorum ekleyebilir ama bu yorum `false` olarak gelmelidir
- anonim kullanıcı update/delete yapamaz
- authenticated admin tüm yorumları okuyabilir ve yönetebilir

Bu model üretim kullanımı için iyi bir başlangıçtır. Daha sıkı üretim kurulumunda admin erişimini ayrı bir kullanıcı profili tablosuyla sınırlandırman önerilir.

## Widget ve Admini Nerede Host Etmeliyim?

İki parça düşün:

- `widcom.html` için halka açık bir statik URL
- `admin.html` için daha kontrollü bir alan

Örnek:

- Widget: `https://comments.example.com/widcom.html?id=post-123`
- Admin: `https://comments.example.com/admin.html`

Admin panelini mümkünse:
- ayrı subdomain
- IP kısıtı
- ek giriş politikası
ile daha kontrollü hale getir.

## Test Akışı

### Widget testi

1. `widcom.html?id=blog-post-1` sayfasını aç
2. Yorum gönder
3. “Yorumunuz onay bekliyor” mesajını gör
4. Supabase tablosunda kaydın `is_approved = false` geldiğini doğrula

### Admin testi

1. `admin.html` sayfasını aç
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

`src/services/pocketbase-service.ts` aynı servis arayüzünü uygular. Şu anda başlangıç iskeletidir.

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

- `VITE_SUPABASE_URL` doğru mu?
- `VITE_SUPABASE_ANON_KEY` doğru mu?
- `db/supabase.sql` çalıştı mı?
- RLS policy’leri aktif mi?

### Admin giriş olmuyor

- Supabase Authentication’da kullanıcı oluşturuldu mu?
- e-posta ve parola doğru mu?
- session tarayıcıda saklanıyor mu?

### Widget bozuk görünüyor

- iframe genişliği yeterli mi?
- yayınlanan dosyada `dist/` içeriği var mı?
- CSS dosyası doğru yükleniyor mu?

## Kısa Özet

Wombat:
- statik siteler için gömülebilir yorum sistemi
- Supabase öncelikli, PocketBase uyarlanabilir
- self-host edilebilir
- güvenlik katmanı RLS ile kurulu
- modern ve sade bir arayüz sunar
