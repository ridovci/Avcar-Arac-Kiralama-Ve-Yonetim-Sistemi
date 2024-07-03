import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin', // Bu bileşenin HTML etiket adı
  templateUrl: './admin.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrl: './admin.component.css', // Bileşen için kullanılan stil dosyasının yolu
})
export class AdminComponent {
  constructor(private authService: AuthService) {} // AuthService servisini enjekte et

  // Kullanıcıyı çıkış yapma fonksiyonu
  logout(): void {
    this.authService.logout(); // AuthService üzerinden çıkış yap
  }
}