import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RentalService } from '../../../../services/rental.service';
import { AccountService } from '../../../../services/account.service';
import { Locations } from '../../../../models/location.model';
import { forkJoin, switchMap } from 'rxjs';
import { User } from '../../../../models/user.model';
import { Vehicle } from '../../../../models/vehicle.model';
import { AdditionalRentalProduct, Rental, RentalRequestModel } from '../../../../models/rental.model';
import { VehicleService } from '../../../../services/vehicle.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-rental-edit',
  templateUrl: './rental-edit.component.html',
  styleUrls: ['./rental-edit.component.css']
})
export class RentalEditComponent implements OnInit {
  rentalForm!: FormGroup; // Kiralama formunu tutar
  locations!: Locations[]; // Lokasyon verilerini tutar
  availableProducts: AdditionalRentalProduct[] = []; // Mevcut ek kiralama ürünlerini tutar
  selectedProductIds: number[] = []; // Seçilen ek kiralama ürünlerinin ID'lerini tutar
  rentalId!: number; // Düzenlenecek kiralamanın ID'sini tutar

  constructor(
    private fb: FormBuilder, // Form oluşturucu servisi
    private toastr: ToastrService, // Bildirim servisi
    private rentalService: RentalService, // Kiralama servisi
    private accountService: AccountService, // Hesap servisi
    private vehicleService: VehicleService, // Araç servisi
    private route: ActivatedRoute // Aktif rota bilgisi
  ) {
    this.initializeForm(); // Formu başlatma işlemi
  }

  ngOnInit(): void {
    this.rentalId = +this.route.snapshot.params['id']; // URL'den kiralama ID'sini alır
    this.getAllLocations(); // Tüm lokasyonları yükler
    this.loadRentalData(); // Kiralama verilerini yükler
    this.loadAdditionalProductsForRental(this.rentalId); // Kiralamaya ait ek ürünleri yükler
  }

  initializeForm(): void {
    // Kiralama formunu oluşturur ve gerekli alanları belirler
    this.rentalForm = this.fb.group({
      vehiclePlate: ['', Validators.required], // Araç plakası alanı, gerekli
      userTCNumber: ['', Validators.required], // Kullanıcı TC numarası alanı, gerekli
      departureLocationId: ['', Validators.required], // Başlangıç lokasyonu alanı, gerekli
      arrivalLocationId: ['', Validators.required], // Varış lokasyonu alanı, gerekli
      rentalDate: ['', Validators.required], // Kiralama tarihi alanı, gerekli
      returnDate: ['', Validators.required], // İade tarihi alanı, gerekli
      requestDate: [new Date(), Validators.required], // Talep tarihi alanı, gerekli
      status: ['', Validators.required], // Durum alanı, gerekli
      additionalProducts: this.fb.array([]) // Ek kiralama ürünleri alanı
    });
  }

  get additionalProducts(): FormArray {
    // Ek kiralama ürünleri form dizisini döndürür
    return this.rentalForm.get('additionalProducts') as FormArray;
  }

  getAllLocations(): void {
    // Tüm lokasyonları yükler
    this.rentalService.getAllLocations().subscribe({
      next: (data) => {
        this.locations = data; // Lokasyon verilerini atar
      },
      error: (error) => {
        console.error("Konumlar yüklenirken hata oluştu:", error); // Hata durumunda konsola yazdırır
        this.toastr.error("Konum verileri yüklenemedi."); // Bildirim gösterir
      }
    });
  }

  loadAdditionalProductsForRental(rentalId: number): void {
    // Kiralamaya ait ek ürünleri yükler
    this.rentalService.getAdditionalProductsForRental(rentalId).subscribe({
      next: (data) => {
        this.selectedProductIds = data.map(p => p.additionalRentalProductId); // Seçilen ek ürünlerin ID'lerini alır
        this.getAvailableProducts(); // Mevcut ek ürünleri yükler
      },
      error: (error) => {
        console.error("Bu kiralamanın ek ürün verileri yüklenemedi:", error); // Hata durumunda konsola yazdırır
        this.toastr.error("Ek ürün verileri yüklenemedi"); // Bildirim gösterir
      }
    });
  }

  getAvailableProducts(): void {
    // Mevcut ek ürünleri yükler
    this.rentalService.getAdditionalRentalProducts().subscribe({
      next: (data) => {
        this.availableProducts = data; // Ek ürün verilerini atar
        this.initProductControls(); // Ek ürün kontrollerini başlatır
      },
      error: (error) => {
        console.error("Ürün verileri yüklenirken hata oluştu:", error); // Hata durumunda konsola yazdırır
        this.toastr.error("Ürün verileri yüklenemedi."); // Bildirim gösterir
      }
    });
  }

  initProductControls(): void {
    // Ek ürün form kontrollerini başlatır
    const productControls = this.availableProducts.map(product =>
      this.fb.control(this.selectedProductIds.includes(product.additionalRentalProductId))
    );
    this.additionalProducts.clear(); // Mevcut kontrolleri temizler
    productControls.forEach(control => this.additionalProducts.push(control)); // Yeni kontrolleri ekler
  }

  loadRentalData(): void {
    // Kiralama verilerini yükler
    function toUTCDate(dateString: string): Date {
      const date = new Date(dateString);
      return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)); // Tarihi UTC formatına dönüştürür
    }
    
    function formatDateToYYYYMMDD(date: Date): string {
      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      return `${year}-${month}-${day}`; // Tarihi YYYY-MM-DD formatına dönüştürür
    }

    this.rentalService.getRentalById(this.rentalId).subscribe({
      next: (rental: any) => {
        const rentalDateUTC = rental.rentalDate ? formatDateToYYYYMMDD(new Date(rental.rentalDate)) : ''; // Kiralama tarihini UTC formatına dönüştürür
        const returnDateUTC = rental.returnDate ? formatDateToYYYYMMDD(new Date(rental.returnDate)) : ''; // İade tarihini UTC formatına dönüştürür
        this.rentalForm.patchValue({
          departureLocationId: rental.departureLocationId, // Başlangıç lokasyonunu atar
          arrivalLocationId: rental.arrivalLocationId, // Varış lokasyonunu atar
          rentalDate: rentalDateUTC, // Kiralama tarihini atar
          returnDate: returnDateUTC, // İade tarihini atar
          requestDate: rental.requestDate, // Talep tarihini atar
          status: rental.status // Durumunu atar
        });
        this.loadUserAndVehicle(rental.userId, rental.vehicleId); // Kullanıcı ve araç verilerini yükler
      },
      error: (error) => {
        console.error("Kiralama verileri yüklenirken hata oluştu:", error); // Hata durumunda konsola yazdırır
        this.toastr.error("Kiralama verileri yüklenemedi."); // Bildirim gösterir
      }
    });
  }

  loadUserAndVehicle(userId: number, vehicleId: number): void {
    // Kullanıcı ve araç verilerini yükler
    this.accountService.getUser(userId).subscribe({
      next: (user: any) => {
        this.rentalForm.patchValue({
          userTCNumber: user.tcNumber // Kullanıcı TC numarasını form değerine atar
        });
      },
      error: (error) => {
        console.error("Kullanıcı verileri yüklenirken hata oluştu:", error); // Hata durumunda konsola yazdırır
        this.toastr.error("Kullanıcı verileri yüklenemedi."); // Bildirim gösterir
      }
    });

    this.vehicleService.getVehicleById(vehicleId).subscribe({
      next: (vehicle: any) => {
        if (vehicle && vehicle.numberPlate) {
          this.rentalForm.patchValue({
            vehiclePlate: vehicle.numberPlate // Araç plakasını form değerine atar
          });
       } else {
          console.error('Araç nesnesinde plaka mevcut değil veya geçersiz'); // Araç plakası mevcut değilse hata verir
        }
      },
      error: (error) => {
        console.error("Araç verileri yüklenirken hata oluştu:", error); // Hata durumunda konsola yazdırır
      }
    });
  }

  submitForm(): void {
    // Formu gönderir
    const formData = this.rentalForm.value; // Form verilerini alır
    let additionalProductIds: number[] = [];

    if (Array.isArray(formData.additionalProducts)) {
      additionalProductIds = formData.additionalProducts
        .map((selected: boolean, index: number) => selected ? this.availableProducts[index].additionalRentalProductId : null)
        .filter((id: number | null) => id !== null) as number[]; // Seçilen ek ürün ID'lerini filtreler
    } else {
      console.error("Ek ürünler bir dizi değildir veya tanımsızdır.", formData.additionalProducts); // Hata durumunda konsola yazdırır
    }

    const localDate = new Date();
    const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000)); // Yerel tarihi UTC'ye dönüştürür

    function toUTCDate(dateString: string): Date {
      const date = new Date(dateString);
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      return utcDate; // Tarihi UTC formatına dönüştürür
    }

    const rentalDateUTC = toUTCDate(formData.rentalDate); // Kiralama tarihini UTC'ye dönüştürür
    const returnDateUTC = toUTCDate(formData.returnDate); // İade tarihini UTC'ye dönüştürür

    const rentalData: Rental = {
      rentalId: this.rentalId, // Kiralama ID'sini atar
      userId: 0, // Kullanıcı ID'si daha sonra atanacak
      vehicleId: 0, // Araç ID'si daha sonra atanacak
      rentalDate: rentalDateUTC, // Kiralama tarihini atar
      returnDate: returnDateUTC, // İade tarihini atar
      departureLocationId: formData.departureLocationId, // Başlangıç lokasyonunu atar
      arrivalLocationId: formData.arrivalLocationId, // Varış lokasyonunu atar
      requestDate: utcDate, // Talep tarihini atar
      status: formData.status // Durumunu atar
    };

    const rentalRequestModel: RentalRequestModel = {
      rental: rentalData, // Kiralama verilerini atar
      additionalProductIds: additionalProductIds.map(id => id.toString()) // Ek ürün ID'lerini stringe dönüştürür
    };

    if (this.rentalForm.valid) {
      const tcNumber = this.rentalForm.get('userTCNumber')!.value; // Kullanıcı TC numarasını alır
      const vehiclePlate = this.rentalForm.get('vehiclePlate')!.value; // Araç plakasını alır
      const tcToUser$ = this.accountService.getTCtoUser(tcNumber); // TC numarasına göre kullanıcıyı getirir
      const plateToVehicle$ = this.vehicleService.getVehicleByPlate(vehiclePlate); // Plakaya göre aracı getirir

      forkJoin([tcToUser$, plateToVehicle$]).pipe(
        switchMap(([user, vehicle]: [User, Vehicle]) => {
          rentalRequestModel.rental.userId = user.userId; // Kullanıcı ID'sini atar
          rentalRequestModel.rental.vehicleId = vehicle.vehicleId; // Araç ID'sini atar

          return this.rentalService.updateRental(this.rentalId, rentalRequestModel); // Kiralamayı günceller
        })
      ).subscribe({
        next: () => {
          this.toastr.success("Kiralama başarıyla güncellendi!"); // Başarı bildirimi gösterir
          this.rentalForm.reset({
            requestDate: new Date(), // Talep tarihini sıfırlar
            additionalProducts: this.fb.array([]) // Ek ürünleri sıfırlar
          });
          this.initProductControls(); // Ek ürün kontrollerini başlatır
        },
        error: (error: HttpErrorResponse) => {
          console.error("Kiralama güncellenemedi", error); // Hata durumunda konsola yazdırır

          if (error.error instanceof ErrorEvent) {
            console.error('Client-side error:', error.error.message); // İstemci tarafı hatası
            this.toastr.error(`Client-side error: ${error.error.message}`); // Bildirim gösterir
          } else {
            console.error(`Server-side error: ${error.status} - ${error.message}`); // Sunucu tarafı hatası
            console.error('Error details:', JSON.stringify(error.error, null, 2)); // Hata detaylarını JSON formatında yazdırır

            if (error.status === 400 && error.error) {
              if (Array.isArray(error.error)) {
                error.error.forEach((err: any) => {
                  this.toastr.error(err.errorMessage); // Hata mesajını gösterir
                });
              } else if (error.error.errors) {
                for (const key in error.error.errors) {
                  if (error.error.errors.hasOwnProperty(key)) {
                    error.error.errors[key].forEach((message: string) => {
                      this.toastr.error(message); // Hata mesajını gösterir
                    });
                  }
                }
              } else {
                this.toastr.error(error.error); // Hata mesajını gösterir
              }
            } else {
              this.toastr.error("Kiralama güncellenemedi. Lütfen formu kontrol edip tekrar deneyin."); // Genel hata mesajı
            }
          }
        }
      });
    } else {
      this.toastr.error("Lütfen tüm gerekli alanları doldurun."); // Formun eksik doldurulduğunu bildirir
    }
  }

  formatPrice(price: number): string {
    // Fiyatı formatlar
    return this.vehicleService.formatPrice(price);
  }
}
