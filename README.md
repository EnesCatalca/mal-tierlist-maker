# MAL Tierlist Maker

MyAnimeList profilinden otomatik olarak anime tierlist'i oluşturan bir web uygulaması. Tamamlanmış animelerini puanlarına göre otomatik tier'lara yerleştirir; sürükle-bırak ile düzenleyip PNG olarak dışa aktarabilirsin.

## Özellikler

- **XML içe aktarma** — MAL'ın resmî "Export Anime List" dosyasını yükleyerek listeyi al (önerilen yöntem, giriş gerektirmez)
- **Kullanıcı adıyla yükleme** — herkese açık MAL profillerini kullanıcı adı veya profil URL'si ile çek
- **Otomatik tierlist** — 10 → S, 9 → A, 8 → B, 7 → C, 6 → D, 1–5 → F; puansızlar ayrı satırda
- **Özel tierlist** — kendi tier adlarını ve renklerini tanımla, animeleri havuzdan elle yerleştir
- **Sürükle-bırak** — kartları tier'lar arasında taşı, aynı tier içinde sırala
- **PNG dışa aktarma** — tierlist'i tek tıkla görüntü olarak indir
- **Kapak görselleri** — AniList GraphQL API'sinden toplu, eksikler için Jikan API'sinden tek tek çekilir
- **Karanlık / aydınlık tema** ve **otomatik kayıt** (localStorage)

## Kullanılan Teknolojiler

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [dnd-kit](https://dndkit.com/) — sürükle-bırak
- [html2canvas](https://html2canvas.hertzen.com/) — PNG dışa aktarma
- [Electron](https://www.electronjs.org/) — masaüstü paketi (opsiyonel)

## Kurulum

```bash
npm install
npm run dev
```

Geliştirme sunucusu, MAL isteklerini CORS engeline takılmadan iletmek için `/api/mal` altında bir proxy çalıştırır (bkz. `vite.config.js`).

## Derleme

| Komut | Açıklama |
| --- | --- |
| `npm run build` | Standart web derlemesi (`dist/`) |
| `npm run build:standalone` | Tek HTML dosyalık sürüm (`dist-standalone/`) — sunucu gerektirmez, yalnızca XML yükleme çalışır |
| `npm run electron` | Derleyip Electron ile çalıştırır |
| `npm run package` | Windows için taşınabilir Electron paketi üretir (`release/`) |

## Nasıl Çalışır?

1. **XML yolu:** MAL → Profil → *Export Data* → "Export Anime List" ile indirilen XML dosyası tarayıcıda ayrıştırılır; yalnızca *Completed* durumundaki animeler alınır.
2. **Kullanıcı adı yolu:** Liste, MAL'ın `load.json` uç noktasından sayfalanarak çekilir. Tarayıcıda CORS engelini aşmak için istekler geliştirme sunucusundaki (veya Electron içindeki yerel sunucudaki) proxy üzerinden geçer. Listenin MAL'da herkese açık olması gerekir.
3. Kapak görselleri önce AniList'ten 50'lik gruplar hâlinde, bulunamayanlar Jikan'dan tek tek çekilir; istekler API limitlerine uymak için bekleme süreleriyle sıralanır.

## Lisans

MIT
