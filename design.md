# AKREP Asistan — Mobil Arayüz Tasarım Planı

**Yazar:** Manus AI  
**Hedef platform:** Android 14 öncelikli; mobil portre kullanım (9:16)  
**Marka imzası:** Geliştirici: Nebi Özkan | Marka: AKREP

## Tasarım yaklaşımı

AKREP Asistan, tek elle kullanılabilen, koyu uzay atmosferine sahip ve ana eylemi başparmak erişim alanında tutan bir mobil asistan olarak tasarlanacaktır. Arayüz; derin lacivert-siyah zemin, neon yeşil ana eylem, güneş sarısı durum vurguları ve kontrollü kırmızı uyarılar kullanacaktır. Keskin köşeler yerine geniş oval yüzeyler, yumuşak ışık halkaları ve akıcı durum geçişleri tercih edilecektir. Bilim-kurgu görünümü korunurken metin okunabilirliği, dokunma alanları ve erişilebilirlik öncelikli olacaktır.

## Ekran listesi

| Ekran | Birincil içerik ve işlev | Yerleşim |
|---|---|---|
| Açılış | AKREP amblemi, uygulama adı ve geliştirici imzası | Ortada logo; alt bölgede marka imzası; koyu uzay gradyanı |
| Ana Asistan | Yapay zekâ sureti, durum metni, konuşma altyazıları, ses dalgası, mikrofon, izinler, ayarlar ve mini görünüm kontrolleri | Üstte marka; üst-ortada avatar; merkezde konuşma alanı; alt başparmak bölgesinde büyük mikrofon ve yardımcı düğmeler |
| İzin Merkezi | Mikrofon, kamera, kişiler, arama, bildirim, dosya, ekran üstü gösterim ve erişilebilirlik durumları | İzinleri gruplandıran oval kartlar; her kartta durum ve sistem ayarına yönlendiren eylem |
| Ayarlar | TTS ses profili, konuşma hızı/perdesi, uyandırma sözcüğü, gizlilik, sağlayıcı seçimi ve model yönetimi | Bölümlere ayrılmış kaydırılabilir liste; önemli eylemler ekranın alt yarısında |
| Yerel Model | Qwen model durumu, depolama gereksinimi, indirme ilerlemesi, doğrulama ve silme | Büyük oval indirme düğmesi, ilerleme göstergesi ve çevrimdışı kullanım açıklaması |
| Avatar Stüdyosu | Hazır akrep/robot/bilim-kurgu/hayvan avatarları; saç, yüz ve giysi seçenekleri | Üstte canlı önizleme; altta yatay seçenek şeritleri ve kategori sekmeleri |
| Komut Kataloğu | Desteklenen komut kategorileri, örnekler ve arama | Kategori kartları, filtre ve FlatList tabanlı komut listesi |
| Mini Asistan | Küçük avatar, canlı altyazı, dinleme ve kapatma kontrolleri | Ekran üstü gösterim için kompakt oval panel; erişilebilir sürükleme alanı |
| Gizlilik ve Güvenlik | Yerel işleme açıklaması, API anahtarı saklama durumu, izin gerekçeleri | Açık metinli kartlar ve güvenli depolama tercihleri |

## Temel kullanıcı akışları

| Akış | Adımlar |
|---|---|
| Bas-konuş | Kullanıcı mikrofon düğmesine basılı tutar → uygulama tek bir kayıt oturumu başlatır → ses dalgası canlı hareket eder → kullanıcı parmağını kaldırır veya sessizlik algılanır → kayıt durur → metin görünür → komut/sohbet işlenir → yanıt altyazı ve TTS ile sunulur |
| İzin hazırlığı | Kullanıcı İzinler düğmesine dokunur → eksik izinler öncelikli görünür → ilgili karttaki eyleme dokunur → Android sistem ekranı açılır → uygulamaya dönünce durum yeniden denetlenir |
| Yerel model kurulumu | Kullanıcı Ayarlar → Yerel Model bölümünü açar → model boyutu ve bağlantı gereksinimini görür → İndir düğmesine dokunur → ilerlemeyi takip eder → dosya özeti doğrulanır → model kullanıma hazır olarak işaretlenir |
| Cihaz komutu | Kullanıcı “Baba’yı ara” der → metin ayrıştırılır → kişi eşleşmesi bulunur → riskli eylem için kullanıcı onayı alınır → Android arama ekranı açılır veya izin varsa eylem yürütülür → sonuç sesli bildirilir |
| Mini görünüm | Kullanıcı ana ekrandaki mini görünüm düğmesine dokunur → ekran üstü izni denetlenir → kompakt panel açılır → konuşma altyazıları panelde sürer → kullanıcı kapatma kontrolüyle ana uygulamaya döner |
| Sağlayıcı seçimi | Kullanıcı Ayarlar → Yapay zekâ motoru bölümüne gider → Yerel Qwen, Gemini veya OpenAI seçer → bulut sağlayıcısı seçilirse anahtar güvenli saklama alanına kaydedilir → gizlilik durumu ekranda gösterilir |

## Renk seçimleri

| Rol | Renk | Kullanım |
|---|---|---|
| Uzay zemini | `#030806` | Ana arka plan ve OLED uyumlu koyu yüzey |
| Yükseltilmiş yüzey | `#0B1712` | Kartlar ve ayar panelleri |
| Neon yeşil | `#37F58A` | Mikrofon, aktif dinleme, başarı ve odak |
| Güneş sarısı | `#FFD34E` | Model, enerji, önemli durum ve avatar çekirdeği |
| Akrep kırmızısı | `#FF4D4F` | Kritik izinler, hata ve uyarı |
| Soğuk beyaz | `#F2FFF7` | Birincil metin |
| Sis yeşili | `#93B8A2` | İkincil metin ve pasif durum |
| Sınır/halka | `#1D3D2D` | Oval kart sınırları ve ışık halkaları |

## Hareket ve geri bildirim

Dinleme durumunda avatarın merkez ışığı nefes alır gibi büyüyüp küçülecek, ses dalgası ise tek kayıt oturumundan gelen seviye verisiyle akacaktır. Konuşma sırasında avatarın alt çekirdeği kısa ve yumuşak ritimlerle hareket edecektir. Dokunma geri bildirimi 80–250 ms aralığında tutulacak; büyük mikrofon düğmesi hafif ölçeklenme ve sınırlı titreşim kullanacaktır. Hareket azaltma tercihi etkinse sürekli animasyonlar sabit durum göstergelerine dönüşecektir.

## Kullanılabilirlik ve erişilebilirlik

Ana eylemler alt üçte birlik alanda konumlandırılacak ve en az 48 × 48 dp dokunma alanı sağlayacaktır. Renk tek başına durum göstergesi olmayacak; simge ve metin birlikte kullanılacaktır. Canlı altyazılar yüksek kontrastlı, ölçeklenebilir ve en fazla üç satır olacak; uzun konuşmalar ayrı geçmiş görünümünde sunulacaktır. Riskli eylemler — arama, SMS, dosya silme ve erişilebilirlik üzerinden dokunma — açık kullanıcı onayı gerektirecektir.

## Teknik tasarım sınırları

Expo Go, ekran üstü pencere, erişilebilirlik servisi, sürekli uyandırma sözcüğü ve yerel GGUF çıkarımı gibi özel Android yeteneklerini doğrudan çalıştırmaz. Bu özellikler Expo geliştirme derlemesi ve yapılandırma eklentileriyle hazırlanacak; özel yerel modül gerektiren kısımlar açık arayüzler ve güvenli geri dönüşlerle ayrıştırılacaktır. Android’in güvenlik kısıtlamaları nedeniyle bazı sistem anahtarları doğrudan değiştirilemez; kullanıcı uygun sistem ayarı ekranına yönlendirilecektir.
