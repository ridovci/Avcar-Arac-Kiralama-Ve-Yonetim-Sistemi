import { Component, OnDestroy, OnInit } from '@angular/core';
import { Vehicle, VehicleFeature, VehicleSearchCriteria } from '../../models/vehicle.model';
import { PagedResult, VehicleService } from '../../services/vehicle.service';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { Locations } from '../../models/location.model';
import { RentalService } from '../../services/rental.service';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ConfirmService } from '../../services/confirm.service';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, NavigationExtras, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormStateService } from '../../services/form-state.service';
import { filter } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-cars', // Bu bileşenin HTML etiket adı
  templateUrl: './cars.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrls: ['./cars.component.css'] // Bileşen için kullanılan stil dosyasının yolu
})
export class CarsComponent implements OnInit, OnDestroy {
  isLoading: boolean = false; // Başlangıçta yükleme durumu false
  private destroy$ = new Subject<void>(); // Bileşen yok edildiğinde yayın yapacak Subject
  user: User | undefined;
  vehicleSearchForm!: FormGroup; // Araç arama formu
  brands: any[] = []; // Markalar listesi
  models: any[] = []; // Modeller listesi
  vehicleTypes: any[] = []; // Araç tipleri listesi
  gearTypes: any[] = []; // Vites tipleri listesi
  fuelTypes: any[] = []; // Yakıt tipleri listesi
  colors: any[] = []; // Renkler listesi
  airConditionings: any[] = []; // Klima tipleri listesi
  locations: any[] = []; // Lokasyonlar listesi
  modelYears: number[] = []; // Yıl seçeneklerini dolduracak dizi
  availableFeatures: VehicleFeature[] = []; // Mevcut araç özellikleri listesi
  vehicles: Vehicle[] = []; // Arama sonucu dönen araçlar listesi
  currentPage: number = 1; // Mevcut sayfa numarası
  pageSize: number = 6; // Sayfa başına gösterilecek araç sayısı
  totalPages: number = 0; // Toplam sayfa sayısı
  departureLocationId?: string; // Kalkış lokasyonu ID'si
  arrivalLocationId?: string; // Varış lokasyonu ID'si
  rentalDate?: string; // Kiralama tarihi
  returnDate?: string; // İade tarihi
  dateError?: string; // Tarih hatası mesajı

  sidebarVisible = false; // Yan menünün görünürlük durumu

  // Yan menünün görünürlüğünü değiştiren fonksiyon
  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  // Bağımlılıkları enjekte eden constructor
  constructor(
    private fb: FormBuilder, // Formları oluşturmak için FormBuilder servisini enjekte et
    private vehicleService: VehicleService, // Araç servislerini enjekte et
    private rentalService: RentalService, // Kiralama servislerini enjekte et
    private toastr: ToastrService, // Toastr bildirim servisini enjekte et
    private confirmService: ConfirmService, // Onay servisini enjekte et
    private http: HttpClient, // HTTP istemci servisini enjekte et
    private router: Router, // Router servisini enjekte et
    private formStateService: FormStateService, // Form durumunu yönetmek için FormStateService'i enjekte et
    private route: ActivatedRoute, // Aktif yönlendirme bilgisini almak için ActivatedRoute servisini enjekte et
    private authService: AuthService,
    private accountService: AccountService
  ) {
    // Araç arama formunu oluştur ve gerekli validasyonları ekle
    this.vehicleSearchForm = this.fb.group({
      departureLocationId: [''], // Kalkış lokasyonu ID'si
      arrivalLocationId: [''], // Varış lokasyonu ID'si
      minModelYear: [null], // Minimum model yılı
      maxModelYear: [null], // Maksimum model yılı
      brandId: [0], // Marka ID'si
      modelId: [0], // Model ID'si
      vehicleTypeId: [0], // Araç tipi ID'si
      gearTypeId: [0], // Vites tipi ID'si
      fuelTypeId: [0], // Yakıt tipi ID'si
      airConditioningId: [0], // Klima tipi ID'si
      minDailyRentalFee: [null], // Minimum günlük kiralama ücreti
      maxDailyRentalFee: [null], // Maksimum günlük kiralama ücreti
      featureIds: this.fb.array([]), // Araç özellikleri ID'leri (checkbox)
      color: [''], // Araç rengi
      minNumberOfPeople: [0], // Minimum kişi sayısı
      maxNumberOfPeople: [0], // Maksimum kişi sayısı
      minNumberOfDoors: [0], // Minimum kapı sayısı
      maxNumberOfDoors: [0], // Maksimum kapı sayısı
      sortOrder: [''], // Sıralama tercihi
      
      locationId: [null, Validators.required], // Lokasyon ID'si (zorunlu alan)
      rentalDate: new FormControl('', [Validators.required, this.validateRentalDate.bind(this)]), // Kiralama tarihi
      returnDate: ['', Validators.required] // İade tarihi
    }, { validators: this.validateDateRange });

    // Router state ile gelen verileri al
    const routerState = this.router.getCurrentNavigation()?.extras.state as {
      departureLocationId?: string,
      rentalDate?: string,
      returnDate?: string,
      arrivalLocationId?: string
    };

    if (routerState) {
      // Router state ile gelen verileri değişkenlere ata
      this.rentalDate = routerState.rentalDate;
      this.returnDate = routerState.returnDate;
      this.departureLocationId = routerState.departureLocationId;
      this.arrivalLocationId = routerState.arrivalLocationId;
    }
  }

  // Tarih aralığını doğrulayan fonksiyon
  validateDateRange(group: FormGroup): { [key: string]: any } | null {
    const rental = new Date(group.get('rentalDate')!.value);
    const returnDate = new Date(group.get('returnDate')!.value);

    if (rental && returnDate && returnDate <= rental) {
      return { 'dateRangeInvalid': true }; // İade tarihi, kiralama tarihinden önce veya aynı ise hata döndür
    }
    return null; // Hata yok
  }

  // Kiralama tarihini doğrulayan fonksiyon
  validateRentalDate(control: FormControl): { [key: string]: any } | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Saat kısmını 00:00:00 olarak ayarla
    const selectedDate = new Date(control.value);

    if (selectedDate < today) {
      return { 'invalidDate': true }; // Seçilen tarih bugünden önce ise hata döndür
    }
    return null; // Hata yok
  }

  // Özellik checkbox değişikliklerini işleyen fonksiyon
  onFeatureChange(featureId: number, event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      const isChecked = target.checked;
      const featureArray = this.vehicleSearchForm.get('featureIds') as FormArray;
      if (isChecked) {
        featureArray.push(new FormControl(featureId)); // Checkbox seçiliyse özellik ID'sini ekle
      } else {
        const index = featureArray.controls.findIndex(x => x.value === featureId);
        featureArray.removeAt(index); // Checkbox seçili değilse özellik ID'sini çıkar
      }
    }
  }

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    this.loadData(); // Gerekli verileri yükle
    this.setupFormChanges(); // Form değişikliklerini izlemek için setupFormChanges fonksiyonunu çağır
  }


  // Gerekli verileri yükleyen fonksiyon
  loadData(): void {
    this.getBrands(); // Markaları yükle
    this.getAvailableFeatures(); // Mevcut araç özelliklerini yükle
    this.getVehicleTypes(); // Araç tiplerini yükle
    this.getGearTypes(); // Vites tiplerini yükle
    this.getFuelTypes(); // Yakıt tiplerini yükle
    this.getColors(); // Renkleri yükle
    this.getAirConditionings(); // Klima tiplerini yükle
    this.getAllLocations(); // Tüm lokasyonları yükle

    this.modelYears = this.generateYears(new Date().getFullYear(), 20); // Son 20 yılı doldur

    const minYear = Math.min(...this.modelYears); // Minimum yıl
    const maxYear = Math.max(...this.modelYears); // Maksimum yıl
  }

  // Form değişikliklerini izleyen ve işleyen fonksiyon
  setupFormChanges(): void {
    this.vehicleSearchForm.valueChanges
      .pipe(debounceTime(300)) // Değişiklikleri 300ms gecikmeyle işleme
      .subscribe(values => {
        // Min ve max model yılı boşsa varsayılan değerleri ayarla
        if (!this.vehicleSearchForm.get('minModelYear')!.value) {
          const minYear = Math.min(...this.modelYears);
          this.vehicleSearchForm.get('minModelYear')!.setValue(minYear);
        }
        if (!this.vehicleSearchForm.get('maxModelYear')!.value) {
          const maxYear = Math.max(...this.modelYears);
          this.vehicleSearchForm.get('maxModelYear')!.setValue(maxYear);
        }

        if (this.vehicleSearchForm.valid) {
          this.dateError = ""; // Tarih hatası yoksa hata mesajını temizle
          this.onSearch(); // Arama işlemini başlat
        } else {
          let errorMessages: string[] = [];

          if (this.vehicleSearchForm.get('rentalDate')!.errors?.['invalidDate']) {
            errorMessages.push('Alış tarihi bugünden önce olamaz.');
          }

          if (this.vehicleSearchForm.errors?.['dateRangeInvalid']) {
            errorMessages.push('İade tarihi, alış tarihinden sonraki bir gün olmalıdır.');
          }

          this.vehicles = []; // Hata varsa araç listesini temizle
          this.dateError = errorMessages.join(''); // Hata mesajlarını birleştir ve ata
        }
      });
  }

  // Arama işlemini başlatan fonksiyon
  onSearch(): void {
    if (this.vehicleSearchForm.valid) {
      this.isLoading = true; // Yükleme başlıyor
      const criteria = this.prepareFormData(this.vehicleSearchForm.value); // Form verilerini hazırla

      this.vehicleService.searchVehicles(criteria, this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$)) // Bileşen yok edildiğinde işlemi iptal et
        .subscribe({
          next: (response: PagedResult<Vehicle>) => {
            this.isLoading = false; // Yükleme tamamlandı
            if (response && response.items) { // Null kontrolü ekledik
              this.vehicles = response.items;
              this.totalPages = Math.ceil(response.totalCount / this.pageSize);
              if (this.vehicles.length === 0) {
                console.warn('Belirtilen kriterlere uygun araç bulunamadı.');
              }
            } else {
              console.warn('Geçersiz yanıt alındı.', response); // Yanıtı da logluyoruz
              this.vehicles = [];
              this.totalPages = 0;
            }
          },
          error: (err) => {
            this.isLoading = false; // Yükleme tamamlandı
            console.error('Araçlar getirilirken hata oluştu', err);
            this.showErrorAlert(err.error);
          }
        });
    }
  }

  // Önceki sayfaya gitme işlemi
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--; // Sayfa numarasını azalt
      this.onSearch(); // Arama işlemini tekrar başlat
    }
  }

  // Sonraki sayfaya gitme işlemi
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++; // Sayfa numarasını artır
      this.onSearch(); // Arama işlemini tekrar başlat
    }
  }

  // Belirli bir sayfaya gitme işlemi
  goToPage(page: number): void {
    this.currentPage = page; // Sayfa numarasını ayarla
    this.onSearch(); // Arama işlemini tekrar başlat
  }

  // Sayfa numaralarını döndüren fonksiyon
  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1); // Sayfa numaralarını içeren bir dizi döndür
  }

  // Tüm lokasyonları getiren fonksiyon
  getAllLocations(): void {
    this.rentalService.getAllLocations().subscribe({
      next: (data) => {
        this.locations = data; // Gelen lokasyonları listeye ata
        if (data.length > 0) {
          this.initializeForm(); // Lokasyonlar yüklendikten sonra formu başlat
        }
      },
      error: (error) => {
        console.error('Lokasyonlar yüklenirken hata oluştu:', error);
      }
    });
  }

  // Tarihi YYYY-MM-DD formatında biçimlendiren fonksiyon
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // Tarihi YYYY-MM-DD formatına dönüştür
  }

  // Araç tiplerini getiren fonksiyon
  getVehicleTypes(): void {
    this.vehicleService.getVehicleTypes().subscribe({
      next: (response) => {
        this.vehicleTypes = response; // Gelen araç tiplerini listeye ata
      },
      error: (error) => {
        console.error("Araç tipleri yüklenirken hata oluştu", error);
      }
    });
  }

  // Markaları getiren fonksiyon
  getBrands(): void {
    this.vehicleService.getBrands().subscribe({
      next: (response) => {
        this.brands = response; // Gelen markaları listeye ata
      },
      error: (error) => {
        console.error('Markalar alınırken hata oluştu:', error);
      }
    });
  }

  // Vites tiplerini getiren fonksiyon
  getGearTypes(): void {
    this.vehicleService.getGearTypes().subscribe({
      next: (response) => {
        this.gearTypes = response; // Gelen vites tiplerini listeye ata
      },
      error: (error) => {
        console.error('Vites tipleri alınırken hata oluştu:', error);
      }
    });
  }

  // Yakıt tiplerini getiren fonksiyon
  getFuelTypes(): void {
    this.vehicleService.getFuelTypes().subscribe({
      next: (response) => {
        this.fuelTypes = response; // Gelen yakıt tiplerini listeye ata
      },
      error: (error) => {
        console.error('Yakıt tipleri alınırken hata oluştu:', error);
      }
    });
  }

  // Araç renklerini getiren fonksiyon
  getColors(): void {
    this.vehicleService.getColors().subscribe({
      next: (response) => {
        this.colors = response; // Gelen renkleri listeye ata
      },
      error: (error) => {
        console.error('Araç renkleri alınırken hata oluştu:', error);
      }
    });
  }

  // Araç klima tiplerini getiren fonksiyon
  getAirConditionings(): void {
    this.vehicleService.getAirConditionings().subscribe({
      next: (response) => {
        this.airConditionings = response; // Gelen klima tiplerini listeye ata
      },
      error: (error) => {
        console.error('Araç klima tipleri alınırken hata oluştu:', error);
      }
    });
  }

  // Özellik kontrollerini başlatan fonksiyon
  initFeatureControls(): void {
    const featureControls = this.availableFeatures.map(() => this.fb.control(false)); // Özellikler için form kontrolleri oluştur
    this.vehicleSearchForm.setControl('vehicleFeatures', this.fb.array(featureControls)); // Form kontrollerini form grubu içinde ayarla
  }

  // Mevcut özellikleri getiren fonksiyon
  getAvailableFeatures(): void {
    this.vehicleService.getVehicleFeatures().subscribe({
      next: (response) => {
        this.availableFeatures = response; // Gelen özellikleri listeye ata
        const featureControls = this.availableFeatures.map(() => this.fb.control(false)); // Özellikler için form kontrolleri oluştur
        this.vehicleSearchForm.setControl('vehicleFeatures', this.fb.array(featureControls)); // Form kontrollerini form grubu içinde ayarla
      },
      error: (error) => {
        console.error('Özellikler alınırken hata oluştu:', error);
      }
    });
  }

  // Formu başlatan fonksiyon
  initializeForm(): void {
    const previousState = this.formStateService.getFormState(); // Önceki form durumunu al
    if (previousState) {
      this.vehicleSearchForm.setValue(previousState); // Eğer önceki form durumu varsa, formu bu değerlerle doldur
    } else {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const features = this.availableFeatures.map(() => false);
      this.vehicleSearchForm.setControl('vehicleFeatures', this.fb.array(features.map(feature => this.fb.control(feature))));

      const defaultLocationId = this.locations.length > 0 ? this.locations[0].locationId : null;

      this.vehicleSearchForm.setValue({
        departureLocationId: this.departureLocationId || this.locations[0]?.locationId,
        arrivalLocationId: this.arrivalLocationId || this.locations[0]?.locationId,
        rentalDate: this.rentalDate || this.formatDate(tomorrow),
        returnDate: this.returnDate || this.formatDate(dayAfterTomorrow),
        minModelYear: '',
        maxModelYear: '',
        brandId: 0,
        modelId: 0,
        vehicleTypeId: 0,
        gearTypeId: 0,
        fuelTypeId: 0,
        airConditioningId: 0,
        minDailyRentalFee: '',
        maxDailyRentalFee: '',
        featureIds: [],
        color: '',
        minNumberOfPeople: 0,
        maxNumberOfPeople: 0,
        minNumberOfDoors: 0,
        maxNumberOfDoors: 0,
        locationId: defaultLocationId,
        vehicleFeatures: features,
        sortOrder: 'priceAsc',
      });
    }
  }

  // Yıl seçeneklerini üreten fonksiyon
  generateYears(currentYear: number, range: number): number[] {
    return Array.from({ length: range }, (_, i) => currentYear - i); // Son 20 yılı içeren bir dizi döndür
  }

  // Form verilerini hazırlayan fonksiyon
  prepareFormData(formValues: any): any {
    return {
      sortOrder: formValues.sortOrder, // Sıralama tercihini ekle
      brandId: formValues.brandId || null,
      modelId: formValues.modelId || null,
      vehicleTypeId: formValues.vehicleTypeId || null,
      gearTypeId: formValues.gearTypeId || null,
      fuelTypeId: formValues.fuelTypeId || null,
      airConditioningId: formValues.airConditioningId || null,
      featureIds: formValues.featureIds.length > 0 ? formValues.featureIds : null,
      color: formValues.color || null,
      minNumberOfPeople: formValues.minNumberOfPeople || null,
      maxNumberOfPeople: formValues.maxNumberOfPeople || null,
      minNumberOfDoors: formValues.minNumberOfDoors || null,
      maxNumberOfDoors: formValues.maxNumberOfDoors || null,
      locationId: formValues.departureLocationId || null,
      rentalDate: formValues.rentalDate ? new Date(formValues.rentalDate).toISOString() : null,
      returnDate: formValues.returnDate ? new Date(formValues.returnDate).toISOString() : null,
      minModelYear: formValues.minModelYear ? Number(formValues.minModelYear) : null,
      maxModelYear: formValues.maxModelYear ? Number(formValues.maxModelYear) : null,
      minDailyRentalFee: formValues.minDailyRentalFee ? Number(formValues.minDailyRentalFee) : null,
      maxDailyRentalFee: formValues.maxDailyRentalFee ? Number(formValues.maxDailyRentalFee) : null,
    };
  }

  // Araç detaylarına gitme işlemi
  goToVehicleDetails(vehicle: Vehicle): void {
    this.router.navigate(['/cars/details'], {
      state: {
        departureLocationId: this.vehicleSearchForm.value.departureLocationId,
        rentalDate: this.vehicleSearchForm.value.rentalDate,
        returnDate: this.vehicleSearchForm.value.returnDate,
        arrivalLocationId: this.vehicleSearchForm.value.arrivalLocationId,
        vehicleId: vehicle.vehicleId
      }
    });
    window.scrollTo(0, 0);
  }

  // Hata mesajı gösteren fonksiyon
  private showErrorAlert(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Dikkat!',
      html: errorMessage,
    });
  }

  // Fiyatı biçimlendiren fonksiyon
  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price);
  }

  // Bileşen yok edildiğinde çağrılan fonksiyon
  ngOnDestroy(): void {
    this.destroy$.next(); // Bileşen yok edildiğinde Subject'e yayın yap
    this.destroy$.complete(); // Subject'i tamamla
  }

  // Kullanıcının giriş yapıp yapmadığını kontrol eden fonksiyon
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  vehicleSuggest(): void {
    if (!this.vehicles || this.vehicles.length === 0) {
      this.showErrorAlert("Önerebilecek bir araç bulunamadı!<br>Araç listesi boş.");
      return;
    }

    if (!this.isLoggedIn()) {
      this.showErrorAlert("Bu özelliği kullanabilmek için üye girişi yapmanız gerekmektedir.");
      return;
    }

    var userId = this.authService.getUserId();
    if (userId) {
 
      this.accountService.getUser(userId).subscribe({
        next : (data) => {

// Mevcut verileri JSON formatına dönüştürmek için
const userInfo = {
  firstName: data.userPersonalInfo?.firstName,
  gender: data.userPersonalInfo?.genderCode === 1 ? "man" : "woman",
  dateOfBirth: data.userPersonalInfo?.dateOfBirth,
  driverLicenseIssueDate: data.userLicenseInfo?.driverLicenseIssueDate
};

// this.vehicles ve userInfo'yu birleştir
const combinedData = {
  vehicles: this.vehicles,
  user: userInfo,
  request: this.vehicleSearchForm.value.request
};

// Birleştirilmiş nesneyi JSON olarak konsola yazdır
console.log(JSON.stringify(combinedData, null, 2));

        }
      });
    };
  }
}
