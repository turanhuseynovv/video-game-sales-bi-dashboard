# 🎮 Video Game Sales — BI Dashboard

İş zekası (BI) standartlarına uygun, interaktif video oyun satış analiz dashboard'u.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JavaScript-blue)
![Data](https://img.shields.io/badge/Records-16%2C598-orange)

## 📌 Proje Hakkında

Bu proje, Kaggle'dan alınan **"Video Game Sales"** veri seti üzerinde kapsamlı bir **İş Zekası (BI) Dashboard** oluşturmayı amaçlamaktadır. 16.598 oyun kaydı; platform, tür, bölge ve yayıncı bazlı stratejik görselleştirmelerle analiz edilmektedir.

## 🗂️ Veri Seti

- **Kaynak:** [Kaggle – Video Game Sales](https://www.kaggle.com/datasets/gregorut/videogamesales)
- **Dosya:** `vgsales.csv`
- **Kayıt Sayısı:** 16.598
- **Kapsam:** 1980–2020 yılları arası küresel oyun satışları
- **Alanlar:** Rank, Name, Platform, Year, Genre, Publisher, NA_Sales, EU_Sales, JP_Sales, Other_Sales, Global_Sales

> ⚠️ Satış verileri **adet (kopya)** bazındadır, dolar cinsinden gelir değildir.

## ✨ Özellikler

### 📊 Üç Sekmeli Analiz
| Sekme | İçerik |
|---|---|
| **Performans Özeti** | KPI kartları, satış trendi, tür/platform karşılaştırması, Top 20 tablosu |
| **Küresel Pazar Analizi** | Bölgesel pazar payı (donut), yığın çubuk grafiği, platform × bölge ısı haritası |
| **Rekabet ve Marka Analizi** | Top 15 yayıncı, yayıncı × tür ağaç haritası, detaylı veri tablosu |

### 🛠️ Teknik Özellikler
- **ETL İşlemi:** Papa Parse ile CSV ayrıştırma, eksik veri temizleme, tip dönüşümü
- **Dinamik Filtreler:** Yıl, platform, tür ve yayıncı bazlı çapraz filtreleme
- **YoY Analizi:** Yıldan yıla değişim hesaplaması (KPI kartlarında)
- **Otomatik İçgörüler:** Filtrelere göre dinamik metin tabanlı insight üretimi
- **Dışa Aktarım:** CSV, Excel (XLSX), PDF formatlarında veri indirme
- **Tema Desteği:** Karanlık / Aydınlık tema geçişi
- **Responsive Tasarım:** Masaüstü, tablet ve mobil uyumu

## 🧰 Kullanılan Teknolojiler

| Teknoloji | Kullanım |
|---|---|
| **HTML5** | Semantik yapı |
| **CSS3** | Tasarım sistemi, CSS Variables, responsive grid |
| **JavaScript (Vanilla)** | ETL, filtreleme, grafik yönetimi, veri dışa aktarım |
| **Chart.js 4.4** | Çizgi, çubuk, donut, yığın çubuk grafikleri |
| **Papa Parse 5.4** | CSV ayrıştırma (ETL Extract aşaması) |
| **SheetJS (XLSX)** | Excel dosyası oluşturma |
| **jsPDF + AutoTable** | PDF rapor oluşturma |
| **Google Fonts (Inter)** | Modern tipografi |

## 🚀 Kurulum

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/<kullanici-adi>/video-game-sales-bi-dashboard.git
   ```

2. Proje dizinine gidin:
   ```bash
   cd video-game-sales-bi-dashboard
   ```

3. `index.html` dosyasını bir web tarayıcıda açın veya yerel bir sunucu başlatın:
   ```bash
   # Python ile
   python -m http.server 8000
   
   # Node.js ile
   npx serve .
   ```

4. Tarayıcıda `http://localhost:8000` adresine gidin.

> 📝 CSV dosyası `fetch()` ile yüklendiği için dosyayı doğrudan açmak yerine bir HTTP sunucu kullanmanız gerekmektedir.

## 📁 Proje Yapısı

```
├── index.html       # Ana HTML yapısı (351 satır)
├── styles.css       # Tasarım sistemi ve responsive CSS (1009 satır)
├── app.js           # ETL, filtreler, grafikler, tablo, dışa aktarım (998 satır)
├── vgsales.csv      # Kaggle veri seti (16.598 kayıt)
├── .gitignore       # Git dışlama kuralları
└── README.md        # Bu dosya
```

## 📸 Ekran Görüntüleri

> Dashboard'un çalışan halini görmek için projeyi yerel sunucuda çalıştırın.

## 📄 Lisans

Bu proje eğitim amaçlıdır. Veri seti [Kaggle Video Game Sales](https://www.kaggle.com/datasets/gregorut/videogamesales) kaynağından alınmıştır.

## 🙏 Teşekkürler

- [Kaggle](https://www.kaggle.com/) — Veri seti
- [Chart.js](https://www.chartjs.org/) — Grafik kütüphanesi
- [Papa Parse](https://www.papaparse.com/) — CSV ayrıştırıcı
