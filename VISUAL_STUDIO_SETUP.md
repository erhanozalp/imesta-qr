# Visual Studio Build Tools Kurulum Rehberi

## Adım Adım Kurulum

### 1. İndirme
[Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) indirin

### 2. Kurulum Sırasında Seçilecekler

Kurulum başladığında:

1. **"Desktop development with C++"** workload'unu seçin
   - Bu otomatik olarak şunları içerir:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools
     - Windows 10/11 SDK
     - CMake tools for Windows
     - C++ core features

2. **Sağ tarafta "Installation details"** bölümünde kontrol edin:
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools (Latest)
   - ✅ Windows 10 SDK (en son sürüm, örn: 10.0.22621.0)
   - ✅ C++ CMake tools for Windows

3. **"Install"** butonuna tıklayın

### 3. Kurulum Sonrası

1. Kurulum tamamlandıktan sonra **terminali kapatıp yeniden açın**
2. PATH güncellenmesi için gerekli

### 4. Doğrulama

Terminalde şu komutu çalıştırın:
```powershell
where link.exe
```

Eğer bir path görürseniz (örn: `C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\...`) kurulum başarılıdır.

### 5. Tauri'yi Test Et

```bash
npm run tauri:dev
```

Artık `link.exe` hatası almamalısınız ve desktop uygulaması açılmalı.

---

## Alternatif: Visual Studio Community

Eğer tam Visual Studio kurmak isterseniz:

1. [Visual Studio Community 2022](https://visualstudio.microsoft.com/vs/community/) indirin
2. Kurulumda **"Desktop development with C++"** workload'unu seçin
3. Aynı şekilde çalışır, sadece daha büyük bir kurulum

---

## Sorun Giderme

### Hala `link.exe` hatası alıyorsanız:

1. Terminali tamamen kapatıp yeniden açın
2. PATH'i kontrol edin:
   ```powershell
   $env:Path -split ';' | Select-String "Visual Studio"
   ```
3. Eğer görünmüyorsa, manuel ekleyin:
   ```powershell
   # Visual Studio Build Tools path'ini bulun (genellikle):
   # C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\[version]\bin\Hostx64\x64
   ```

### Kurulum çok uzun sürüyorsa:

- İnternet bağlantınızı kontrol edin
- İlk kurulum 2-5 GB indirebilir
- Normal süre: 10-30 dakika (bağlantı hızına göre)


