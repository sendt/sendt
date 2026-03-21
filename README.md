# CanoApp - Canlı Mezat Platformu 🎥

**canoapp.net** - TikTok/Instagram tarzı canlı yayın mezat platformu.

## Proje Hakkında

Satıcılar canlı yayın açar, alıcılar gerçek zamanlı açık artırma ile ürün satın alır.

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes + Socket.io |
| Veritabanı | PostgreSQL + Prisma ORM |
| Auth | JWT (cookie tabanlı) |
| Real-time | Socket.io (canlı teklif, sohbet) |
| Canlı Yayın | Agora SDK (yapılandırılacak) |
| Ödeme | iyzico (Türk ödeme sistemi) |

## Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. .env Dosyasını Ayarla
```bash
cp .env.example .env
# DATABASE_URL, JWT_SECRET, AGORA, IYZICO ayarlarını gir
```

### 3. Veritabanı Migration
```bash
npm run db:migrate
```

### 4. Geliştirme Sunucusu
```bash
npm run dev
```

## Sayfalar

| Sayfa | URL | Açıklama |
|-------|-----|----------|
| Ana Sayfa | `/` | Landing page |
| Giriş | `/login` | Kullanıcı girişi |
| Kayıt | `/register` | Yeni üyelik (alıcı/satıcı) |
| Canlı Yayınlar | `/live` | Tüm yayınları listele |
| Yayın | `/live/[id]` | Canlı yayın + açık artırma |
| Cüzdan | `/wallet` | Bakiye yönetimi |
| Satıcı Paneli | `/seller/dashboard` | Satıcı yönetim ekranı |
| Ürünlerim | `/seller/products` | Ürün ekle/yönet |
| Yayınlarım | `/seller/streams` | Yayın aç/yönet |

## İş Akışı

### Satıcı:
1. Kayıt ol (Satıcı seç)
2. Ürün ekle
3. Yayın oluştur ve başlat
4. Mezat başlat (ürün seç, süre belirle)
5. Teklif gelince izle, süre dolunca mezatı bitir

### Alıcı:
1. Kayıt ol (Alıcı seç)
2. Cüzdana bakiye yükle
3. Canlı yayına gir
4. Teklif ver
5. Kazanırsan ürün sana gönderilir

## Yapılacaklar (v2)

- [ ] Agora SDK ile gerçek video yayın
- [ ] iyzico ödeme entegrasyonu
- [ ] Push bildirimleri (yayın başladığında)
- [ ] Kargo takip sistemi
- [ ] Satıcı doğrulama
- [ ] Admin paneli
- [ ] Mobil uygulama
