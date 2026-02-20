# Build Kılavuzu

## Windows Build

### Gereksinimler

1. **Node.js** (18+)
2. **Rust** (rustup ile kurulabilir)
3. **Visual Studio Build Tools** veya **Visual Studio Community**
   - C++ build tools
   - Windows SDK

### Kurulum Adımları

1. **Rust Kurulumu**
   ```powershell
   # Rustup'ı indir ve kur: https://rustup.rs/
   rustup toolchain install stable
   rustup default stable
   ```

2. **Visual Studio Build Tools**
   - [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) indirin
   - "Desktop development with C++" workload'unu seçin
   - Windows SDK'yı seçin

3. **Proje Bağımlılıkları**
   ```bash
   npm install
   ```

### Build Komutları

```bash
# Development build (debug)
npm run tauri:dev

# Production build (release)
npm run tauri:build

# Debug build (release modunda ama debug bilgileriyle)
npm run tauri:build:debug
```

### Build Çıktıları

Build tamamlandığında, installer dosyaları şu konumda olacaktır:

```
src-tauri/target/release/bundle/
├── msi/
│   └── Imesta QR Scanner_1.0.0_x64_en-US.msi
└── nsis/
    └── Imesta QR Scanner_1.0.0_x64-setup.exe
```

### MSI vs NSIS

- **MSI**: Windows Installer formatı, daha standart
- **NSIS**: Daha küçük dosya boyutu, özelleştirilebilir

## Sorun Giderme

### Linker Hatası

```
error: linker `link.exe` not found
```

**Çözüm**: Visual Studio Build Tools'u kurun ve PATH'e ekleyin.

### Port Erişim Hatası

```
error: Access denied (os error 5)
```

**Çözüm**: Uygulamayı yönetici olarak çalıştırın veya port izinlerini kontrol edin.

### Rust Toolchain Hatası

```
error: toolchain 'stable-x86_64-pc-windows-msvc' is not installed
```

**Çözüm**:
```bash
rustup toolchain install stable-x86_64-pc-windows-msvc
rustup default stable-x86_64-pc-windows-msvc
```

## CI/CD

GitHub Actions workflow'u `.github/workflows/release.yml` dosyasında tanımlıdır.

Tag push edildiğinde otomatik olarak:
1. Release oluşturulur
2. Windows build yapılır
3. Installer dosyaları release'e eklenir

```bash
git tag v1.0.0
git push origin v1.0.0
```


