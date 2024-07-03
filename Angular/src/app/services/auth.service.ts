import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class AuthService {
  private token: string | null = null; // JWT token'ı tutan değişken

  constructor() {
    // Servis oluşturulduğunda yerel depolamadan token'ı alır
    this.token = localStorage.getItem('Jwt_token');
  }

  // Kullanıcının giriş yapıp yapmadığını kontrol eden fonksiyon
  isLoggedIn(): boolean {
    return this.token !== null;
  }

  // Kullanıcının admin olup olmadığını kontrol eden fonksiyon
  isAdmin(): boolean {
    if (this.token) {
      // JWT token'ının payload kısmını çözümleyerek role bilgisine erişir
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.role === 'Admin';
    }
    return false;
  }
  
  // Kullanıcının super admin olup olmadığını kontrol eden fonksiyon
  isSuperAdmin(): boolean {
    if (this.token) {
      // JWT token'ının payload kısmını çözümleyerek role bilgisine erişir
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.role === 'Superadmin';
    }
    return false;
  }

  // Kullanıcının user rolünde olup olmadığını kontrol eden fonksiyon
  isUser(): boolean {
    if (this.token) {
      // JWT token'ının payload kısmını çözümleyerek role bilgisine erişir
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.role === 'User';
    }
    return false;
  }

  // Kullanıcı giriş işlemi ve token'ı yerel depolamaya kaydetme
  login(token: string): void {
    this.token = token;
    localStorage.setItem('Jwt_token', token);
  }

  // Kullanıcı çıkış işlemi ve token'ı yerel depolamadan kaldırma
  logout(): void {
    this.token = null;
    localStorage.removeItem('Jwt_token');
    window.location.href = "/"; // Kullanıcıyı ana sayfaya yönlendir
  }

  // Kullanıcının ID'sini JWT token'ından alan fonksiyon
  getUserId(): number | undefined {
    if (this.token) {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const id = payload.id;
      return id ? parseInt(id) : undefined; // 'id' değerini number tipine çevir
    }
    return undefined;
  }
}
