/// <reference types="@angular/localize" />

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'; // Angular uygulamasını tarayıcıda çalıştırmak için gerekli modül
import { AppModule } from './app/app.module'; // Ana uygulama modülü

// Angular uygulamasını başlat
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err)); // Hata oluşursa konsola yazdır
