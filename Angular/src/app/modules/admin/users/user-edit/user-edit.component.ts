import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse sınıfını içe aktarır
import { Component, OnInit } from '@angular/core'; // Angular bileşen ve OnInit arayüzünü içe aktarır
import { NgForm } from '@angular/forms'; // Angular formlarını içe aktarır
import { ActivatedRoute, Router } from '@angular/router'; // Angular yönlendirme modüllerini içe aktarır
import { SHA256, enc } from 'crypto-js'; // SHA256 ve enc şifreleme kütüphanelerini içe aktarır
import { ToastrService } from 'ngx-toastr'; // Toastr bildirim servisini içe aktarır
import { AccountService } from '../../../../services/account.service'; // AccountService servisini içe aktarır
import { Role, User, UserContactInfo, UserLicenseInfo, UserPersonalInfo } from '../../../../models/user.model'; // Kullanıcı modelini içe aktarır
import { DatePipe } from '@angular/common'; // Angular tarih borusunu içe aktarır
import { PagedResult, RentalDto, RentalStatus } from '../../../../models/rental.model'; // Kiralama modellerini içe aktarır
import { RentalService } from '../../../../services/rental.service'; // Kiralama servisini içe aktarır
import Swal from 'sweetalert2'; // SweetAlert2 kütüphanesini içe aktarır
import { VehicleService } from '../../../../services/vehicle.service'; // Araç servisini içe aktarır
import { AuthService } from '../../../../services/auth.service'; // Kimlik doğrulama servisini içe aktarır

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit  { 

  rentals: RentalDto[] = []; // Kullanıcı kiralamalarını tutan dizi
  totalItems = 0; // Toplam öğe sayısı
  currentPage = 1; // Mevcut sayfa numarası
  pageSize = 5; // Sayfa başına öğe sayısı
  totalPages = 0; // Toplam sayfa sayısı
  status?: RentalStatus; // Kiralama durumu filtresi
  searchQuery: string = ''; // Arama sorgusu
  userId: number | undefined; // Kullanıcı ID'si
  today = new Date(); // Bugünün tarihi

  alertMessage: string = ''; // Uyarı mesajı
  alertType: 'success' | 'error' = 'success'; // Uyarı tipi
  
  tcNumber: string = ''; // TC kimlik numarası
  mobilePhone: string = ''; // Cep telefonu numarası

  isSuperAdmin: boolean = false; // Kullanıcının süper admin olup olmadığını belirler

  user: User | undefined; // Kullanıcı bilgileri
  userPersonalInfo: UserPersonalInfo | undefined; // Kullanıcı kişisel bilgileri
  userLicenseInfo: UserLicenseInfo | undefined; // Kullanıcı ehliyet bilgileri
  userContactInfo: UserContactInfo | undefined; // Kullanıcı iletişim bilgileri
  roles: Role[] = []; // Kullanıcı rolleri
  passwordHashOld!: string; // Eski şifre hash değeri

  formattedDriverLicenseIssueDate: string | null | undefined; // Formatlanmış ehliyet veriliş tarihi
  formatteddateOfBirth: string | null | undefined; // Formatlanmış doğum tarihi

  // Kiralamanın başlangıç tarihinin bugünden önce olup olmadığını kontrol eder
  isStartDateTodayOrLater(startDate: string): boolean {
    const startDateDate = new Date(startDate);
    return startDateDate <= this.today;
  }

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

  constructor(
    private authService: AuthService,
    private rentalService: RentalService,
    private vehicleService: VehicleService,
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params["id"]; // URL'den kullanıcı ID'sini alır

    if (this.userId) {
      this.loadRentalsForUser(this.userId); // Kullanıcı kiralamalarını yükler

      this.accountService.getUser(this.userId).subscribe(data => {
        this.user = data;
        if (this.user) {
          this.passwordHashOld = this.user.passwordHash;
          this.userPersonalInfo = this.user.userPersonalInfo;
          this.userContactInfo = this.user.userContactInfo;
          this.userLicenseInfo = this.user.userLicenseInfo;
          if (this.userLicenseInfo) {
            const date = new Date(this.userLicenseInfo.driverLicenseIssueDate);
            this.formattedDriverLicenseIssueDate = this.datePipe.transform(date, 'yyyy-MM-dd');             
          }
          if (this.userPersonalInfo) {
            const date = new Date(this.userPersonalInfo.dateOfBirth);
            this.formatteddateOfBirth = this.datePipe.transform(date, 'yyyy-MM-dd');             
          }
        }
      });
    }

    this.accountService.getRoles().subscribe(roles => {
      this.roles = roles; // Kullanıcı rolleri yüklenir
    });

    if (this.authService.isSuperAdmin()) {
      this.isSuperAdmin = true; // Kullanıcının süper admin olup olmadığını kontrol eder
    }
  }

  // Belirtilen kullanıcı için kiralamaları yükler
  loadRentalsForUser(userId: number | undefined): void {
    if (userId === undefined) {
      console.error('Kullanıcı kimliği tanımlanmamış. Kiralamalar yüklenemiyor.');
      this.toastr.error('Kiralamaları görüntülemek için kullanıcının giriş yapmış olması gerekir.', 'Authentication Required');
      return;
    }
    
    this.rentalService.getRentalsByUserId(userId, this.currentPage, this.pageSize, this.status, this.searchQuery).subscribe({
      next: (response: PagedResult<RentalDto>) => {
        this.rentals = response.items;
        this.totalItems = response.totalCount;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      },
      error: (error) => {
        console.error('Kullanıcı için kiralama yüklenirken hata oluştu:', userId, error);
        this.toastr.error('Kiralama bilgileri yüklenemedi.', 'Error!');
      }
    });
  }

  // Kiralamayı siler
  deleteRental(id: number): void {
    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu kiralamayı silmek istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'Hayır, iptal et'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rentalService.deleteRental(id).subscribe(
          () => {
            Swal.fire('Silindi!', 'Kiralama başarıyla silindi.', 'success');
            this.loadRentalsForUser(this.userId);
          },
          (error: any) => {
            Swal.fire('Hata!', 'Kiralama silinirken bir hata oluştu.', 'error');
          }
        );
      }
    });
  }

  // İki tarih arasındaki gün farkını hesaplar
  getDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Kiralama durumunu çevirir
  translateStatus(status: string): string {
    switch (status) {
      case 'Approved':
        return 'Onaylandı';
      case 'Cancelled':
        return 'İptal Edildi';
      case 'Completed':
        return 'Tamamlandı';
      case 'Pending':
        return 'Beklemede';
      default:
        return status;
    }
  }

  // Sayfa numaralarını döndürür
  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Önceki sayfaya gider
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRentalsForUser(this.userId);
    }
  }

  // Sonraki sayfaya gider
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRentalsForUser(this.userId);
    }
  }

  // Belirtilen sayfaya gider
  goToPage(page: number) {
    this.currentPage = page;
    this.loadRentalsForUser(this.userId);
  }

  // Sayfa değişikliği olduğunda çağrılır
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRentalsForUser(this.userId);
  }

  // Kiralama durumu değişikliği olduğunda çağrılır
  onStatusChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.status = selectElement.value ? parseInt(selectElement.value) as RentalStatus : undefined;
    this.loadRentalsForUser(this.userId);
  }

  // Arama sorgusu değiştiğinde çağrılır
  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.currentPage = 1; // Sayfayı sıfırla
    this.loadRentalsForUser(this.userId);
  }

  // Kullanıcı formunu günceller
  updateForm(frm: NgForm) {
    const userId = this.route.snapshot.params["id"];
    if (!userId) {
      this.showError("Kullanıcı ID'si bulunamadı.");
      return;
    }
    
    let errorMessage = '';
    const today = new Date();
    const dateOfBirth = new Date(frm.value.dateOfBirth);
    const driverLicenseIssueDate = new Date(frm.value.driverLicenseIssueDate);

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

    if (!frm.value.genderCode) {
      errorMessage += 'Cinsiyet seçiniz.<br>'
    }

    if (!frm.value.dateOfBirth) {
      errorMessage += 'Doğum tarihi giriniz.<br>'
    }

    if (frm.value.dateOfBirth >= today) {
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

    if (frm.value.driverLicenseIssueDate >= today) {
      errorMessage += 'Ehliyet veriliş tarihi bugünden önce olmalıdır.<br>';
    }

    if (!frm.value.roleId) {
      errorMessage += 'Kullanıcı yetkisi seçiniz.<br>'
    }

    if (errorMessage !== '') {
      this.showError(errorMessage);
      return;
    }

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
      registrationDate: new Date() // Güncelleme tarihi olarak bugünü kullanabilirsiniz
      ,
      userContactInfoId: 0,
      personalInfoId: 0,
      licenseInfoId: 0
    };

    this.accountService.updateUserByAdmin(userId, updatedUser).subscribe(
      () => {
        this.toastr.success('Kullanıcı bilgileri başarıyla güncellendi.', 'Başarılı!', { progressBar: true, enableHtml: true });
      },
      (error: HttpErrorResponse) => {
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
        } else if (error.error) {
          errorMessage = error.error;
        }
    
        this.showError(errorMessage);
      }
    );
  }

  // Hata mesajını gösterir
  showError(message: string) {
    this.toastr.error(message, 'Hata!', { progressBar: true, enableHtml: true });
  }

  // Tarihi Türkçe formata çevirir
  formatDateToTurkish(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Fiyatı formatlar
  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price);
  }
}
