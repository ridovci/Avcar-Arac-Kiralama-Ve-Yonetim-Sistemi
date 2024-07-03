import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeModule } from './modules/home/home.module';
import { RegisterModule } from './modules/register/register.module';
import { CarsModule } from './modules/cars/cars.module';
import { NotFoundModule } from './modules/not-found/not-found.module';
import { AccountModule } from './modules/account/account.module';
import { AdminModule } from './modules/admin/admin.module'; 
import { AdminGuard } from './guards/admin.guard';
import { AccountGuard } from './guards/account.guard';
import { SharedModule } from './modules/shared/shared.module';
import { LoginModule } from './modules/login/login.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { AdminRoutingModule } from './modules/admin/admin-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { DatePipe, DecimalPipe, registerLocaleData } from '@angular/common';
import { AuthInterceptor } from './services/auth.interceptor';
import localeTr from '@angular/common/locales/tr';

registerLocaleData(localeTr, 'tr'); // Türkçe yerel ayarlarını kaydet

@NgModule({
  declarations: [
    AppComponent // Ana bileşeni tanımlayın
  ],
  imports: [
    BrowserModule, // Tarayıcı modülü
    AppRoutingModule, // Uygulama yönlendirme modülü
    HomeModule, // Ana sayfa modülü
    RegisterModule, // Kayıt modülü
    LoginModule, // Giriş modülü
    CarsModule, // Araçlar modülü
    AccountModule, // Hesap modülü
    SharedModule, // Paylaşılan modül
    FormsModule, // Formlar modülü
    HttpClientModule, // HTTP istemci modülü
    AdminRoutingModule, // Yönetici yönlendirme modülü
    BrowserAnimationsModule, // Tarayıcı animasyon modülü
    ReactiveFormsModule, // Reaktif formlar modülü
    SweetAlert2Module.forRoot(), // SweetAlert2 modülünü kök düzeyde yapılandırın
    ToastrModule.forRoot({
      preventDuplicates: true // Çift bildirimleri engelle
    }) 
  ],
  providers: [
    AccountGuard, // Hesap koruması
    AdminGuard, // Yönetici koruması
    DatePipe, // Tarih boru hattı
    DecimalPipe, // Ondalık boru hattı
    { provide: LOCALE_ID, useValue: 'tr' }, // Uygulamanın yerel ayarını Türkçe olarak belirleyin
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // HTTP isteklerini kesen interceptor
  ],
  bootstrap: [AppComponent] // Ana bileşeni başlat
})
export class AppModule { }
