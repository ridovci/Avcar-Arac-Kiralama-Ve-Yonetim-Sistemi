import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar-account',
  templateUrl: './sidebar-account.component.html',
  styleUrl: './sidebar-account.component.css'
})
export class SidebarAccountComponent {
  isSidebarVisible = false;  // Sidebar'ın görünürlük durumu
  screenWidth: number;       // Ekran genişliğini tutan değişken

  constructor(private authService: AuthService, public router: Router) {
      // Uygulama ilk yüklendiğinde ekran genişliğini alır ve sidebar görünürlüğünü günceller
      this.screenWidth = window.innerWidth;
      this.updateSidebarVisibility();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
      // Pencere yeniden boyutlandırıldığında ekran genişliğini günceller ve sidebar görünürlüğünü kontrol eder
      this.screenWidth = window.innerWidth;
      this.updateSidebarVisibility();
  }

  toggleSidebar() {
      // Menü butonu ile sidebar'ı açıp kapatmayı sağlar
      this.isSidebarVisible = !this.isSidebarVisible;
  }

  updateSidebarVisibility() {
      // Ekran genişliğine göre sidebar'ın görünürlüğünü otomatik olarak ayarlar
      this.isSidebarVisible = this.screenWidth >= 1400;
  }

  logout(): void {
    // Kullanıcı çıkış işlemi ve bildirim gösterimi
    Swal.fire({
      title: 'Çıkış Yap',
      text: 'Başarıyla çıkış yaptınız. Ana sayfaya yönlendiriliyorsunuz.',
      icon: 'success',
      showConfirmButton: false,
      timer: 2000,
      willClose: () => {
        this.authService.logout();  // Çıkış işlemi gerçekleştiriliyor
      }
    });
  }

  showError(message: string) {
    // Hata mesajı göstermek için kullanılan fonksiyon
    Swal.fire({
      icon: 'error',
      title: 'Hata!',
      html: message,
      confirmButtonText: 'Tamam'
    });
  }

  isAdminPage() {
    // Mevcut rotanın yönetici bölümü olup olmadığını kontrol eder
    return this.router.url.includes('/admin');
  }

  isAccountPage() {
    // Mevcut rotanın hesap sayfası olup olmadığını kontrol eder
    return this.router.url.includes('/account');
  }

  handleMenuItemClick() {
    // Ekran genişliği 1400 pikselden küçükse sidebar'ı gizler
    if (this.screenWidth < 1400) {
      this.isSidebarVisible = false;
    }
  }
}
