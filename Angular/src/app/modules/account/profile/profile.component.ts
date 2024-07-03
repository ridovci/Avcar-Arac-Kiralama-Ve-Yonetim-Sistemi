import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { User, UserPersonalInfo, UserLicenseInfo, UserContactInfo, Role } from '../../../models/user.model';
import { AccountService } from '../../../services/account.service';
import { AuthService } from '../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile', // Bu bileşenin HTML etiket adı
  templateUrl: './profile.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrl: './profile.component.css' // Bileşen için kullanılan stil dosyasının yolu
})
export class ProfileComponent implements OnInit {
  errorMessages: string[] = []; // Hata mesajlarını tutan dizi

  alertMessage: string = ''; // Uyarı mesajı
  alertType: 'success' | 'error' = 'success'; // Uyarı tipi

  tcNumber: string = ''; // TC kimlik numarası
  mobilePhone: string = ''; // Cep telefonu numarası

  user: User | undefined; // Kullanıcı bilgisi
  userPersonalInfo: UserPersonalInfo | undefined; // Kullanıcının kişisel bilgileri
  userLicenseInfo: UserLicenseInfo | undefined; // Kullanıcının ehliyet bilgileri
  userContactInfo: UserContactInfo | undefined; // Kullanıcının iletişim bilgileri
  roles: Role[] = []; // Rol bilgileri
  passwordHashOld!: string; // Eski şifre hash'i

  formattedDriverLicenseIssueDate: string | null | undefined; // Formatlanmış ehliyet veriliş tarihi
  formatteddateOfBirth: string | null | undefined; // Formatlanmış doğum tarihi

  constructor(
    private accountService: AccountService, // AccountService servisini enjekte et
    private authService: AuthService, // AuthService servisini enjekte et
    private router: Router, // Router servisini enjekte et
    private toastr: ToastrService, // ToastrService servisini enjekte et
    private route: ActivatedRoute, // ActivatedRoute servisini enjekte et
    private datePipe: DatePipe // DatePipe servisini enjekte et
  ) { }

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    let userId = this.authService.getUserId(); // AuthService'den kullanıcı ID'sini al

    if (userId) {
      this.accountService.getUser(userId).subscribe(data => {
        this.user = data;
        if (this.user) {
          this.passwordHashOld = this.user.passwordHash; // Eski şifre hash'ini sakla
          this.userPersonalInfo = this.user.userPersonalInfo;
          this.userContactInfo = this.user.userContactInfo;
          this.userLicenseInfo = this.user.userLicenseInfo;
          if (this.userLicenseInfo) {
            const date = new Date(this.userLicenseInfo.driverLicenseIssueDate);
            this.formattedDriverLicenseIssueDate = this.datePipe.transform(date, 'yyyy-MM-dd'); // Tarihi formatla
          }
          if (this.userPersonalInfo) {
            const date = new Date(this.userPersonalInfo.dateOfBirth);
            this.formatteddateOfBirth = this.datePipe.transform(date, 'yyyy-MM-dd'); // Tarihi formatla
          }
        }
      });
    }

    this.accountService.getRoles().subscribe(roles => {
      this.roles = roles; // Rol bilgilerini al
    });
  }

  // TC kimlik numarası girişi için kontrol
  onTcNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/\D/g, ''); // Sadece rakamları al
    this.tcNumber = numericValue;
    input.value = numericValue;
  }

  // Cep telefonu numarası girişi için kontrol
  onMobilePhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = input.value.replace(/\D/g, ''); // Sadece rakamları al
    this.mobilePhone = numericValue;
    input.value = numericValue;
  }

  // Kullanıcı bilgilerini güncelleme fonksiyonu
  updateForm(frm: NgForm) {
    this.errorMessages = []; // Hata mesajlarını sıfırla

    let userId = this.authService.getUserId(); // Kullanıcı ID'sini al
    if (!userId) {
      this.showError("Kullanıcı ID'si bulunamadı."); // Kullanıcı ID'si bulunamazsa hata mesajı göster
      return;
    }

    const today = new Date();
    const dateOfBirth = new Date(frm.value.dateOfBirth);
    const driverLicenseIssueDate = new Date(frm.value.driverLicenseIssueDate);

    // Form validasyonları
    if (!frm.value.firstName) {
      this.errorMessages.push('İsim yazınız.');
    }

    if (!frm.value.lastName) {
      this.errorMessages.push('Soy isim yazınız.');
    }

    if (frm.value.tcNumber.length !== 11) {
      this.errorMessages.push('TC Kimlik numarası 11 karakter olmalıdır.');
    }

    if (!frm.value.email) {
      this.errorMessages.push('E-mail yazınız.');
    }

    if (!frm.value.genderCode) {
      this.errorMessages.push('Cinsiyet seçiniz.');
    }

    if (!frm.value.dateOfBirth) {
      this.errorMessages.push('Doğum tarihi giriniz.');
    }

    // Kullanıcının 18 yaşından büyük olup olmadığını kontrol et
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDifference = today.getMonth() - dateOfBirth.getMonth();
    const dayDifference = today.getDate() - dateOfBirth.getDate();

    if (age < 18 || (age === 18 && (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)))) {
      this.errorMessages.push('Kullanıcı 18 yaşından büyük olmalıdır.');
    }

    if (frm.value.mobilePhone.length !== 10) {
      this.errorMessages.push('Cep telefonu numarası 10 karakter olmalıdır.');
    }

    if (!frm.value.driverLicenseClass) {
      this.errorMessages.push('Ehliyet sınıfı giriniz.');
    }

    if (!frm.value.driverLicenseNumber) {
      this.errorMessages.push('Ehliyet seri numarası giriniz.');
    }

    if (!frm.value.driverLicenseIssueDate) {
      this.errorMessages.push('Ehliyet veriliş tarihi giriniz.');
    }

    if (driverLicenseIssueDate >= today) {
      this.errorMessages.push('Ehliyet veriliş tarihi bugünden önce olmalıdır.');
    }

    const minDriverLicenseIssueDate = new Date(dateOfBirth);
    minDriverLicenseIssueDate.setFullYear(minDriverLicenseIssueDate.getFullYear() + 18);
    if (driverLicenseIssueDate < minDriverLicenseIssueDate) {
      this.errorMessages.push('Ehliyet veriliş tarihi, kullanıcının 18 yaşına girdiği tarihten sonra olmalıdır.');
    }

    if (this.errorMessages.length > 0) {
      this.showErrorMessages(); // Hata mesajlarını göster
      return;
    }

    // Güncellenmiş kullanıcı bilgilerini oluştur
    const updatedUser: User = {
      userId: userId,
      email: frm.value.email,
      passwordHash: this.passwordHashOld,
      tcNumber: frm.value.tcNumber,
      roleId: frm.value.roleId,
      userContactInfo: {
        userContactInfoId: frm.value.userContactInfoId,
        mobilePhone: frm.value.mobilePhone,
        mobilePhoneBackup: frm.value.mobilePhoneBackup
      },
      userPersonalInfo: {
        userPersonalInfoId: frm.value.userPersonalInfoId,
        firstName: frm.value.firstName,
        lastName: frm.value.lastName,
        genderCode: frm.value.genderCode,
        dateOfBirth: new Date(frm.value.dateOfBirth)
      },
      userLicenseInfo: {
        userLicenseInfoId: frm.value.userLicenseInfoId,
        driverLicenseIssueDate: new Date(frm.value.driverLicenseIssueDate),
        driverLicenseClass: frm.value.driverLicenseClass,
        driverLicenseNumber: frm.value.driverLicenseNumber
      },
      registrationDate: new Date(), // Güncelleme tarihi olarak bugünü kullanabilirsiniz
      userContactInfoId: 0,
      personalInfoId: 0,
      licenseInfoId: 0
    };

    // Kullanıcı bilgilerini güncelle
    this.accountService.updateUserByUser(userId, updatedUser).subscribe(
      () => {
        this.toastr.success('Kullanıcı bilgileri başarıyla güncellendi.', 'Başarılı!', { progressBar: true, enableHtml: true });
      },
      (error: HttpErrorResponse) => {
        console.error('Üye kaydı yapılamadı...', error);

        let errorMessage = 'Üye kaydı yapılamadı.';
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

  // Hata mesajını gösteren fonksiyon
  showError(message: string) {
    this.toastr.error(message, 'Hata!', { progressBar: true, enableHtml: true });
  }

  // Hata mesajlarını gösteren fonksiyon
  showErrorMessages() {
    const errorMessageHtml = this.errorMessages.join('<br>');
    this.showError(errorMessageHtml);
  }

  // Tarihi Türkçe formatta döndüren fonksiyon
  formatDateToTurkish(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
