import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root' // Bu servis uygulama genelinde kullanılabilir hale getirilir
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  // Bu metod, bir route'un etkinleştirilip etkinleştirilemeyeceğini belirler
  canActivate(): boolean {
    // Kullanıcının rolü 'Admin' veya 'SuperAdmin' ise route'a erişim izni ver
    if (this.authService.isAdmin() || this.authService.isSuperAdmin()) {
      return true; // Route'a erişim izni verilir
    } else {
      // Kullanıcının rolü 'Admin' veya 'SuperAdmin' değilse giriş sayfasına yönlendir
      this.router.navigate(['/login']);
      return false; // Route'a erişim izni verilmez
    }
  }
}
