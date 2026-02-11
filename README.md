# 📖 VocabMaster — İngilizce-Türkmence Kelime Öğrenme Uygulaması

> **Sıfırdan canlı siteye adım adım kurulum rehberi**

---

## 📑 İçindekiler

- [1. Proje Hakkında](#1--proje-hakkında)
- [2. Ön Gereksinimler](#2--ön-gereksinimler)
- [3. Adım 1: Gemini API Key Alma](#3--adım-1-gemini-api-key-alma)
- [4. Adım 2: Cloudflare Worker Oluşturma (API Proxy)](#4--adım-2-cloudflare-worker-oluşturma-api-proxy)
  - [Yöntem A: Cloudflare Dashboard Üzerinden (Kolay Yol)](#yöntem-a-cloudflare-dashboard-üzerinden-kolay-yol)
  - [Yöntem B: Wrangler CLI ile (Gelişmiş Yol)](#yöntem-b-wrangler-cli-ile-gelişmiş-yol)
- [5. Adım 3: API Key'i Worker'a Ekleme](#5--adım-3-api-keyi-workera-ekleme)
- [6. Adım 4: Custom Domain Bağlama (en-api.poofs.app)](#6--adım-4-custom-domain-bağlama-en-apipoofapp)
- [7. Adım 5: Proje Kodunda API URL'ini Güncelleme](#7--adım-5-proje-kodunda-api-urlini-güncelleme)
- [8. Adım 6: Yerel Test (Localhost)](#8--adım-6-yerel-test-localhost)
- [9. Adım 7: Siteyi Cloudflare Pages'a Yayınlama](#9--adım-7-siteyi-cloudflare-pagesa-yayınlama)
  - [Yöntem A: Git ile Otomatik Deploy (Önerilen)](#yöntem-a-git-ile-otomatik-deploy-önerilen)
  - [Yöntem B: Doğrudan Upload](#yöntem-b-doğrudan-upload)
- [10. Adım 8: Custom Domain Bağlama (poofs.app)](#10--adım-8-custom-domain-bağlama-poofapp)
- [11. Adım 9: Son Kontroller](#11--adım-9-son-kontroller)
- [12. Sorun Giderme](#12--sorun-giderme)
- [13. Güvenlik Notları](#13--güvenlik-notları)
- [14. Proje Yapısı](#14--proje-yapısı)
- [15. Güncelleme Nasıl Yapılır](#15--güncelleme-nasıl-yapılır)

---

## 1. 📌 Proje Hakkında

**VocabMaster**, İngilizce-Türkmence kelime öğrenmek için tasarlanmış modern bir web uygulamasıdır. Excel dosyasından kelimeleri yükleyerek, yapay zeka (Google Gemini) ile otomatik kategorilendirme yapabilir, flashcard'lar ile çalışabilir, kendinizi test edebilir ve öğrenme sürecinizi dashboard üzerinden takip edebilirsiniz.

### ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 📤 **Excel Yükleme** | `.xlsx` veya `.xls` formatında kelime dosyası yükleme. Akıllı sütun algılama — hangi sütunun İngilizce, Transkripsiyon ve Türkmence olduğunu otomatik tespit eder. Rusça, Japonca, numara sütunlarını otomatik atlar. |
| 🤖 **Gemini Kategorilendirme** | Yüklenen kelimeleri Google Gemini 2.5 Flash yapay zekası ile otomatik olarak kategorilere ayırır (İsimler, Fiiller, Sıfatlar, Günlük Yaşam, Duygular vb.) ve her kelime için 5 örnek cümle oluşturur. |
| 📚 **Kelime Tablosu** | Gelişmiş filtreleme (arama, kategori, öğrenilme durumu, kelime uzunluğu), sıralama (A-Z, Z-A, en kısa, en uzun, kategoriye göre vb.) ve sayfalama özellikleri ile tüm kelimeleri görüntüleme. |
| 🃏 **Flashcard'lar** | Kartları çevirerek kelimeleri öğrenme. Kategori bazlı filtreleme, klavye kısayolları (← → Space), öğrenildi işaretleme. |
| 📝 **Test Modu** | İki yönlü test: İngilizce→Türkmence veya Türkmence→İngilizce. Yanlış cevaplanan kelimeler otomatik olarak "öğrenilmedi" olarak işaretlenir. |
| 🤖 **AI Geri Bildirim** | Test sonuçları Gemini yapay zekasına gönderilir ve Türkmence dilinde kişiselleştirilmiş geri bildirim, tavsiyeler ve analiz alırsınız. |
| 📊 **Dashboard** | Toplam kelime sayısı, öğrenilen kelime oranı, test geçmişi, kategori bazlı ilerleme çubukları, skor grafiği, gün serisi (streak) ve tekrar edilmesi gereken kelimeler. |
| 🌙 **Tema Desteği** | Açık (Light) ve Koyu (Dark) tema arasında geçiş. |
| 💾 **Veri Yönetimi** | Verileri JSON olarak dışa/içe aktarma, tüm verileri temizleme. |
| ⌨️ **Klavye Kısayolları** | Alt+U (Yükle), Alt+T (Test), Alt+D (Dashboard). |

### 🛠️ Teknoloji Yığını

| Teknoloji | Kullanım Amacı |
|-----------|---------------|
| **HTML5 / CSS3 / Vanilla JavaScript** | Frontend — hiçbir framework kullanılmadı, saf JavaScript |
| **IndexedDB** | Tarayıcı tarafında veri depolama (kelimeler, testler, ayarlar) |
| **Google Gemini 2.5 Flash API** | Kelime kategorilendirme ve test geri bildirimi |
| **SheetJS (xlsx)** | Excel dosyalarını okuma ve ayrıştırma (CDN üzerinden) |
| **Cloudflare Pages** | Frontend barındırma (hosting) |
| **Cloudflare Workers** | API proxy — Gemini API anahtarını gizleme |

---

## 2. 📋 Ön Gereksinimler

Kuruluma başlamadan önce aşağıdakilerin hazır olduğundan emin olun:

| # | Gereksinim | Açıklama |
|---|-----------|----------|
| 1 | 🔑 **Google Hesabı** | Gemini API anahtarı almak için gerekli. Gmail hesabınız varsa zaten var. |
| 2 | ☁️ **Cloudflare Hesabı** | `poofs.app` domaini zaten Cloudflare üzerinde yönetiliyor. [dash.cloudflare.com](https://dash.cloudflare.com) adresinden giriş yapabilmelisiniz. |
| 3 | 💻 **VS Code** | Kod editörü. [code.visualstudio.com](https://code.visualstudio.com/) adresinden indirin. |
| 4 | 🌐 **Live Server Eklentisi** | VS Code içinde yerel test için. Kurulum yöntemi aşağıda anlatılacak. |
| 5 | 🔧 **Git** | Versiyon kontrolü. [git-scm.com](https://git-scm.com/) adresinden indirin. Kurulumda tüm varsayılan ayarları kabul edin. |
| 6 | 📦 **Node.js ve npm** | Wrangler CLI için gerekli. [nodejs.org](https://nodejs.org/) adresinden **LTS** sürümünü indirin. npm otomatik olarak birlikte gelir. |
| 7 | 🌍 **Tarayıcı** | Google Chrome önerilir. DevTools ile hata ayıklama için en uygun seçenek. |

### Kurulumları Doğrulama

Terminali açın (VS Code içinde `` Ctrl+` `` tuşları ile) ve şu komutları çalıştırın:

```bash
git --version
# Beklenen çıktı: git version 2.x.x

node --version
# Beklenen çıktı: v18.x.x veya üzeri

npm --version
# Beklenen çıktı: 9.x.x veya üzeri
```

> ⚠️ **Dikkat:** Eğer bu komutlardan herhangi biri "komut bulunamadı" hatası verirse, ilgili programı yükleyin ve terminali yeniden başlatın.

---

## 3. 🔑 Adım 1: Gemini API Key Alma

Google Gemini API anahtarı, uygulamanın yapay zeka özelliklerini kullanabilmesi için gereklidir. Bu anahtar kelime kategorilendirme ve test geri bildirimi için kullanılır.

### Adım Adım:

1. Tarayıcınızda şu adresi açın: **https://aistudio.google.com/apikey**

2. Google hesabınız ile giriş yapın.
   - [Google giriş ekranı açılacak — e-posta ve şifrenizi girin]

3. API Keys sayfası açılacak. **"Create API Key"** butonuna tıklayın.
   - [Sayfanın üst kısmında mavi renkli "Create API Key" butonu göreceksiniz]

4. Açılan pencerede iki seçenek göreceksiniz:
   - **"Create API key in new project"** — Yeni bir Google Cloud projesi oluşturur (önerilen)
   - **Mevcut bir proje seçme** — Zaten bir projeniz varsa onu seçebilirsiniz
   - **"Create API key in new project"** seçeneğine tıklayın.

5. Birkaç saniye bekleyin. API anahtarınız oluşturulacak ve ekranda gösterilecek.
   - Anahtar `AIza` ile başlayan uzun bir karakter dizisidir.
   - Örnek: `AIzaSyD_XXXXXXXXXXXXXXXXXXXXXXXXXXXX`

6. **"Copy"** ikonuna tıklayarak anahtarı kopyalayın.

7. Kopyaladığınız anahtarı geçici olarak güvenli bir yere kaydedin (Notepad veya Not Defteri).

> 🔴 **KRİTİK GÜVENLİK UYARISI**
>
> - Bu API anahtarını **ASLA** frontend JavaScript koduna yazmayın.
> - Bu API anahtarını **ASLA** Git'e commit etmeyin.
> - Bu API anahtarını **ASLA** kimseyle paylaşmayın.
> - Bu API anahtarını **ASLA** herkese açık bir yerde (forum, sosyal medya vb.) paylaşmayın.
> - Anahtar yalnızca Cloudflare Worker'ın gizli değişkenlerine (Secrets) eklenecektir.
> - Eğer anahtarınız sızdırılırsa, başkaları sizin hesabınız üzerinden API çağrıları yapabilir ve size maliyet çıkarabilir.

> 💡 **İpucu:** API anahtarını kaybederseniz, aynı sayfadan yeni bir tane oluşturabilirsiniz. Eski anahtarı silmeyi (revoke) unutmayın.

---

## 4. 🔧 Adım 2: Cloudflare Worker Oluşturma (API Proxy)

Cloudflare Worker, frontend ile Gemini API arasında güvenli bir köprü (proxy) görevi görür. Bu sayede API anahtarınız hiçbir zaman kullanıcının tarayıcısında görünmez.

**İki yöntemden birini seçin:**

---

### Yöntem A: Cloudflare Dashboard Üzerinden (Kolay Yol)

Bu yöntem terminal kullanmadan, tamamıyla tarayıcı üzerinden yapılır. Başlangıç için önerilir.

#### Adım Adım:

**1.** Tarayıcınızda **https://dash.cloudflare.com** adresini açın ve giriş yapın.

**2.** Sol menüden **"Workers & Pages"** seçeneğine tıklayın.
   - [Sol kenar çubuğunda bir işçi ikonu ile birlikte "Workers & Pages" yazısını göreceksiniz]

**3.** Sağ üstteki **"Create"** butonuna tıklayın.
   - [Mavi renkli "Create" butonu sayfanın sağ üst köşesinde bulunur]

**4.** **"Create Worker"** seçeneğine tıklayın.
   - ["Workers" sekmesinde "Create Worker" yazılı bir kart göreceksiniz]

**5.** **Name** alanına `gemini-proxy` yazın.
   - [Worker'ınıza bir isim vermeniz isteniyor — `gemini-proxy` yazın]

**6.** **"Deploy"** butonuna tıklayın.
   - Bu, varsayılan "Hello World" kodu ile worker'ı oluşturur. Endişelenmeyin, kodu hemen değiştireceğiz.

**7.** Deployment başarılı olduktan sonra **"Edit Code"** butonuna tıklayın.
   - [Yeşil renkli başarı mesajının yanında "Edit Code" butonu göreceksiniz]

**8.** Açılan kod editöründe **mevcut tüm kodu silin** (Ctrl+A ile tümünü seç, Delete ile sil).

**9.** Aşağıdaki kodu **tamamen** kopyalayıp yapıştırın:

```javascript
export default {
  async fetch(request, env) {
    const allowedOrigins = [
      'https://poofs.app',
      'https://www.poofs.app',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.text();
    if (body.length > 1_000_000) {
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      const responseBody = await geminiResponse.text();

      return new Response(responseBody, {
        status: geminiResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'API request failed' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });
    }
  },
};
```

**10.** Sağ üstteki **"Save and Deploy"** butonuna tıklayın.
   - [Mavi renkli "Save and Deploy" butonu editörün sağ üst köşesindedir]

**11.** Deployment başarılı mesajını bekleyin.

**12.** Worker URL'inizi not edin. Şuna benzer olacak:
   ```
   https://gemini-proxy.KULLANICIADI.workers.dev
   ```
   - Buradaki `KULLANICIADI` sizin Cloudflare kullanıcı adınızdır.

> ✅ **Test:** Tarayıcıda `https://gemini-proxy.KULLANICIADI.workers.dev` adresini açın. `{"error":"Method not allowed"}` mesajını görmelisiniz. Bu **doğrudur** — çünkü tarayıcı GET isteği gönderir, Worker ise yalnızca POST kabul eder.

---

### Yöntem B: Wrangler CLI ile (Gelişmiş Yol)

Bu yöntem terminal kullanarak Worker'ı oluşturur. Daha hızlıdır ancak komut satırı bilgisi gerektirir.

#### Adım Adım:

**1.** VS Code'da terminali açın ( `` Ctrl+` `` tuşları ile).

**2.** Wrangler CLI'ı global olarak yükleyin:

```bash
npm install -g wrangler
```

**3.** Cloudflare hesabınızla giriş yapın:

```bash
wrangler login
```

   - Tarayıcı otomatik açılacak.
   - [Cloudflare yetkilendirme sayfası açılacak — "Allow" butonuna tıklayın]
   - Terminal'de "Successfully logged in" mesajını görmelisiniz.

**4.** Proje klasöründe `worker/` adında bir klasör oluşturun (eğer yoksa):

```bash
mkdir worker
```

**5.** `worker/wrangler.toml` dosyasını oluşturun ve şu içeriği yazın:

```toml
name = "gemini-proxy"
main = "index.js"
compatibility_date = "2024-01-01"
```

**6.** `worker/index.js` dosyasını oluşturun ve [Yöntem A, Adım 9](#yöntem-a-cloudflare-dashboard-üzerinden-kolay-yol)'daki kodun **aynısını** yapıştırın.

**7.** Terminal'de `worker` klasörüne gidin:

```bash
cd worker
```

**8.** Worker'ı deploy edin:

```bash
wrangler deploy
```

   - Başarılı mesaj ve Worker URL'ini göreceksiniz.

**9.** API anahtarını gizli değişken olarak ekleyin:

```bash
wrangler secret put GEMINI_API_KEY
```

   - Terminal "Enter a secret value:" diye soracak.
   - [Adım 1](#3--adım-1-gemini-api-key-alma)'de kaydettiğiniz API anahtarını yapıştırın ve Enter'a basın.
   - "Success! Uploaded secret GEMINI_API_KEY" mesajını görmelisiniz.

> 💡 **İpucu:** `wrangler secret put` komutu ile eklenen değerler şifrelenir (encrypted) ve bir daha okunamaz. Yalnızca Worker kodu `env.GEMINI_API_KEY` ile erişebilir.

---

## 5. 🔐 Adım 3: API Key'i Worker'a Ekleme

> ⚠️ **Not:** Eğer [Yöntem B](#yöntem-b-wrangler-cli-ile-gelişmiş-yol)'yi kullandıysanız ve `wrangler secret put` komutunu çalıştırdıysanız, bu adımı zaten tamamladınız. Bu bölüm **Yöntem A** kullananlar içindir.

API anahtarını Worker'ın gizli değişkenlerine (Secrets) eklemek, anahtarın güvenli bir şekilde saklanmasını sağlar. Şifrelenen değerler Cloudflare Dashboard'da bile tekrar görüntülenemez.

### Adım Adım:

**1.** **https://dash.cloudflare.com** adresine gidin ve giriş yapın.

**2.** Sol menüden **"Workers & Pages"** seçeneğine tıklayın.

**3.** Worker listesinden **`gemini-proxy`** isimli worker'a tıklayın.
   - [Worker listesinde "gemini-proxy" adını göreceksiniz — üzerine tıklayın]

**4.** Üstteki sekme menüsünden **"Settings"** sekmesine tıklayın.
   - [Sayfanın üstünde "Deployments", "Metrics", "Logs", "Settings" gibi sekmeler var — "Settings" seçin]

**5.** Sol taraftaki menüden **"Variables and Secrets"** seçeneğine tıklayın.
   - [Sol alt menüde "Variables and Secrets" yazısını göreceksiniz]

**6.** **"Add"** butonuna tıklayın.
   - [Sayfada "Add" butonu görünecek]

**7.** Açılan satırda:
   - **Type** açılır menüsünden **"Secret"** seçeneğini seçin (varsayılan "Text" olabilir — değiştirin).
   - **Variable name** alanına: `GEMINI_API_KEY` yazın (büyük harflerle, tam olarak böyle).
   - **Value** alanına: [Adım 1](#3--adım-1-gemini-api-key-alma)'de kopyaladığınız API anahtarını yapıştırın.

**8.** **"Encrypt"** butonuna tıklayın.
   - Bu, değeri şifreler. Şifreledikten sonra değeri bir daha göremezsiniz.

**9.** Sayfanın altındaki **"Save and Deploy"** butonuna tıklayın.
   - [Mavi renkli "Save and Deploy" butonu sayfanın en altında olacak]

> 💡 **Önemli Bilgiler:**
> - Şifrelenen (encrypted) secret'lar bir daha görüntülenemez — siz bile değeri göremezsiniz.
> - Worker kodunuz bu değere `env.GEMINI_API_KEY` şeklinde erişir.
> - Anahtarı değiştirmek isterseniz, aynı adımları tekrarlayarak yeni değeri girmeniz gerekir (eski değerin üzerine yazılır).
> - Bu sayede API anahtarınız sunucu tarafında güvenle saklanır ve hiçbir zaman kullanıcının tarayıcısına ulaşmaz.

---

## 6. 🌐 Adım 4: Custom Domain Bağlama (en-api.poofs.app)

Worker'ınıza `en-api.poofs.app` subdomain'i bağlayacağız. Bu sayede frontend kodunuz API çağrılarını `https://en-api.poofs.app` adresine yapacak.

### Adım Adım:

**1.** **https://dash.cloudflare.com** adresine gidin.

**2.** Sol menüden **"Workers & Pages"** seçeneğine tıklayın.

**3.** Worker listesinden **`gemini-proxy`** worker'ına tıklayın.

**4.** Üstteki sekme menüsünden **"Settings"** sekmesine tıklayın.

**5.** Sol taraftaki menüden **"Domains & Routes"** seçeneğine tıklayın.
   - [Sol menüde "Domains & Routes" yazısını göreceksiniz]

**6.** **"Add"** butonuna tıklayın.

**7.** Açılan menüden **"Custom Domain"** seçeneğini seçin.

**8.** Domain alanına şunu yazın:

```
en-api.poofs.app
```

**9.** **"Add Domain"** butonuna tıklayın.
   - [Cloudflare, `poofs.app` domaininizin DNS ayarlarında otomatik olarak gerekli CNAME kaydını oluşturacak]

**10.** Aktivasyon durumunu bekleyin — genellikle **1-2 dakika** sürer.
   - Durum "Initializing" → "Active" olarak değişecek.

**11.** Test edin: Tarayıcınızda şu adresi açın:

```
https://en-api.poofs.app
```

> ✅ **Beklenen Sonuç:** `{"error":"Method not allowed"}` mesajını görmelisiniz. Bu **tamamen normal ve doğrudur** — çünkü tarayıcı GET isteği gönderir, Worker ise sadece POST isteklerini kabul eder. Bu mesajı görüyorsanız Worker doğru çalışıyor demektir.

> ⚠️ **Eğer bu mesajı görmüyorsanız:**
> - DNS yayılımı henüz tamamlanmamış olabilir — 5 dakika bekleyip tekrar deneyin.
> - Cloudflare Dashboard'da DNS ayarlarını kontrol edin: `poofs.app` → DNS → `en-api` CNAME kaydının var olduğundan emin olun.

---

## 7. 📝 Adım 5: Proje Kodunda API URL'ini Güncelleme

Şimdi proje kodunu, API isteklerini `en-api.poofs.app` adresine yönlendirecek şekilde güncelleyeceğiz.

### Adım Adım:

**1.** VS Code'da `js/gemini-api.js` dosyasını açın.

**2.** Dosyanın üst kısmında API yapılandırma bölümünü bulun. Şuna benzer satırlar olacak:

```javascript
const PROXY_URL = 'https://api.yourdomain.com/';
```

**3.** Bu satırı şu şekilde değiştirin:

```javascript
const PROXY_URL = 'https://en-api.poofs.app/';
```

**4.** `DIRECT_KEY` değişkeninin **boş** olduğundan emin olun:

```javascript
const DIRECT_KEY = ''; // Replace with your key for local dev
```

> ⚠️ **Dikkat:** Yerel geliştirme sırasında doğrudan Gemini API kullanmak isterseniz `DIRECT_KEY` değişkenine geçici olarak anahtarınızı yazabilirsiniz. **AMA** commit etmeden önce mutlaka sildiğinizden emin olun!

**5.** Hiçbir JavaScript dosyasında API anahtarı kalmadığından emin olun:
   - VS Code'da **Ctrl+Shift+F** tuşlarına basın (tüm dosyalarda arama).
   - Arama kutusuna `AIza` yazın.
   - **Hiçbir sonuç çıkmamalı.** Eğer bir sonuç çıkarsa, o satırdaki anahtarı **hemen silin**.

**6.** Dosyayı kaydedin (**Ctrl+S**).

> 💡 **Auto-detect Mantığı:** Uygulama otomatik olarak ortamı algılar:
> - `localhost` veya `127.0.0.1` üzerindeyseniz → `DIRECT_URL` (doğrudan Gemini API) kullanılır.
> - Canlı sitede (`poofs.app`) ise → `PROXY_URL` (Cloudflare Worker) kullanılır.
>
> Bu sayede yerel geliştirme ve canlı site arasında sorunsuz geçiş yaparsınız.

---

## 8. 🧪 Adım 6: Yerel Test (Localhost)

Siteyi canlıya almadan önce yerel bilgisayarınızda test etmeniz çok önemlidir.

### Live Server Eklentisini Kurma

Eğer VS Code'da Live Server eklentisi yüklü değilse:

**1.** VS Code'da sol kenar çubuğundaki **Eklentiler** ikonuna tıklayın (veya **Ctrl+Shift+X**).

**2.** Arama kutusuna **"Live Server"** yazın.

**3.** **"Live Server"** eklentisini bulun (yazar: **Ritwick Dey**).
   - [Arama sonuçlarında ilk sırada çıkacak — yeşil ikon ve "Ritwick Dey" yazan seçenek]

**4.** **"Install"** butonuna tıklayın.

**5.** Kurulum tamamlandıktan sonra VS Code'u yeniden başlatın (isteğe bağlı ama önerilir).

### Projeyi Çalıştırma

**1.** VS Code'da proje klasörünü açın (**File → Open Folder** veya **Ctrl+K Ctrl+O**).

**2.** Sol panelde `index.html` dosyasına sağ tıklayın.

**3.** Açılan menüden **"Open with Live Server"** seçeneğine tıklayın.
   - [Sağ tık menüsünde "Open with Live Server" yazısını göreceksiniz]

**4.** Tarayıcı otomatik olarak açılacak:
   ```
   http://127.0.0.1:5500
   ```
   veya
   ```
   http://localhost:5500
   ```

### Tam İşlevsellik Testi

Aşağıdaki adımları sırayla test edin:

#### ✅ 1. Excel Dosyası Yükleme
- Sol menüden **"📤 Upload Words"** seçeneğine tıklayın.
- En az 10 kelimelik bir Excel dosyası yükleyin.
- Dosya formatı (en az 2 sütun gerekli):

| Sütun A | Sütun B | Sütun C |
|---------|---------|---------|
| apple | [ˈæpəl] | alma |
| book | [bʊk] | kitap |
| ... | ... | ... |

- Dosyayı sürükleyip bırakın veya "Browse Files" butonuna tıklayın.

#### ✅ 2. Gemini Kategorilendirme
- Dosya yüklendikten sonra önizleme tablosu görünecek.
- **"✨ Confirm & Categorize with AI"** butonuna tıklayın.
- Yükleme çubuğu yanıp sönecek — Gemini API yanıt verene kadar bekleyin.
- Başarılı olursa kelimeler otomatik olarak kategorilere ayrılacak ve tabloda görünecek.

#### ✅ 3. Kelime Tablosu
- Arama kutusunu test edin.
- Kategori filtrelerini test edin.
- Sıralama seçeneklerini test edin.
- Bir kelimenin yanındaki ✅/❌ butonuna tıklayarak öğrenildi/öğrenilmedi durumunu değiştirin.

#### ✅ 4. Flashcard'lar
- Sol menüden **"🃏 Flashcards"** seçeneğine tıklayın.
- Kartı tıklayarak çevirin.
- ← → ok tuşları ile gezinin.
- Space tuşu ile kartı çevirin.

#### ✅ 5. Test Modu
- Önce en az birkaç kelimeyi "öğrenildi" olarak işaretleyin (Flashcard'lar veya Kelime Tablosu'nda).
- Sol menüden **"📝 Tests"** seçeneğine tıklayın.
- **"English → Turkmen"** veya **"Turkmen → English"** modunu seçin.
- Tüm soruları cevaplayın.
- Sonuçlar sayfasında skor, kelime detayları ve Gemini geri bildirimini kontrol edin.

#### ✅ 6. Dashboard
- Sol menüden **"📊 Dashboard"** seçeneğine tıklayın.
- İstatistiklerin doğru olduğunu kontrol edin.
- Test geçmişinin göründüğünden emin olun.

#### ✅ 7. Tema
- Sağ üstteki 🌙/☀️ butonuna tıklayarak temayı değiştirin.

### Sorun Giderme (Yerel Test)

Eğer Gemini API çağrıları başarısız olursa:

**1.** Worker çalışıyor mu? Tarayıcıda `https://en-api.poofs.app` adresini açın.
   - `{"error":"Method not allowed"}` görüyorsanız → Worker çalışıyor ✅
   - Sayfa açılmıyorsa → Worker deploy edilmemiş veya domain bağlanmamış ❌

**2.** API anahtarı eklendi mi? [Adım 3](#5--adım-3-api-keyi-workera-ekleme)'ü kontrol edin.

**3.** `localhost:5500` izin verilen origin listesinde mi? Worker kodundaki `allowedOrigins` dizisinde şu satırlar olmalı:
   ```javascript
   'http://localhost:5500',
   'http://127.0.0.1:5500',
   ```

**4.** Tarayıcı DevTools'u açın (**F12** tuşu):
   - **Console** sekmesi: Kırmızı renkli hata mesajlarını kontrol edin.
   - **Network** sekmesi: API isteğinin durumunu kontrol edin (Status Code, Response).

> 💡 **İpucu:** Network sekmesinde POST isteğini bulun ve "Response" kısmına bakın. Gemini'den dönen hata mesajı sorunu anlamanıza yardımcı olacaktır.

---

## 9. 🚀 Adım 7: Siteyi Cloudflare Pages'a Yayınlama

Yerel testler başarılı olduktan sonra, siteyi canlıya alabiliriz. İki yöntem var:

---

### Yöntem A: Git ile Otomatik Deploy (Önerilen)

Bu yöntemde kodu GitHub'a push ettiğinizde Cloudflare otomatik olarak siteyi günceller. En pratik yöntemdir.

#### Adım Adım:

**1.** VS Code'da terminali açın ( `` Ctrl+` `` ).

**2.** Proje klasörünüzde olduğunuzdan emin olun:

```bash
cd c:\Users\Alybeg\Desktop\english
```

**3.** Git reposunu başlatın (eğer başlatılmadıysa):

```bash
git init
```

**4.** Tüm dosyaları staging'e ekleyin:

```bash
git add .
```

> ⚠️ **Dikkat:** `git add .` komutunu çalıştırmadan önce projede API anahtarı kalmadığından emin olun! `js/gemini-api.js` dosyasında `DIRECT_KEY` boş olmalı.

**5.** İlk commit'i oluşturun:

```bash
git commit -m "VocabMaster initial release"
```

**6.** Ana dalı `main` olarak ayarlayın:

```bash
git branch -M main
```

**7.** GitHub remote'unu ekleyin:

```bash
git remote add origin https://github.com/alibeg-begow/test.git
```

> 💡 **Not:** Eğer remote zaten ekliyse, `fatal: remote origin already exists` hatası alırsınız. Bu durumda bu adımı atlayın.

**8.** Kodu GitHub'a push edin:

```bash
git push -u origin main
```

   - GitHub kullanıcı adınız ve şifreniz (veya personal access token) istenebilir.
   - Push başarılı olduktan sonra kodunuz GitHub'da görünür olacak.

**9.** Cloudflare Dashboard'a gidin: **https://dash.cloudflare.com**

**10.** Sol menüden **"Workers & Pages"** seçeneğine tıklayın.

**11.** **"Create"** butonuna tıklayın.

**12.** **"Pages"** sekmesine tıklayın.
   - [Sayfanın üstünde "Workers" ve "Pages" sekmeleri var — "Pages" seçin]

**13.** **"Connect to Git"** seçeneğine tıklayın.

**14.** GitHub hesabınızı yetkilendirin (eğer ilk kez yapıyorsanız):
   - [GitHub'a yönlendirileceksiniz — "Authorize Cloudflare" butonuna tıklayın]
   - Hangi repoları erişilebilir yapacağınızı seçin (tüm repolar veya sadece seçili olanlar).

**15.** Repository listesinden **`alibeg-begow/test`** reposunu seçin.
   - [Repository listesinde "test" reposunu bulun ve seçin]

**16.** **"Begin setup"** butonuna tıklayın.

**17.** Build ayarlarını yapılandırın:
   - **Project name:** `vocabmaster` (veya istediğiniz bir isim)
   - **Production branch:** `main`
   - **Framework preset:** `None` (açılır menüden "None" seçin)
   - **Build command:** Boş bırakın (temizleyin).
   - **Build output directory:** `/` yazın (kök dizin).

**18.** **"Save and Deploy"** butonuna tıklayın.

**19.** Deployment'ın tamamlanmasını bekleyin (genellikle 30-60 saniye).
   - [İlerleme çubuğu ve log mesajları göreceksiniz]

**20.** Deployment başarılı olduktan sonra Cloudflare size bir URL verecek:
   ```
   https://vocabmaster-xxx.pages.dev
   ```
   - Bu URL'yi tarayıcıda açarak sitenizi test edebilirsiniz.

> ✅ **Otomatik Deploy:** Bundan sonra `main` dalına her push yaptığınızda Cloudflare otomatik olarak siteyi günceller. Manuel işlem gerekmez!

---

### Yöntem B: Doğrudan Upload

Bu yöntem Git kullanmadan, dosyaları doğrudan Cloudflare'a yükler.

#### Adım Adım:

**1.** **https://dash.cloudflare.com** adresine gidin.

**2.** Sol menüden **"Workers & Pages"** seçeneğine tıklayın.

**3.** **"Create"** butonuna tıklayın.

**4.** **"Pages"** sekmesine tıklayın.

**5.** **"Direct Upload"** seçeneğine tıklayın.
   - ["Connect to Git" yerine "Direct Upload" yazılı bağlantıya tıklayın]

**6.** **Project name** alanına `vocabmaster` yazın.

**7.** **"Create Project"** butonuna tıklayın.

**8.** Açılan upload sayfasında:
   - Proje klasörünüzdeki **tüm dosyaları** (index.html, css/, js/ klasörleri) seçin.
   - Sürükleyip bırakın veya "Select Files" ile seçin.

> ⚠️ **Dikkat:** `worker/` klasörünü **yüklemeyin** — o ayrı bir Worker olarak deploy edildi. Sadece frontend dosyalarını yükleyin: `index.html`, `css/`, `js/`.

**9.** **"Deploy Site"** butonuna tıklayın.

**10.** Deployment tamamlandığında URL'nizi göreceksiniz:
   ```
   https://vocabmaster-xxx.pages.dev
   ```

> 💡 **Not:** Doğrudan upload yönteminde güncelleme yapmak için her seferinde dosyaları tekrar yüklemeniz gerekir. Git yöntemi daha pratiktir.

---

## 10. 🔗 Adım 8: Custom Domain Bağlama (poofs.app)

Cloudflare Pages projenize `poofs.app` domainini bağlayacağız.

### Adım Adım:

**1.** Cloudflare Dashboard'da **"Workers & Pages"** sayfasına gidin.

**2.** Pages projelerinizden **`vocabmaster`** projesine tıklayın.

**3.** Üstteki sekme menüsünden **"Custom domains"** sekmesine tıklayın.
   - ["Deployments", "Custom domains", "Settings" sekmeleri var — "Custom domains" seçin]

**4.** **"Set up a custom domain"** butonuna tıklayın.

**5.** Domain alanına şunu yazın:

```
poofs.app
```

**6.** **"Continue"** butonuna tıklayın.
   - [Cloudflare, DNS ayarlarını otomatik olarak yapılandıracak]

**7.** **"Activate domain"** butonuna tıklayın.

**8.** Aynı işlemi `www.poofs.app` için de tekrarlayın:
   - **"Set up a custom domain"** butonuna tekrar tıklayın.
   - `www.poofs.app` yazın.
   - **"Continue"** → **"Activate domain"** butonlarına tıklayın.

**9.** SSL sertifikasının aktif olmasını bekleyin (genellikle **1-5 dakika**).
   - Durum "Initializing" → "Active" olarak değişecek.

**10.** www → root yönlendirmesi ayarlayın (isteğe bağlı ama önerilir):
   - Cloudflare Dashboard'da `poofs.app` domaininize gidin.
   - **Rules** → **"Redirect Rules"** → **"Create Rule"** tıklayın.
   - Rule name: `www to root`
   - When: Hostname equals `www.poofs.app`
   - Then: Dynamic redirect → `https://poofs.app${http.request.uri.path}` (Status: 301)
   - **"Deploy"** tıklayın.

**11.** Sitenizi test edin:

```
https://poofs.app
```

> ✅ **Beklenen Sonuç:** VocabMaster uygulaması açılmalı ve tam olarak çalışmalı!

---

## 11. ✅ Adım 9: Son Kontroller

Aşağıdaki kontrol listesini tek tek kontrol edin ve her maddenin yanındaki kutuyu işaretleyin:

### İşlevsellik Kontrolleri

- [ ] `https://poofs.app` açılıyor mu?
- [ ] Sayfa düzgün yükleniyor mu (yükleme çarkı dönmüyor mu)?
- [ ] Excel dosyası yüklenebiliyor mu?
- [ ] Gemini kategorilendirme çalışıyor mu (kelimeler kategorilere ayrılıyor mu)?
- [ ] Kelime tablosu ve filtreler çalışıyor mu?
- [ ] Flashcard'lar düzgün gösteriliyor mu (çevirme animasyonu vb.)?
- [ ] Test modu çalışıyor mu (sorular geliyor, cevap verilebiliyor mu)?
- [ ] Test sonuçlarında Gemini geri bildirimi geliyor mu?
- [ ] Dashboard istatistikleri doğru mu?
- [ ] Dark/Light tema çalışıyor mu?
- [ ] Sayfa yenilendiğinde (F5) veriler korunuyor mu?
- [ ] Veri dışa aktarma (Export) çalışıyor mu?
- [ ] Veri içe aktarma (Import) çalışıyor mu?

### Güvenlik Kontrolleri

- [ ] `js/gemini-api.js` dosyasında API key **YOK** mu?
- [ ] Tarayıcı DevTools → **Sources** sekmesinde API key görünmüyor mu?
- [ ] VS Code'da tüm dosyalarda `AIza` araması sonuçsuz mu? (**Ctrl+Shift+F** → `AIza` yaz)
- [ ] `https://en-api.poofs.app` adresine GET isteği "Method not allowed" döndürüyor mu?

### Performans Kontrolleri

- [ ] Sayfa 3 saniyeden kısa sürede açılıyor mu?
- [ ] Mobil cihazda düzgün görünüyor mu?
- [ ] Farklı tarayıcılarda (Chrome, Firefox, Edge) çalışıyor mu?

---

## 12. 🔧 Sorun Giderme

Karşılaşabileceğiniz yaygın sorunlar ve çözümleri:

| Sorun | Olası Neden | Çözüm |
|-------|------------|-------|
| `API error: 403 Forbidden` | Worker origin kontrolü, domain izin listesinde yok | Worker kodundaki `allowedOrigins` dizisine domaininizi ekleyin ve tekrar deploy edin |
| `API error: 401 Unauthorized` | API key hatalı veya eksik | Cloudflare Dashboard → Worker → Settings → Variables and Secrets'ta `GEMINI_API_KEY` değerini kontrol edin. Gerekirse yeniden ekleyin |
| `API error: 429 Too Many Requests` | Gemini API rate limit aşıldı | Birkaç dakika bekleyin ve tekrar deneyin. Ücretsiz planda dakikada belirli sayıda istek sınırı var |
| `Failed to fetch` | Worker URL yanlış veya Worker çalışmıyor | `js/gemini-api.js` dosyasındaki `PROXY_URL` değerini kontrol edin. `https://en-api.poofs.app/` olmalı |
| `Network Error` | İnternet bağlantısı yok veya Worker erişilemez | İnternet bağlantınızı kontrol edin. `https://en-api.poofs.app` adresini tarayıcıda açmayı deneyin |
| Kelimeler kayboluyor | Tarayıcı verileri temizlendi (IndexedDB silindi) | Tarayıcı ayarlarından site verilerini silmeyin. "Tüm geçmişi temizle" yaparken dikkatli olun |
| Excel yüklenmiyor | Dosya formatı hatalı veya boyut çok büyük | `.xlsx` veya `.xls` formatı kullanın. Maksimum dosya boyutu 5 MB. En az 2 sütun (İngilizce ve Türkmence) olmalı |
| Gemini boş cevap döndürüyor | Token limiti aşıldı veya kelime sayısı çok fazla | Kelime sayısını azaltın (maksimum 200). Daha kısa kelimeler deneyin |
| Site açılmıyor (DNS hatası) | DNS yayılımı tamamlanmamış | 5-10 dakika bekleyin. Cloudflare Dashboard'da DNS kayıtlarını kontrol edin |
| CSS bozuk görünüyor | Tarayıcı cache sorunu | **Ctrl+Shift+R** ile hard refresh yapın. Veya DevTools → Network → "Disable cache" kutusunu işaretleyin |
| Worker editörü açılmıyor | Tarayıcı engeli veya eklenti sorunu | Farklı bir tarayıcı deneyin. Reklam engelleyici eklentileri geçici olarak devre dışı bırakın |
| `git push` başarısız | GitHub kimlik doğrulama hatası | Personal Access Token (PAT) oluşturun: GitHub → Settings → Developer Settings → Personal Access Tokens → Generate New Token |
| Flashcard çevirme çalışmıyor | JavaScript hatası | DevTools Console'da hata mesajını kontrol edin. Sayfayı yenileyin (F5) |
| Test sonucunda AI geri bildirimi gelmiyor | Worker timeout veya API hatası | Console'da hata mesajını kontrol edin. Worker'ın çalıştığından emin olun |

### DevTools ile Hata Ayıklama

Herhangi bir sorunla karşılaştığınızda:

**1.** Tarayıcıda **F12** tuşuna basarak DevTools'u açın.

**2.** **Console** sekmesi: Kırmızı renkli hata mesajlarını okuyun. Hatanın hangi dosyadan kaynaklandığını gösterir.

**3.** **Network** sekmesi: API isteklerini filtreleyin:
   - Filtre kutusuna `en-api` yazın.
   - POST isteklerinin durumunu (Status) kontrol edin:
     - **200** = Başarılı ✅
     - **403** = Origin engellendi (Worker'a domain eklenmemiş) ❌
     - **401** = API key hatalı ❌
     - **429** = Rate limit aşıldı ⚠️
     - **500** = Sunucu hatası ❌
   - İsteğe tıklayıp **Response** sekmesinde dönen cevabı inceleyin.

---

## 13. 🛡️ Güvenlik Notları

### API Anahtarı Güvenliği

| ❌ YAPMAYIN | ✅ YAPIN |
|------------|---------|
| API key'i JavaScript dosyasına yazmayın | API key'i Cloudflare Worker Secrets'a ekleyin |
| API key'i Git'e commit etmeyin | `.gitignore` dosyasına hassas dosyaları ekleyin |
| API key'i herkese açık bir yerde paylaşmayın | Key'i Notepad'de geçici olarak saklayın, sonra silin |
| API key'i URL parametresi olarak göndermeyin | Worker proxy üzerinden göndermeyi kullanın |

### Worker Güvenliği

- Worker **yalnızca** `allowedOrigins` listesindeki sitelerden gelen istekleri kabul eder.
- Listedeki siteler:
  - `https://poofs.app` — canlı site
  - `https://www.poofs.app` — www versiyonu
  - `http://localhost:5500` — yerel geliştirme (Live Server)
  - `http://127.0.0.1:5500` — yerel geliştirme (alternatif)
  - `http://localhost:3000` — yerel geliştirme (alternatif port)
  - `http://127.0.0.1:3000` — yerel geliştirme (alternatif port)
- Başka siteler Worker'ınızı **kullanamaz** — CORS koruması aktiftir.
- Worker yalnızca **POST** isteklerini kabul eder — GET, PUT, DELETE engellenir.
- İstek boyutu **1 MB** ile sınırlıdır — büyük boyutlu kötü niyetli istekler engellenir.

### API Anahtarını Değiştirme

Eğer API anahtarınızı değiştirmeniz gerekirse:

1. **Google AI Studio** → [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Eski anahtarı silin (Delete/Revoke).
2. Yeni bir anahtar oluşturun.
3. **Cloudflare Dashboard** → Workers & Pages → `gemini-proxy` → Settings → Variables and Secrets.
4. `GEMINI_API_KEY` değerini güncelleyin → "Encrypt" → "Save and Deploy".

### Git Güvenliği

Eğer API anahtarı yanlışlıkla Git geçmişine commit edildiyse:

> ⚠️ **Uyarı:** `git push --force` mevcut geçmişi değiştirir. Dikkatli kullanın.

```bash
# Git geçmişinden hassas dosyayı tamamen kaldırma
git filter-branch --force --tree-filter "sed -i 's/AIza[A-Za-z0-9_-]*/REMOVED/g' js/gemini-api.js" HEAD
git push --force
```

Bu durumda **eski API anahtarını hemen revoke edin** ve yeni bir tane oluşturun.

---

## 14. 📁 Proje Yapısı

```
vocabmaster/
├── index.html              # Ana HTML dosyası — uygulama kabuğu (header, sidebar, main)
├── README.md               # Bu dosya — kurulum rehberi
│
├── css/
│   ├── style.css           # Ana stil dosyası — renk temaları, layout, tablolar, kartlar
│   └── animations.css      # Animasyonlar — geçişler, hover efektleri, spinner
│
├── js/
│   ├── utils.js            # Sabitler, yardımcı fonksiyonlar (formatTime, escapeHtml, showToast vb.)
│   ├── storage.js          # IndexedDB CRUD işlemleri — kelime, test, ayar yönetimi
│   ├── gemini-api.js       # Gemini API entegrasyonu — kategorilendirme ve geri bildirim
│   ├── excel-parser.js     # Excel dosyası okuma — akıllı sütun algılama ve ayrıştırma
│   ├── learning-panel.js   # Kelime tablosu — filtreleme, sıralama, sayfalama, toplu işlemler
│   ├── flashcards.js       # Flashcard görünümü — çevirme animasyonu, klavye kısayolları
│   ├── test-engine.js      # Test motoru — soru gösterme, cevap kontrolü, zamanlayıcı
│   ├── results.js          # Test sonuçları — skor daire grafiği, kelime detayları
│   ├── user-dashboard.js   # Dashboard — istatistikler, test geçmişi, veri yönetimi
│   └── app.js              # Ana uygulama — hash-based routing, tema, sidebar, başlatma
│
└── worker/
    ├── index.js            # Cloudflare Worker kodu — Gemini API proxy
    └── wrangler.toml       # Worker yapılandırma dosyası (Wrangler CLI için)
```

### Dosya Yükleme Sırası (Önemli!)

`index.html` dosyasındaki `<script>` etiketleri belirli bir sırada yüklenmektedir. Bu sıra **bağımlılık zincirini** yansıtır:

```
1. SheetJS (CDN) — Excel okuma kütüphanesi
2. utils.js      — Sabitler ve yardımcı fonksiyonlar (tüm modüller kullanır)
3. storage.js    — Veritabanı katmanı (diğer modüller kullanır)
4. gemini-api.js — API katmanı (excel-parser ve test-engine kullanır)
5. excel-parser.js
6. learning-panel.js
7. flashcards.js
8. test-engine.js
9. results.js
10. user-dashboard.js
11. app.js        — Son olarak yüklenir, her şeyi başlatır
```

---

## 15. 🔄 Güncelleme Nasıl Yapılır

### Git ile Deploy Yapıyorsanız (Yöntem A)

Kod değişikliklerınızı yaptıktan sonra:

```bash
# 1. Değişiklikleri kontrol edin
git status

# 2. Değişiklikleri staging'e ekleyin
git add .

# 3. Commit oluşturun (açıklayıcı bir mesaj yazın)
git commit -m "Yeni özellik: kelime silme eklendi"

# 4. GitHub'a push edin
git push
```

**Hepsi bu kadar!** Cloudflare otomatik olarak değişiklikleri algılar ve siteyi günceller. Deployment süreci genellikle 30-60 saniye sürer.

Deployment durumunu kontrol etmek için:
- Cloudflare Dashboard → Workers & Pages → `vocabmaster` → Deployments sekmesi.
- [En son deployment'ın "Success" durumunda olduğunu göreceksiniz]

### Doğrudan Upload ile Deploy Yapıyorsanız (Yöntem B)

1. Cloudflare Dashboard → Workers & Pages → `vocabmaster` projesine gidin.
2. **"Create new deployment"** butonuna tıklayın.
3. Güncellenmiş dosyaları tekrar yükleyin.
4. **"Deploy Site"** butonuna tıklayın.

> 💡 **Öneri:** Sık güncelleme yapıyorsanız Git yöntemine (Yöntem A) geçmenizi şiddetle öneririz. Her güncelleme için tek yapmanız gereken `git push` komutudur.

---

## 📌 Hızlı Başvuru

Sık kullanılan bağlantılar ve komutlar:

| Kaynak | URL / Komut |
|--------|-------------|
| 🌐 Canlı Site | `https://poofs.app` |
| 🔧 API Proxy | `https://en-api.poofs.app` |
| 📊 Cloudflare Dashboard | `https://dash.cloudflare.com` |
| 🔑 Gemini API Keys | `https://aistudio.google.com/apikey` |
| 📦 GitHub Repo | `https://github.com/alibeg-begow/test` |
| 💻 Yerel Geliştirme | `http://127.0.0.1:5500` |
| 🚀 Deploy (Git) | `git add . && git commit -m "mesaj" && git push` |
| 🔐 Secret Güncelleme | `wrangler secret put GEMINI_API_KEY` |

---

> 📖 **Bu rehber, VocabMaster projesini sıfırdan canlı bir siteye dönüştürmek için gerekli tüm adımları kapsamaktadır. Herhangi bir sorunla karşılaşırsanız [Sorun Giderme](#12--sorun-giderme) bölümünü inceleyin.**
