import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service'; // AuthService dosyasını uygun şekilde içe aktarın
import { GlobalStateService } from '../../../services/globalstate.service'; // GlobalStateService dosyasını uygun şekilde içe aktarın

@Component({
  selector: 'app-header', // Bu bileşenin HTML etiket adı
  templateUrl: './header.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrls: ['./header.component.css'] // Bileşen için kullanılan stil dosyasının yolu
})
export class HeaderComponent implements OnInit {

  // AuthService ve GlobalStateService bağımlılıklarını enjekte ediyoruz
  constructor(private authService: AuthService, private globalStateService: GlobalStateService) {}

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {}

  // Kullanıcının giriş yapıp yapmadığını kontrol eder
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Kullanıcının admin olup olmadığını kontrol eder
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Kullanıcının süper admin olup olmadığını kontrol eder
  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  // Kullanıcının standart kullanıcı olup olmadığını kontrol eder
  isUser(): boolean {
    return this.authService.isUser();
  }

  // Menü açma işlemini tetikler
  openMenu() {
    this.globalStateService.toggleMenu();
  }
  
}
