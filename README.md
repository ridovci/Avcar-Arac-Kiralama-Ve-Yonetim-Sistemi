
![Animation](https://github.com/user-attachments/assets/8e692efc-461a-4b9a-a62d-db4d44a5d20d)


# AvciCarRental

AvciCarRental, modern yazılım geliştirme teknolojilerinin gücünü kullanarak, kullanıcı dostu ve verimli bir araç kiralama deneyimi sunan bir platformdur. Bu proje, ASP.NET Core ve Angular teknolojileri ile geliştirilmiş olup, araç kiralama işlemlerinin dijitalleşmesini ve optimize edilmesini sağlar. AvciCarRental, kullanıcıların ihtiyaçlarına hızlı ve güvenli bir şekilde yanıt verirken, yöneticilerin araç filolarını etkin bir şekilde yönetmelerine olanak tanır.

## Projenin Amacı ve Kapsamı

AvciCarRental, araç kiralama süreçlerini daha kolay, daha hızlı ve daha güvenli hale getirmeyi amaçlamaktadır. Platform, hem kullanıcıların hem de yöneticilerin ihtiyaçlarını karşılayacak şekilde tasarlanmıştır. Kullanıcılar, istedikleri araçları rahatça arayabilir, filtreleyebilir ve kiralama işlemlerini çevrimiçi olarak tamamlayabilirler. Aynı zamanda, yöneticiler araç filolarını, kiralama geçmişlerini ve ek hizmetleri etkili bir şekilde yönetebilirler.

## Teknik Altyapı

AvciCarRental, iki ana teknoloji üzerine inşa edilmiştir:

1. **Backend**: ASP.NET Core kullanılarak geliştirilmiş olup, güçlü ve ölçeklenebilir bir API sağlar. Bu API, kullanıcı doğrulama, araç yönetimi, rezervasyon işlemleri gibi temel işlevleri destekler.
2. **Frontend**: Angular framework'ü ile geliştirilmiş kullanıcı arayüzü, dinamik ve kullanıcı dostu bir deneyim sunar. Modern web standartlarına uygun olarak geliştirilmiş bu arayüz, tüm cihazlarda sorunsuz çalışır.

## Öne Çıkan Özellikler

- **Kullanıcı Yönetimi**: Kullanıcı kayıt ve giriş işlemleri, profil yönetimi.
- **Araç Yönetimi**: Yöneticiler için araç ekleme, güncelleme ve silme işlemleri.
- **Gelişmiş Arama ve Filtreleme**: Kullanıcıların ihtiyaçlarına uygun araçları hızlıca bulabilmesi için detaylı arama ve filtreleme seçenekleri.
- **Kiralama ve Rezervasyon**: Güvenli ve hızlı kiralama ve rezervasyon işlemleri.
- **Ek Hizmetler**: Sigorta, GPS, çocuk koltuğu gibi ek hizmetlerin yönetimi.
- **Kiralama Geçmişi**: Kullanıcıların ve yöneticilerin geçmiş kiralamaları görüntüleyebilmesi.
- **Yönetici Paneli**: Araç filolarının ve rezervasyonların merkezi olarak yönetimi.

Bu özellikler, kullanıcıların ve yöneticilerin ihtiyaçlarını karşılamak ve araç kiralama süreçlerini daha verimli hale getirmek amacıyla geliştirilmiştir.

## Gereksinimler

Bu projeyi çalıştırmak için aşağıdaki yazılım ve araçların sisteminizde kurulu olması gerekmektedir:

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js ve NPM](https://nodejs.org/)
- [Angular CLI](https://cli.angular.io/)

## Kurulum

### Backend Kurulumu

1. Bu depoyu yerel makinenize klonlayın:
    ```bash
    git clone https://github.com/ridovci/DevWorks.git
    ```

2. Proje dizinine gidin:
    ```bash
    cd AvciCarRental/ASP.NET Core/AvciCarRental
    ```

3. Gerekli bağımlılıkları yükleyin:
    ```bash
    dotnet restore
    ```

4. `appsettings.json` dosyasını açarak veritabanı bağlantı dizgisini kendi veritabanınıza göre güncelleyin.

5. Veritabanı migrasyonlarını uygulayın:
    ```bash
    dotnet ef database update
    ```

6. Uygulamayı çalıştırın:
    ```bash
    dotnet run
    ```

### Frontend Kurulumu

1. Angular proje dizinine gidin:
    ```bash
    cd Angular/AvciCarRental
    ```

2. Gerekli bağımlılıkları yükleyin:
    ```bash
    npm install
    ```

3. Uygulamayı geliştirme sunucusunda çalıştırın:
    ```bash
    ng serve
    ```

4. Tarayıcınızda `http://localhost:4200` adresine gidin.

## Kullanım

- Uygulamayı çalıştırdıktan sonra, kullanıcı olarak kayıt olabilir ve giriş yapabilirsiniz.
- Yönetici olarak giriş yaptığınızda, araç ekleme, güncelleme ve silme işlemlerini gerçekleştirebilirsiniz.
- Kullanıcı olarak araç arayabilir, kiralama işlemlerini yapabilir ve geçmiş kiralamalarınızı görüntüleyebilirsiniz.

## İletişim

Sorularınız veya geri bildirimleriniz için lütfen benimle iletişime geçin:

- [LinkedIn Profilim](https://www.linkedin.com/in/ridvanavci)
