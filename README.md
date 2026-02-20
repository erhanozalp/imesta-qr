# Imesta QR Scanner

Modern, hafif ve hızlı QR kod tarayıcı uygulaması. Tauri + Vue 3 + TypeScript ile geliştirilmiştir.

## Özellikler

- ✅ **Modern UI**: Tailwind CSS ile tasarlanmış, koyu tema arayüz
- ✅ **QR Kod Okuma**: USB Seri Port ve Keyboard Hook desteği
- ✅ **Müşteri Yönetimi**: Müşteri bilgileri, puanlar, rütbeler
- ✅ **İşlem Yönetimi**: Puan verme, ödül kullanma, indirim uygulama
- ✅ **Sistem Tray**: Arka planda çalışma, tray icon desteği
- ✅ **Port Yönetimi**: Otomatik port tarama ve manuel seçim
- ✅ **Log Sistemi**: Gerçek zamanlı log takibi
- ✅ **Toast Bildirimleri**: Başarı/hata bildirimleri

## Gereksinimler

- **Node.js** 18+ 
- **Rust** (rustup ile kurulabilir)
- **Visual Studio Build Tools** (Windows için - Rust derleme için gerekli)

## Kurulum

### Geliştirme Ortamı

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run tauri:dev
```

### Production Build

```bash
# Frontend build
npm run build

# Tauri build (Windows installer oluşturur)
npm run tauri:build
```

Build çıktıları `src-tauri/target/release/bundle/` klasöründe olacaktır.

## Yapılandırma

### API URL

`.env` dosyası oluşturun:

```env
VITE_API_URL=https://api.imesta.com
```

### Port Ayarları

Uygulama içindeki ayarlar menüsünden:
- Otomatik port tarama
- Manuel port seçimi
- Pencere davranışları

## Geliştirme

### Proje Yapısı

```
imesta-qr/
├── src/                    # Vue frontend
│   ├── components/         # Vue component'leri
│   ├── stores/            # Pinia state management
│   ├── services/          # API ve Tauri servisleri
│   └── views/             # Sayfa component'leri
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands.rs    # IPC command'ları
│   │   ├── serial.rs      # Serial port yönetimi
│   │   ├── keyboard.rs    # Keyboard hook
│   │   └── tray.rs        # Tray icon yönetimi
│   └── tauri.conf.json    # Tauri yapılandırması
└── package.json
```

### Önemli Notlar

- **Visual Studio Build Tools**: Windows'ta Rust derlemesi için gereklidir. Linker hatası alırsanız, Visual Studio Build Tools'u kurun.
- **Port İzinleri**: Windows'ta COM port erişimi için yönetici izni gerekebilir.
- **Keyboard Hook**: Global keyboard hook, QR cihazlarının klavye gibi davranması durumunda kullanılır.

## Lisans

MIT

## Destek

Sorunlar için GitHub Issues kullanın.
