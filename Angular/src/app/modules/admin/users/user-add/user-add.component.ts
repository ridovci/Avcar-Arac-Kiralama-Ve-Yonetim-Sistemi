import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse sınıfını içe aktarır
import { Component, OnInit } from '@angular/core'; // Angular bileşen ve OnInit arayüzünü içe aktarır
import { NgForm } from '@angular/forms'; // Angular formlarını içe aktarır
import { Router } from '@angular/router'; // Angular yönlendirme modüllerini içe aktarır
import { SHA256, enc } from 'crypto-js'; // SHA256 ve enc şifreleme kütüphanelerini içe aktarır
import { ToastrService } from 'ngx-toastr'; // Toastr bildirim servisini içe aktarır
import { User } from '../../../../models/user.model'; // Kullanıcı modelini içe aktarır
import { AccountService } from '../../../../services/account.service'; // AccountService servisini içe aktarır

@Component({
  selector: 'app-user-add',
  templateUrl: './user-add.component.html',
  styleUrl: './user-add.component.css'
})
export class UserAddComponent implements OnInit { 

  roles: any[] | undefined; // Kullanıcı rolleri
  alertMessage: string = ''; // Uyarı mesajı
  alertType: 'success' | 'error' = 'success'; // Uyarı tipi
  tcNumber: string = ''; // TC kimlik numarası
  mobilePhone: string = ''; // Cep telefonu numarası

  // TC kimlik numarası girişini sadece sayılar olarak alır
  onTcNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/\D/g, '');
    this.tcNumber = numericValue;
    input.value = numericValue;
  }

  // Cep telefonu numarası girişini sadece sayılar olarak alır
  onMobilePhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/\D/g, '');
    this.mobilePhone = numericValue;
    input.value = numericValue;
  }

  constructor(private accountService: AccountService, private router: Router, private toastr: ToastrService) { }

  ngOnInit(): void {
    // Kullanıcı rolleri yüklenir
    this.accountService.getRoles().subscribe(roles => {
      this.roles = roles;
    });
  }

  // Kullanıcı kaydı işlemi
  register(frm: NgForm) {
    let errorMessage = ''; // Hata mesajı değişkeni
    const today = new Date();
    const dateOfBirth = new Date(frm.value.dateOfBirth); // Doğum tarihi
    const driverLicenseIssueDate = new Date(frm.value.driverLicenseIssueDate); // Ehliyet veriliş tarihi

    // Form doğrulama
    if (!frm.value.firstName) {
      errorMessage += 'İsim yazınız.<br>'
    }

    if (!frm.value.lastName) {
      errorMessage += 'Soy isim yazınız.<br>'
    }

    if (frm.value.tcNumber.length !== 11) {
      errorMessage += 'TC Kimlik numarası 11 karakter olmalıdır.<br>';
    }

    if (!frm.value.email) {
      errorMessage += 'E-mail yazınız.<br>'
    }

    if (frm.value.password.length < 6) {
      errorMessage += 'Şifre en az 6 karakter olmalıdır.<br>';
    }

    if (frm.value.password !== frm.value.passwordRepeat) {
      errorMessage += 'Şifreler eşleşmiyor.<br>';
    }

    if (!frm.value.genderCode) {
      errorMessage += 'Cinsiyet seçiniz.<br>'
    }

    if (!frm.value.dateOfBirth) {
      errorMessage += 'Doğum tarihi giriniz.<br>'
    }

    if (dateOfBirth >= today) {
      errorMessage += 'Doğum tarihi bugünden önce olmalıdır.<br>';
    }

    if (frm.value.mobilePhone.length !== 10) {
      errorMessage += 'Cep telefonu numarası 10 karakter olmalıdır.<br>';
    }

    if (!frm.value.driverLicenseClass) {
      errorMessage += 'Ehliyet sınıfı giriniz.<br>'
    }

    if (!frm.value.driverLicenseNumber) {
      errorMessage += 'Ehliyet seri numarası giriniz.<br>'
    }

    if (!frm.value.driverLicenseIssueDate) {
      errorMessage += 'Ehliyet veriliş tarihi giriniz.<br>'
    }

    if (driverLicenseIssueDate >= today) {
      errorMessage += 'Ehliyet veriliş tarihi bugünden önce olmalıdır.<br>';
    }

    if (!frm.value.roleId) {
      errorMessage += 'Kullanıcı yetkisi seçiniz.<br>'
    }

    if (errorMessage !== '') {
      this.showError(errorMessage);
      return;
    }

    // Şifre hashleme işlemi
    const hash = SHA256(frm.value.password);
    const base64Hash = hash.toString(enc.Base64);

    // API çağrısı ile kullanıcı kaydı
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
      frm.value.roleId,
    ).subscribe(
      (data) => {
        const toast = this.toastr.success('Yeni Müşteri Eklendi.', 'Başarılı!', { progressBar: true, enableHtml: true, timeOut: 2000 });
        if (toast) {
          toast.onHidden.subscribe(() => {
            this.router.navigateByUrl('/admin/users');
          });
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Müşteri kaydı yapılamadı...', error);
        let errorMessage = 'Müşteri kaydı yapılamadı.';
        if (error.status === 400) {
          if (typeof error.error === 'string') {
            // Basit metin hata mesajı
            errorMessage = error.error;
          } else if (error.error && error.error.errors) {
            // FluentValidation hata mesajları
            const validationErrors = error.error.errors;
            const errorMessages = [];

            for (const key in validationErrors) {
              if (validationErrors.hasOwnProperty(key)) {
                errorMessages.push(validationErrors[key].join(' '));
              }
            }
            errorMessage = errorMessages.join('<br>'); // Her hata mesajını yeni satıra ekleyin
          }
        }

        this.showError(errorMessage);
      }
    );
  }

  // Hata mesajını gösterir
  showError(message: string) {
    this.toastr.error(message, 'Hata!', { progressBar: true, enableHtml: true });
  }
}
