# Qwen2.5 Model Kaynakları

## Doğrulanan resmî kaynaklar

- Resmî GGUF model deposu: https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF
- Hugging Face model API’si: https://huggingface.co/api/models/Qwen/Qwen2.5-1.5B-Instruct-GGUF
- Qwen2.5 resmî duyurusu: https://qwenlm.github.io/blog/qwen2.5/

## Uygulamada seçilen model

AKREP Asistan’ın mobil yerel çıkarım hedefi için `Qwen/Qwen2.5-1.5B-Instruct-GGUF` deposundaki `qwen2.5-1.5b-instruct-q4_k_m.gguf` dosyası seçildi. İndirme adresi:

`https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true`

Resmî model API’si bu dosya adını yayımlanan kardeş dosyalar arasında listeler. Model kartı 1.54 milyar parametre, GGUF biçimi, Apache-2.0 lisansı ve q4_K_M dâhil çeşitli nicemleme seçenekleri bildirmektedir. Model kartı ayrıca llama.cpp ile yerel çalıştırmayı ve Q4_K_M seçimini resmî kullanım yollarından biri olarak göstermektedir.

Resmî Qwen2.5 duyurusu 1.5B boyutunu açık ağırlıklı model ailesinin parçası olarak listeler ve yapılandırılmış/JSON çıktı başarımındaki iyileştirmeleri vurgular. AKREP’in cihaz komutlarını katı JSON işlev çağrılarına dönüştürme yaklaşımı bu yetenekle uyumludur; yine de her çıktı uygulama tarafında Zod şemasıyla doğrulanmalı ve riskli eylemler kullanıcı onayından geçmelidir.

## React Native llama.cpp köprüsü

- llama.rn resmî deposu: https://github.com/mybigday/llama.rn
- Hugging Face uç cihaz çıkarım rehberi: https://huggingface.co/blog/llm-inference-on-edge

`llama.rn`, llama.cpp için React Native yerel bağlayıcısıdır. Resmî depo v0.10 ve sonrasında React Native Yeni Mimari gerektirdiğini, Expo CNG yapılandırması için kendi config eklentisini sağladığını ve GGUF model yükleme/çıkarımını desteklediğini belirtir. AKREP projesinde Yeni Mimari zaten etkin olduğu için `llama.rn` 0.12.6 bağımlılığı eklendi. Bu modül Expo Go içinde çalışmaz; uygulamanın Publish düğmesiyle üretilen yerel Android geliştirme/dağıtım derlemesinde çalışır.

Hugging Face rehberi 1–3B modelleri mobil cihazlar için uygun sınıf olarak tanımlar, Q4_K_M gibi K-quant seçeneklerini boyut/kalite dengesi açısından açıklar ve React Native cihaz üzerinde GGUF çıkarımı için `llama.rn` kullanımını gösterir.
