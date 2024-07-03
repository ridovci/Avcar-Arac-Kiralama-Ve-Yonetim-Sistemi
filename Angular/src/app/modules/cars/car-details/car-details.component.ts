import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Vehicle, VehicleFeature } from '../../../models/vehicle.model';
import { VehicleService } from '../../../services/vehicle.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RentalService } from '../../../services/rental.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RentalModalComponent } from '../rental-modal/rental-modal.component';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'app-car-details', // Bu bileşenin HTML etiket adı
  templateUrl: './car-details.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrl: './car-details.component.css' // Bileşen için kullanılan stil dosyasının yolu
})

export class CarDetailsComponent implements OnInit {
  isAgeValid: boolean = false; // Yaşın geçerli olup olmadığını kontrol eder
  hasValidLicense: boolean = false; // Ehliyetin geçerli olup olmadığını kontrol eder
  userId?: number; // Kullanıcı ID'si
  safeUrl!: SafeResourceUrl; // Güvenli URL
  departureLocationId?: number; // Kalkış lokasyonu ID'si
  departureLocation?: string; // Kalkış lokasyonu adı
  arrivalLocationId?: number; // Varış lokasyonu ID'si
  arrivalLocation?: string; // Varış lokasyonu adı
  rentalDate?: string; // Kiralama tarihi
  returnDate?: string; // İade tarihi
  googleLocationName?: string; // Google Maps için lokasyon adı
  locationName?: string; // Lokasyon adı
  vehicleId!: number; // Araç ID'si
  dateDifference?: number; // Tarih farkı (gün cinsinden)
  vehicles: Vehicle | null = null; // Araç bilgileri
  availableFeatures: VehicleFeature[] = []; // Mevcut araç özellikleri

  constructor(
    private router: Router, // Router servisini enjekte et
    private vehicleService: VehicleService, // VehicleService servisini enjekte et
    private sanitizer: DomSanitizer, // DomSanitizer servisini enjekte et
    private rentalService: RentalService, // RentalService servisini enjekte et
    private modalService: NgbModal, // NgbModal servisini enjekte et
    private authService: AuthService, // AuthService servisini enjekte et
    private accountService: AccountService // AccountService servisini enjekte et
  ) {}

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    this.loadData(); // Verileri yükle
    this.loadVehicleDetails(); // Araç detaylarını yükle

    // Araç özelliklerini ID'ye göre yükle
    this.vehicleService.getVehicleFeaturesById(this.vehicleId).subscribe(features => {
      this.availableFeatures = features;
    });
  }

  // Verileri yükleyen fonksiyon
  loadData(): void {
    const routerState = history.state; // Yönlendirme durumunu al
    if (routerState) {
      this.departureLocationId = routerState.departureLocationId;
      this.departureLocationId = routerState.departureLocationId;
      this.arrivalLocationId = routerState.arrivalLocationId;
      this.rentalDate = routerState.rentalDate;
      this.returnDate = routerState.returnDate;
      this.vehicleId = routerState.vehicleId;
      this.dateDifference = this.calculateDateDifference(this.rentalDate!, this.returnDate!);

      if (this.departureLocationId !== undefined) {
        // Kalkış lokasyon adını al
        this.rentalService.getLocations(this.departureLocationId).subscribe({
          next: (data) => {
            this.departureLocation = data.locationName;
          }
        });
      } else {
        // Kalkış lokasyon ID'si tanımsızsa hata mesajı
        console.error('Departure location ID is undefined');
      }

      if (this.arrivalLocationId !== undefined) {
        // Varış lokasyon adını al
        this.rentalService.getLocations(this.arrivalLocationId).subscribe({
          next: (data) => {
            this.arrivalLocation = data.locationName;
          }
        });
      } else {
        // Varış lokasyon ID'si tanımsızsa hata mesajı
        console.error('Arrival location ID is undefined');
      }
    }
  }

  // Araç detaylarını yükleyen fonksiyon
  loadVehicleDetails(): void {
    if (!this.vehicleId) {
      this.router.navigate(['/cars']); // Araç ID'si tanımsızsa, cars sayfasına yönlendir
      window.scrollTo(0, 0);
      return;
    }

    // Araç detaylarını ID'ye göre al
    this.vehicleService.getVehicleDetails(this.vehicleId).subscribe({
      next: (data) => {
        this.vehicles = data;
        // Araç konumunu ID'ye göre al ve harita URL'sini güncelle
        this.vehicleService.getLocationById(data.locationId).subscribe({
          next: (data) => {
            this.googleLocationName = data.locationName;
            this.updateMapUrl();
          }
        });
      },
      error: (error) => {
        console.log("Araç detayları alınamadı", error);
      }
    });
  }

  // Harita URL'sini güncelleyen fonksiyon
  updateMapUrl(): void {
    const location = this.googleLocationName;
    if (location) {
      const url = `https://maps.google.com/maps?width=100%&height=600&hl=en&q=${encodeURIComponent(location)}+(${encodeURIComponent(location)})&t=&z=14&ie=UTF8&iwloc=B&output=embed`;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else {
      console.error('Konum bilgisi tanımlı değil veya geçersiz');
    }
  }

  // Tarih farkını (gün cinsinden) hesaplayan fonksiyon
  calculateDateDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInTime = end.getTime() - start.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return differenceInDays;
  }

  // Kiralama modalını açan fonksiyon
  openRentalModal() {
    // Kullanıcının giriş yapmış olup olmadığını kontrol edin
    if (!this.loginControl()) {
      return;
    }
    // Kullanıcı bilgilerinin doğru alınıp alınmadığını kontrol edin
    if (!this.userControl()) {
      return;
    }

    // Yaş ve ehliyet kontrolünü gerçekleştirin
    this.ageAndDriverLicenceControl().then(() => {
      let errorMessage = "Maalesef, bu aracı kiralayamazsınız.<br>";
      if (!this.isAgeValid || !this.hasValidLicense) {
        if (!this.isAgeValid && !this.hasValidLicense) {
          errorMessage += "Hem yaş hem de ehliyet yılı kriterlerini karşılamıyorsunuz.";
        } else if (!this.isAgeValid) {
          errorMessage += "Yaş kriterini karşılamıyorsunuz.";
        } else if (!this.hasValidLicense) {
          errorMessage += "Ehliyet yılı kriterini karşılamıyorsunuz.";
        }
        this.showErrorAlert(errorMessage);
        return; // Kriterler karşılanmadığı için modal açılmadan metod sonlandırılır
      }
      // Tüm kontroller başarılıysa, kiralama modalını aç
      const modalRef = this.modalService.open(RentalModalComponent);
      // Modal'a gönderilecek bilgileri ayarlayın
      modalRef.componentInstance.vehicleId = this.vehicles?.vehicleId; // Araç ID'si
      modalRef.componentInstance.rentalDate = this.rentalDate;
      modalRef.componentInstance.returnDate = this.returnDate;
      modalRef.componentInstance.dateDifference = this.dateDifference;
      modalRef.componentInstance.dailyRentalFee = this.vehicles!.dailyRentalFee;
      modalRef.componentInstance.discountRate = this.vehicles!.discountRate;
      modalRef.componentInstance.departureLocationId = this.departureLocationId;
      modalRef.componentInstance.arrivalLocationId = this.arrivalLocationId;
      modalRef.componentInstance.userId = this.userId;
    });
  }

  // Kullanıcının giriş yapmış olup olmadığını kontrol eden fonksiyon
  loginControl(): boolean {
    if (this.authService.isLoggedIn() === false) {
      this.showErrorAlert("Kiralama işlemine devam edebilmeniz için sisteme giriş yapmanız gerekmektedir.");
      return false;
    }
    return true;
  }

  // Kullanıcı bilgilerinin doğru alınıp alınmadığını kontrol eden fonksiyon
  userControl(): boolean {
    const userId = this.authService.getUserId();
    if (userId === undefined) {
      this.showErrorAlert("Üye bilgisi alınamadı.");
      return false;
    } else {
      this.userId = userId;
      return true;
    }
  }

  // Yaş ve ehliyet kontrolünü gerçekleştiren fonksiyon
  ageAndDriverLicenceControl(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.accountService.getUser(this.userId!).subscribe({
        next: (user) => {
          if (user && user.userPersonalInfo && user.userPersonalInfo.dateOfBirth) {
            const dateOfBirth = new Date(user.userPersonalInfo.dateOfBirth);
            this.isAgeValid = this.checkAge(dateOfBirth, this.vehicles?.minDriverAge);
            this.hasValidLicense = this.checkLicense(user.userLicenseInfo?.driverLicenseIssueDate, this.vehicles?.minDrivingLicenseYear);
          } else {
            console.log("Kullanıcı veya kişisel bilgileri eksik.");
            this.showErrorAlert("Üye bilgisi alınamadı.");
            this.isAgeValid = false;
            this.hasValidLicense = false;
          }
          resolve();
        },
        error: (err) => {
          this.showErrorAlert("Bir hata oluştu: " + err.message);
          this.isAgeValid = false;
          this.hasValidLicense = false;
          resolve();
        }
      });
    });
  }

  // Yaş kontrolünü gerçekleştiren fonksiyon
  checkAge(dateOfBirth?: Date, minAge?: number): boolean {
    if (!dateOfBirth || !minAge) return false;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= minAge;
  }

  // Ehliyet yılı kontrolünü gerçekleştiren fonksiyon
  checkLicense(licenseIssueDate?: Date, minLicenseYear?: number): boolean {
    if (licenseIssueDate == null || minLicenseYear == null) return false;

    const today = new Date();
    const issueDate = new Date(licenseIssueDate);
    const licenseYears = today.getFullYear() - issueDate.getFullYear();
    return licenseYears >= minLicenseYear;
  }

  // Hata mesajı gösteren fonksiyon
  private showErrorAlert(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Dikkat!',
      html: errorMessage, // SweetAlert'in HTML desteği için html özelliği kullanılır
    });
  }

  // Fiyatı biçimlendiren fonksiyon
  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price);
  }
}
