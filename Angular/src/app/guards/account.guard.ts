import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root' // Bu servis uygulama genelinde kullanılabilir hale getirilir
})
export class AccountGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  // Bu metod, bir route'un etkinleştirilip etkinleştirilemeyeceğini belirler
  canActivate(): boolean {
    // Kullanıcının rolü 'User' ise route'a erişim izni ver
    if (this.authService.isUser()) {
      return true; // Route'a erişim izni verilir
    } else {
      // Kullanıcının rolü 'User' değilse giriş sayfasına yönlendir
      this.router.navigate(['/login']);
      return false; // Route'a erişim izni verilmez
    }
  }
}
