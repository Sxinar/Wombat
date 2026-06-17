export const translations: Record<string, Record<string, string>> = {
  en: {
    'title': 'Wombat Comment Platform',
    'dashboard': 'Dashboard',
    'sign_in_up': 'Sign In / Sign Up',
    'enter_details': 'Enter your details. If you don\'t have an account, we will create one for you automatically.',
    'email': 'Email',
    'password': 'Password',
    'continue': 'Continue',
    'processing': 'Processing...',
    'your_sites': 'Your Sites',
    'sign_out': 'Sign Out',
    'create_site': 'Create New Site',
    'site_name': 'Site Name',
    'create': 'Create',
    'loading_sites': 'Loading sites...',
    'inbox': 'Inbox',
    'settings': 'Settings',
    'loading_comments': 'Loading comments...',
    'no_comments': 'No comments yet in this site.',
    'approve': 'Approve',
    'unapprove': 'Unapprove',
    'delete': 'Delete',
    'integration': 'Integration',
    'integration_desc': 'Paste this code into your website where you want the comment box to appear. Replace the {{ ... }} variables with your actual page data (e.g., using your static site generator or CMS).',
    'copy': 'Copy',
    'webhooks': 'Webhooks & Notifications',
    'webhooks_desc': 'Coming soon. Here you will be able to configure a webhook URL to ping when a new comment is posted.',
    'landing_title': 'Privacy-first, lightweight comment system.',
    'landing_desc': 'An open-source alternative to Disqus. Zero tracking, zero dependencies, and beautifully minimalist. Embed it on your site in seconds.',
    'get_started': 'Get Started',
    'view_source': 'View Source'
  },
  tr: {
    'title': 'Wombat Yorum Platformu',
    'dashboard': 'Panel',
    'sign_in_up': 'Giriş Yap / Kayıt Ol',
    'enter_details': 'Bilgilerinizi girin. Hesabınız yoksa otomatik olarak oluşturulacaktır.',
    'email': 'E-posta',
    'password': 'Şifre',
    'continue': 'Devam Et',
    'processing': 'İşleniyor...',
    'your_sites': 'Siteleriniz',
    'sign_out': 'Çıkış Yap',
    'create_site': 'Yeni Site Oluştur',
    'site_name': 'Site Adı',
    'create': 'Oluştur',
    'loading_sites': 'Siteler yükleniyor...',
    'inbox': 'Gelen Kutusu',
    'settings': 'Ayarlar',
    'loading_comments': 'Yorumlar yükleniyor...',
    'no_comments': 'Bu sitede henüz yorum yok.',
    'approve': 'Onayla',
    'unapprove': 'Onayı Kaldır',
    'delete': 'Sil',
    'integration': 'Entegrasyon',
    'integration_desc': 'Yorum kutusunun görünmesini istediğiniz yere bu kodu yapıştırın. {{ ... }} değişkenlerini sayfa verilerinizle değiştirin.',
    'copy': 'Kopyala',
    'webhooks': 'Webhook & Bildirimler',
    'webhooks_desc': 'Çok yakında. Yeni bir yorum yapıldığında tetiklenecek webhook URL\'sini buradan ayarlayabileceksiniz.',
    'landing_title': 'Gizlilik odaklı, hafif yorum sistemi.',
    'landing_desc': 'Disqus için açık kaynaklı bir alternatif. İzlenme yok, bağımlılık yok ve harika derecede minimalist. Sitenize saniyeler içinde gömün.',
    'get_started': 'Hemen Başla',
    'view_source': 'Kaynak Kod'
  }
};

class I18n {
  locale = $state('tr');

  t(key: string) {
    return translations[this.locale]?.[key] || key;
  }
}

export const i18n = new I18n();
