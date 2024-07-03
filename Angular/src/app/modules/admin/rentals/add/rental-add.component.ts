import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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
  selector: 'app-rental-add',
  templateUrl: './rental-add.component.html',
  styleUrls: ['./rental-add.component.css']
})
export class RentalAddComponent implements OnInit {
  rentalForm!: FormGroup; // Kiralama formunu tutar
  locations!: Locations[]; // Lokasyon bilgilerini tutar
  availableProducts: AdditionalRentalProduct[] = []; // Mevcut ek kiralama ürünlerini tutar
  vehicles: any[] = []; // Araç bilgilerini tutar
  noVehiclesAvailable: boolean = false; // Araçların mevcut olup olmadığını kontrol eder

  constructor(
    private fb: FormBuilder, // FormBuilder servisini kullanır
    private toastr: ToastrService, // Toastr servisini kullanır
    private rentalService: RentalService, // Kiralama servisini kullanır
    private accountService: AccountService, // Hesap servisini kullanır
    private vehicleService: VehicleService // Araç servisini kullanır
  ) {
    this.initializeForm(); // Formu başlatır
  }

  ngOnInit(): void {
    this.getAllLocations(); // Tüm lokasyonları alır
    this.getAvailableProducts(); // Mevcut ürünleri alır
  }

  initializeForm(): void {
    this.rentalForm = this.fb.group({
      vehiclePlate: ['', Validators.required], // Araç plaka alanı
      userTCNumber: ['', Validators.required], // Kullanıcı TC numarası alanı
      departureLocationId: ['', Validators.required], // Kalkış lokasyonu alanı
      arrivalLocationId: ['', Validators.required], // Varış lokasyonu alanı
      rentalDate: ['', Validators.required], // Kiralama tarihi alanı
      returnDate: ['', Validators.required], // İade tarihi alanı
      requestDate: [new Date(), Validators.required], // İstek tarihi alanı
      status: ['', Validators.required], // Durum alanı
      additionalProducts: this.fb.array([]) // Ek kiralama ürünleri için FormArray
    });
  }

  get additionalProducts(): FormArray {
    return this.rentalForm.get('additionalProducts') as FormArray; // Ek kiralama ürünlerini FormArray olarak döner
  }

  getAllLocations(): void {
    this.rentalService.getAllLocations().subscribe({
      next: (data) => {
        this.locations = data; // Lokasyon bilgilerini ayarlar
      },
      error: (error) => {
        console.error("Konumlar yüklenirken hata oluştu:", error); // Hata durumunda konsola yazdırır
      }
    });
  }

  getAvailableProducts(): void {
    this.rentalService.getAdditionalRentalProducts().subscribe({
      next: (data) => {
        this.availableProducts = data; // Mevcut ek kiralama ürünlerini ayarlar
        this.initProductControls(); // Ürün kontrollerini başlatır
      },
      error: (error) => {
        console.error("Ürünler yüklenirken hata oluştu:", error); // Hata durumunda konsola yazdırır
      }
    });
  }

  initProductControls(): void {
    const productControls = this.availableProducts.map(() => this.fb.control(false)); // Her ürün için bir kontrol oluşturur
    this.additionalProducts.clear(); // Mevcut kontrolleri temizler
    productControls.forEach(control => this.additionalProducts.push(control)); // Yeni kontrolleri ekler
  }

  submitForm(): void {
    const formData = this.rentalForm.value; // Form verilerini alır
    let additionalProductIds: number[] = []; // Ek kiralama ürün ID'lerini tutar

    if (Array.isArray(formData.additionalProducts)) {
      additionalProductIds = formData.additionalProducts
        .map((selected: boolean, index: number) => selected ? this.availableProducts[index].additionalRentalProductId : null)
        .filter((id: number | null) => id !== null) as number[]; // Seçilen ürünlerin ID'lerini filtreler
    } else {
      console.error("Ek ürünler bir dizi değildir veya tanımsızdır", formData.additionalProducts); // Hata durumunda konsola yazdırır
    }

    // Yerel tarih ve saati ISO formatında UTC'ye çevirir
    const localDate = new Date();
    const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));

    function toUTCDate(dateString: string): Date {
      const date = new Date(dateString);
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      return utcDate;
    }

    const rentalDateUTC = toUTCDate(formData.rentalDate); // Kiralama tarihini UTC'ye çevirir
    const returnDateUTC = toUTCDate(formData.returnDate); // İade tarihini UTC'ye çevirir

    const rentalData: Rental = {
      userId: formData.userId, // Kullanıcı ID'sini ayarlar
      vehicleId: formData.vehicleId, // Araç ID'sini ayarlar
      rentalDate: rentalDateUTC, // Kiralama tarihini ayarlar
      returnDate: returnDateUTC, // İade tarihini ayarlar
      departureLocationId: formData.departureLocationId, // Kalkış lokasyonu ID'sini ayarlar
      arrivalLocationId: formData.arrivalLocationId, // Varış lokasyonu ID'sini ayarlar
      requestDate: utcDate, // İstek tarihini UTC olarak ayarlar
      status: formData.status // Durumu ayarlar
    };

    const rentalRequestModel: RentalRequestModel = {
      rental: rentalData, // Kiralama verilerini ayarlar
      additionalProductIds: additionalProductIds.map(id => id.toString()) // Ek ürün ID'lerini string dizisine çevirir
    };

    if (this.rentalForm.valid) {
      const tcNumber = this.rentalForm.get('userTCNumber')!.value; // Kullanıcı TC numarasını alır
      const vehiclePlate = this.rentalForm.get('vehiclePlate')!.value; // Araç plakasını alır
      const tcToUser$ = this.accountService.getTCtoUser(tcNumber); // TC numarasına göre kullanıcıyı alır
      const plateToVehicle$ = this.vehicleService.getVehicleByPlate(vehiclePlate); // Plakaya göre aracı alır

      forkJoin([tcToUser$, plateToVehicle$]).pipe(
        switchMap(([user, vehicle]: [User, Vehicle]) => {
          rentalRequestModel.rental.userId = user.userId; // Kullanıcı ID'sini ayarlar
          rentalRequestModel.rental.vehicleId = vehicle.vehicleId; // Araç ID'sini ayarlar
          return this.rentalService.createRental(rentalRequestModel); // Kiralama oluşturur
        })
      ).subscribe({
        next: () => {
          this.toastr.success("Yeni kiralama başarıyla oluşturuldu!"); // Başarılı bildirim gösterir
          this.rentalForm.reset({
            requestDate: new Date(),
            additionalProducts: this.fb.array([]) // Formu sıfırlar
          });
          this.initProductControls(); // Ürün kontrollerini yeniden başlatır
        },
        error: (error: HttpErrorResponse) => {
          console.error("Yeni kiralama oluşturulamadı", error); // Hata durumunda konsola yazdırır

          if (error.error instanceof ErrorEvent) {
            console.error('Client-side error:', error.error.message); // İstemci tarafı hatası
            this.toastr.error(`Client-side error: ${error.error.message}`); // Bildirim gösterir
          } else {
            console.error(`Server-side error: ${error.status} - ${error.message}`); // Sunucu tarafı hatası
            console.error('Error details:', JSON.stringify(error.error, null, 2)); // Hata detaylarını konsola yazdırır

            if (error.status === 400 && error.error) {
              if (Array.isArray(error.error)) {
                error.error.forEach((err: any) => {
                  this.toastr.error(err.errorMessage); // Bildirim gösterir
                });
              } else if (error.error.errors) {
                for (const key in error.error.errors) {
                  if (error.error.errors.hasOwnProperty(key)) {
                    error.error.errors[key].forEach((message: string) => {
                      this.toastr.error(message); // Bildirim gösterir
                    });
                  }
                }
              } else {
                this.toastr.error(error.error); // Bildirim gösterir
              }
            } else {
              this.toastr.error("Yeni kiralama oluşturulamadı. Lütfen formu kontrol edip tekrar deneyin."); // Bildirim gösterir
            }
          }
        }
      });
    } else {
      this.toastr.error("Lütfen tüm gerekli alanları doldurun."); // Bildirim gösterir
    }
  }

  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price); // Fiyatı formatlar
  }
}
