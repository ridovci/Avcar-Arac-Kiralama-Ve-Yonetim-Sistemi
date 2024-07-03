import { Component, ElementRef, HostBinding, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { GlobalStateService } from './services/globalstate.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root', // Bu bileşenin HTML etiket adı
  templateUrl: './app.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrl: './app.component.css' // Bileşen için kullanılan stil dosyasının yolu
})
export class AppComponent implements OnInit {
  isMenuOpen!: Observable<boolean>; // Menü açık/kapalı durumunu gözlemleyen observable

  constructor(
    private renderer: Renderer2, // DOM manipülasyonu için Renderer2 servisini enjekte et
    private router: Router, // Router servisini enjekte et
    private globalStateService: GlobalStateService, // Global durum servisini enjekte et
    private authService: AuthService // Kimlik doğrulama servisini enjekte et
  ) {}

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit() {
    this.isMenuOpen = this.globalStateService.menuOpen$; // Menü açık/kapalı durumunu al

    // Router olaylarını gözlemle
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Navigasyon sonunda body stilini güncelle
        this.updateBodyStyle(event.urlAfterRedirects);
      }
    });
  }

  // URL'ye göre body stilini güncelleyen fonksiyon
  updateBodyStyle(url: string) {
    const body = this.renderer.selectRootElement('body', true); // Body elemanını seç
    if (url.includes('/admin') || url.includes('/account')) {
      this.renderer.setStyle(body, 'background-color', '#050B20'); // Admin veya hesap sayfası için arka plan rengini koyu yap
    } else {
      this.renderer.setStyle(body, 'background-color', '#FFFFFF'); // Diğer sayfalar için arka plan rengini beyaz yap
    }
  }

  // Menü kapatma işlemini gerçekleştiren fonksiyon
  closeMenu() {
    this.globalStateService.closeMenu();
  }

  // Overlay tıklama işlemini ele alan fonksiyon
  onOverlayClick(event: MouseEvent) {
    if (this.isMenuOpen) {
      this.closeMenu(); // Menü açıksa kapat
    }
  }

  // Kullanıcının giriş yapıp yapmadığını kontrol eden fonksiyon
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Kullanıcının admin olup olmadığını kontrol eden fonksiyon
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Kullanıcının süper admin olup olmadığını kontrol eden fonksiyon
  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  // Kullanıcının standart kullanıcı olup olmadığını kontrol eden fonksiyon
  isUser(): boolean {
    return this.authService.isUser();
  }
}
