# Hızlı Başlangıç Kılavuzu

## Test İçin (Development)

### 1. Gereksinimler
- Node.js 18+
- Rust (rustup ile kurulabilir)
- **Visual Studio Build Tools** (Windows için - **ZORUNLU**)

### 2. Visual Studio Build Tools Kurulumu
**ÖNEMLİ**: Desktop uygulaması olarak açmak için mutlaka kurulmalı!

1. [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) indirin
2. Kurulum sırasında **"Desktop development with C++"** workload'unu seçin
3. Windows SDK'yı seçin
4. Kurulumdan sonra terminali yeniden başlatın

### 3. Kurulum
```bash
# Bağımlılıkları yükle
npm install

# Rust toolchain kontrolü
rustup default stable
```

### 4. Çalıştırma

**Desktop uygulaması olarak (Tauri window):**
```bash
npm run tauri:dev
```

**Sadece frontend test (browser'da):**
```bash
npm run dev
# http://localhost:1420 adresinde açılır
```

**Not**: 
- `link.exe` hatası alırsanız → Visual Studio Build Tools kurulu değil
- Desktop uygulaması açılmıyorsa → Rust derlemesi başarısız, Build Tools gerekli

---

## Build İçin (Production)

### 1. Ön Hazırlık
```bash
# Frontend build
npm run build

# Rust release build
npm run tauri:build
```

### 2. Build Çıktıları
Installer dosyaları şu konumda:
```
src-tauri/target/release/bundle/
├── msi/Imesta QR Scanner_1.0.0_x64_en-US.msi
└── nsis/Imesta QR Scanner_1.0.0_x64-setup.exe
```

### 3. Sorun Giderme

**Linker hatası alırsanız:**
- Visual Studio Build Tools kurun
- "Desktop development with C++" workload'unu seçin

**Port erişim hatası:**
- Uygulamayı yönetici olarak çalıştırın

---

## Yapılandırma

### API URL
`.env` dosyası oluşturun:
```env
VITE_API_URL=https://api.imesta.com
```

### Icon Dosyaları
`src-tauri/icons/` klasörüne ekleyin:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.ico` (Windows)
- `icon.icns` (macOS - opsiyonel)

---

## Önemli Notlar

- İlk build uzun sürebilir (Rust bağımlılıkları derleniyor)
- Visual Studio Build Tools olmadan build yapılamaz
- Development modunda Vite dev server otomatik başlar (http://localhost:1420)

