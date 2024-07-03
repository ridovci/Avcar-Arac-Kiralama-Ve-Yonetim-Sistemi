import { Component } from '@angular/core';
import { AccountService } from '../../services/account.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { enc, SHA256 } from 'crypto-js';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register', // Bu bileşenin HTML etiket adı
  templateUrl: './register.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrls: ['./register.component.css'] // Bileşen için kullanılan stil dosyasının yolu
})
export class RegisterComponent {
  alertMessage: string = ''; // Uyarı mesajını tutan değişken
  alertType: 'success' | 'error' = 'success'; // Uyarı mesajının türünü tutan değişken
  tcNumber: string = ''; // TC kimlik numarasını tutan değişken
  mobilePhone: string = ''; // Cep telefonu numarasını tutan değişken

  constructor(
    private accountService: AccountService, // Hesap servisini enjekte et
    private router: Router, // Router servisini enjekte et
    private toastr: ToastrService // Toastr servisini enjekte et
  ) { }

  // TC kimlik numarası girişi işlemi
  onTcNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/\D/g, ''); // Sadece sayısal değerleri al
    this.tcNumber = numericValue;
    input.value = numericValue;
  }

  // Cep telefonu numarası girişi işlemi
  onMobilePhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/\D/g, ''); // Sadece sayısal değerleri al
    this.mobilePhone = numericValue;
    input.value = numericValue;
  }

  // Kayıt işlemi
  register(frm: NgForm) {
    let errorMessage = ''; // Hata mesajını tutan değişken
    const today = new Date();
    const dateOfBirth = new Date(frm.value.dateOfBirth);
    const driverLicenseIssueDate = new Date(frm.value.driverLicenseIssueDate);

    // Form validasyonları
    if (!frm.value.firstName) {
      errorMessage += 'İsim yazınız.<br>';
    }
    if (!frm.value.lastName) {
      errorMessage += 'Soy isim yazınız.<br>';
    }
    if (frm.value.tcNumber.length !== 11) {
      errorMessage += 'TC Kimlik numarası 11 karakter olmalıdır.<br>';
    }
    if (!frm.value.email) {
      errorMessage += 'E-mail yazınız.<br>';
    }
    if (frm.value.password.length < 6) {
      errorMessage += 'Şifre en az 6 karakter olmalıdır.<br>';
    }
    if (frm.value.password !== frm.value.passwordRepeat) {
      errorMessage += 'Şifreler eşleşmiyor.<br>';
    }
    if (!frm.value.genderCode) {
      errorMessage += 'Cinsiyet seçiniz.<br>';
    }
    if (!frm.value.dateOfBirth) {
      errorMessage += 'Doğum tarihi giriniz.<br>';
    }
    if (dateOfBirth >= today) {
      errorMessage += 'Doğum tarihi bugünden önce olmalıdır.<br>';
    }
    if (frm.value.mobilePhone.length !== 10) {
      errorMessage += 'Cep telefonu numarası 10 karakter olmalıdır.<br>';
    }
    if (!frm.value.driverLicenseClass) {
      errorMessage += 'Ehliyet sınıfı giriniz.<br>';
    }
    if (!frm.value.driverLicenseNumber) {
      errorMessage += 'Ehliyet seri numarası giriniz.<br>';
    }
    if (!frm.value.driverLicenseIssueDate) {
      errorMessage += 'Ehliyet veriliş tarihi giriniz.<br>';
    }
    if (driverLicenseIssueDate >= today) {
      errorMessage += 'Ehliyet veriliş tarihi bugünden önce olmalıdır.<br>';
    }
    if (!frm.value.membershipAgreement) {
      errorMessage += 'Üyelik sözleşmesini kabul etmelisiniz.<br>';
    }

    // Hata mesajı varsa, hatayı göster ve işlemi durdur
    if (errorMessage !== '') {
      this.showError(errorMessage);
      return;
    }

    // Şifreyi SHA256 ile hash'le ve Base64'e dönüştür
    const hash = SHA256(frm.value.password);
    const base64Hash = hash.toString(enc.Base64);
    let defaultRoleId = 1;

    // Kayıt servisini çağır
    this.accountService.register(
      frm.value.email,
      base64Hash,
      String(frm.value.tcNumber),
      frm.value.mobilePhone,
      frm.value.mobilePhoneBackup,
      frm.value.firstName,
      frm.value.lastName,
      frm.value.genderCode,
      frm.value.dateOfBirth,
      frm.value.driverLicenseIssueDate,
      frm.value.driverLicenseClass,
      frm.value.driverLicenseNumber,
      defaultRoleId
    ).subscribe(
      (data) => {
        // Kayıt başarılı olduğunda bildirim göster ve giriş sayfasına yönlendir
        Swal.fire({
          title: 'Başarılı!',
          text: 'Başarıyla üye oldunuz. Giriş sayfasına yönlendiriliyorsunuz.',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          willClose: () => {
            this.router.navigateByUrl('/login');
          }
        });
      },
      (error: HttpErrorResponse) => {
        // Hata durumunda hata mesajını göster
        let errorMessage = 'Üye kaydı yapılamadı.';
        if (error.status === 400) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.errors) {
            const validationErrors = error.error.errors;
            const errorMessages = [];

            for (const key in validationErrors) {
              if (validationErrors.hasOwnProperty(key)) {
                errorMessages.push(validationErrors[key].join(' '));
              }
            }
            errorMessage = errorMessages.join('<br>');
          }
        }
        this.showError(errorMessage);
      }
    );
  }

  // Hata mesajını gösteren fonksiyon
  showError(message: string) {
    this.toastr.error(message, 'Hata!', { progressBar: true, enableHtml: true });
  }
}
