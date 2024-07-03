import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { enc, SHA256 } from 'crypto-js';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login', // Bu bileşenin HTML etiket adı
  templateUrl: './login.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrls: ['./login.component.css'] // Bileşen için kullanılan stil dosyasının yolu
})
export class LoginComponent implements OnInit {
  alertMessage: string = ''; // Uyarı mesajını tutan değişken
  alertType: 'success' | 'error' = 'success'; // Uyarı mesajının türünü tutan değişken

  constructor(
    private accountService: AccountService, // Hesap servisini enjekte et
    private router: Router, // Router servisini enjekte et
    private toastr: ToastrService, // Toastr servisini enjekte et
    private authService: AuthService // Kimlik doğrulama servisini enjekte et
  ) {}

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    if (this.authService.isAdmin() || this.authService.isSuperAdmin()) {
      this.router.navigateByUrl("/admin"); // Eğer kullanıcı admin veya süper admin ise admin sayfasına yönlendir
    }
    if (this.authService.isUser()) {
      this.router.navigateByUrl("/account"); // Eğer kullanıcı normal kullanıcı ise hesap sayfasına yönlendir
    }
  }

  // Giriş işlemi
  login(frm: NgForm) {
    // Email ve şifre kontrolü
    if (!frm.value.email || !frm.value.password) {
      if (!frm.value.password) {
        this.showError('Şifre boş geçilemez.'); // Şifre boşsa hata mesajı göster
      }
      if (!frm.value.email) {
        this.showError('Kullanıcı boş geçilemez.'); // Email boşsa hata mesajı göster
      }
      return;
    }
    const hash = SHA256(frm.value.password); // Şifreyi SHA256 ile hash'le
    const base64Hash = hash.toString(enc.Base64); // Hash'lenmiş şifreyi Base64'e dönüştür

    // Giriş servisini çağır
    this.accountService.login(frm.value.email, base64Hash).subscribe(
      (data) => {
        localStorage.setItem('Jwt_token', data.token); // JWT token'ı yerel depolamaya kaydet
        Swal.fire({
          title: 'Başarılı!',
          text: 'Başarıyla giriş yaptınız. Ana sayfaya yönlendiriliyorsunuz.',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          willClose: () => {
            window.location.href = "/"; // Giriş başarılı olduğunda ana sayfaya yönlendir
          }
        });
      },
      (error: HttpErrorResponse) => {
        let errorMessage = 'Sunucuya erişim sağlanamadı.';
        if (error.status !== 0) {
          errorMessage = error.error instanceof ErrorEvent ? `Bir hata oluştu: ${error.error.message}` : `${error.error}`;
        }
        this.showError(errorMessage); // Hata durumunda hata mesajını göster
      }
    );
  }

  // Hata mesajını gösteren fonksiyon
  showError(message: string) {
    this.toastr.error(message, 'Hata!', { progressBar: true, enableHtml: true });
  }
}
