import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { RentalService } from '../../../services/rental.service';
import { VehicleService } from '../../../services/vehicle.service';
import { forkJoin } from 'rxjs';
import { AdditionalRentalProduct, AdditionalRentalProductAssignment, Rental, RentalRequestModel } from '../../../models/rental.model';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-rental-pay', // Bu bileşenin HTML etiket adı
  templateUrl: './rental-pay.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrl: './rental-pay.component.css' // Bileşen için kullanılan stil dosyasının yolu
})
export class RentalPayComponent implements OnInit {
  paymentForm: FormGroup; // Ödeme formu

  // Form kontrol isimlerini Türkçe olarak tanımlayan nesne
  controlNames: { [key: string]: string } = {
    cardNumber: 'kart numarası',
    expirationDate: 'son kullanma tarihi',
    cardHolderName: 'ad soyad',
    cvc: 'CVC'
  };

  additionalProducts!: AdditionalRentalProduct[]; // Ek kiralama ürünleri
  vehicleImageUrl?: string; // Araç görüntü URL'si
  vehicleBrandName?: string; // Araç markası
  vehicleModelName?: string; // Araç modeli
  vehicleModelYear!: number; // Araç model yılı
  baseRentalPrice!: number; // Temel kiralama fiyatı
  additionalProductsTotal!: number; // Ek ürünlerin toplam fiyatı
  userId?: number; // Kullanıcı ID'si
  vehicleId!: number; // Araç ID'si
  rentalDate?: string; // Kiralama tarihi
  returnDate?: string; // İade tarihi
  departureLocationId?: number; // Kalkış lokasyonu ID'si
  arrivalLocationId?: number; // Varış lokasyonu ID'si
  departureLocationName?: string; // Kalkış lokasyonu adı
  arrivalLocationName?: string; // Varış lokasyonu adı
  status?: string; // Kiralama durumu
  additionalProductIds?: number[]; // Ek ürün ID'leri
  dateDifference?: number; // Tarih farkı (gün cinsinden)

  constructor(
    private fb: FormBuilder, // FormBuilder servisini enjekte et
    private router: Router, // Router servisini enjekte et
    private rentalService: RentalService, // RentalService servisini enjekte et
    private vehicleService: VehicleService, // VehicleService servisini enjekte et
    private toastr: ToastrService // Toastr servisini enjekte et
  ) {
    // Ödeme formunu oluştur ve validasyon ekle
    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expirationDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{4}$/)]],
      cardHolderName: ['', Validators.required],
      cvc: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
    });

    // Router state ile gelen verileri al
    const routerState = this.router.getCurrentNavigation()?.extras.state as { rentalData: any };
    if (routerState && routerState.rentalData) {
      this.userId = routerState.rentalData.userId;
      this.vehicleId = routerState.rentalData.vehicleId;
      this.rentalDate = routerState.rentalData.rentalDate;
      this.returnDate = routerState.rentalData.returnDate;
      this.departureLocationId = routerState.rentalData.departureLocationId;
      this.arrivalLocationId = routerState.rentalData.arrivalLocationId;
      this.status = routerState.rentalData.status;
      this.baseRentalPrice = routerState.rentalData.baseRentalPrice;
      this.additionalProductsTotal = routerState.rentalData.additionalProductsTotal;
      this.additionalProductIds = routerState.rentalData.additionalProductIds;
      this.dateDifference = this.calculateDateDifference(this.rentalDate!, this.returnDate!);
    }
  }

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    // Eğer araç ID'si yoksa, ana sayfaya yönlendir
    if (!this.vehicleId) {
      console.log("Araç bilgisi alınamadı!"); // Hata mesajı
      this.router.navigate(['/']); // Ana sayfaya yönlendir
      return;
    }

    // Kalkış ve varış lokasyon isimlerini al
    this.rentalService.getLocations(this.departureLocationId!).subscribe(location => {
      this.departureLocationName = location.locationName;
    });

    this.rentalService.getLocations(this.arrivalLocationId!).subscribe(location => {
      this.arrivalLocationName = location.locationName;
    });

    // Araç bilgilerini al
    this.vehicleService.getVehicleById(this.vehicleId).subscribe(data => {
      this.vehicleBrandName = data.brand.brandName;
      this.vehicleModelName = data.model.modelName;
      this.vehicleModelYear = data.modelYear;
      this.vehicleImageUrl = data.vehicleImages[0].vehicleImageUrl;
    });

    // Ek ürün bilgilerini al
    const productObservables = this.additionalProductIds!.map(id =>
      this.rentalService.getAdditionalRentalProduct(id)
    );

    forkJoin(productObservables).subscribe(products => {
      this.additionalProducts = products;
    });
  }

  // Tarih farkını (gün cinsinden) hesaplayan fonksiyon
  calculateDateDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInTime = end.getTime() - start.getTime();
    return differenceInTime / (1000 * 3600 * 24);
  }

  // Tarihi YYYY-MM-DD formatında biçimlendiren fonksiyon
  formatDate(date: string): string {
    const d = new Date(date);
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Fiyatı biçimlendiren fonksiyon
  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price);
  }

  // Formu gönderme işlemi
  submitForm(): void {
    // Öncelikle formun geçerli olup olmadığını kontrol edelim.
    if (this.paymentForm.valid) {
      // Form geçerliyse, kullanıcıdan onay alalım.
      Swal.fire({
        title: 'Emin misiniz?',
        text: 'Ödemeyi gerçekleştirmek istediğinize emin misiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Evet, ödeme yap!',
        cancelButtonText: 'Hayır, iptal et'
      }).then((result) => {
        if (result.isConfirmed) {
          // Kullanıcı onay verdiyse, işlemi gerçekleştirelim.
          this.processFormSubmission();
        }
      });
    } else {
      // Form geçerli değilse, hataları kullanıcıya gösterelim.
      for (const control in this.paymentForm.controls) {
        if (this.paymentForm.controls[control].invalid) {
          const controlName = this.controlNames[control] || control;
          this.showError(`Lütfen geçerli bir ${controlName} girin.`);
        }
      }
    }
  }

  // Form gönderim işlemini gerçekleştiren fonksiyon
  processFormSubmission(): void {
    // Kiralama verilerini hazırla
    const rentalData: Rental = {
      userId: this.userId!,
      vehicleId: this.vehicleId,
      rentalDate: this.toUTCDate(this.rentalDate!),
      returnDate: this.toUTCDate(this.returnDate!),
      departureLocationId: this.departureLocationId!,
      arrivalLocationId: this.arrivalLocationId!,
      requestDate: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)),
      status: this.status!
    };

    // Kiralama istek modelini hazırla
    const rentalRequestModel: RentalRequestModel = {
      rental: rentalData,
      additionalProductIds: this.additionalProductIds ? this.additionalProductIds.map(String) : [] // Eğer undefined ise boş dizi atar
    };
    
    // Kiralama oluşturma isteğini gönder
    this.rentalService.createRental(rentalRequestModel).subscribe({
      next: (response) => {
        // Kiralama başarılı olduğunda, ödeme işlemine geç.
        const paymentData = {
          rentalId: response.rentalId,
          paymentAmount: this.baseRentalPrice + this.additionalProductsTotal,
          paymentMethod: 'CreditCard',
          paymentStatus: 'Completed'
        };

        // Ödeme oluşturma isteğini gönder
        this.rentalService.createPayment(paymentData).subscribe({
          next: (paymentResponse) => {
            // Ödeme başarılı olduğunda, teşekkür sayfasına yönlendir.
            this.router.navigate(['/cars/thanks'], {
              state: { rentalId: response.rentalId, paymentId: paymentResponse.paymentId }
            });
            window.scrollTo(0, 0);
          },
          error: (paymentError) => {
            console.error("Ödeme işlemi başarısız oldu", paymentError);
            this.toastr.error('Ödeme işlemi sırasında bir hata oluştu.', 'Ödeme Hatası!');
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error("Yeni kiralama oluşturulamadı", error);

        if (error.error instanceof ErrorEvent) {
          console.error('Client-side error:', error.error.message);
          this.toastr.error(`Client-side error: ${error.error.message}`);
        } else {
          console.error(`Server-side error: ${error.status} - ${error.message}`);
          console.error('Error details:', JSON.stringify(error.error, null, 2));

          if (error.status === 400 && error.error) {
            if (Array.isArray(error.error)) {
              error.error.forEach((err: any) => {
                this.toastr.error(err.errorMessage);
              });
            } else if (error.error.errors) {
              for (const key in error.error.errors) {
                if (error.error.errors.hasOwnProperty(key)) {
                  error.error.errors[key].forEach((message: string) => {
                    this.toastr.error(message);
                  });
                }
              }
            } else {
              this.toastr.error(error.error);
            }
          } else {
            this.toastr.error("Yeni kiralama oluşturulamadı. Lütfen formu kontrol edip tekrar deneyin.");
          }
        }
      }
    });
  }

  // Tarih stringini UTC tarihine dönüştüren fonksiyon
  private toUTCDate(dateString: string): Date {
    const date = new Date(dateString);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  // Hata mesajı gösteren fonksiyon
  private showError(message: string) {
    this.toastr.error(message, 'Hata!', { progressBar: true, enableHtml: true });
  }
}
