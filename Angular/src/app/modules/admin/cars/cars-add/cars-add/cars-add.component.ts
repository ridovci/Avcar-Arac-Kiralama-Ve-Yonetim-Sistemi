import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../../services/confirm.service';
import { VehicleService } from '../../../../../services/vehicle.service';
import { ToastrService } from 'ngx-toastr';

interface VehicleFeature {
  vehicleFeatureId: number;
  vehicleFeatureName: string;
}

@Component({
  selector: 'app-cars-add',
  templateUrl: './cars-add.component.html',
  styleUrls: ['./cars-add.component.css']
})
export class CarsAddComponent implements OnInit {
  vehicleForm: FormGroup; // Araç ekleme formu
  brands: any[] = []; // Marka bilgilerini tutar
  models: any[] = []; // Model bilgilerini tutar
  vehicleTypes: any[] = []; // Araç tipi bilgilerini tutar
  gearTypes: any[] = []; // Vites tipi bilgilerini tutar
  fuelTypes: any[] = []; // Yakıt tipi bilgilerini tutar
  colors: any[] = []; // Renk bilgilerini tutar
  airConditionings: any[] = []; // Klima bilgilerini tutar
  locations: any[] = []; // Lokasyon bilgilerini tutar
  availableFeatures: VehicleFeature[] = []; // Mevcut özellikleri tutar

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private vehicleService: VehicleService,
    private confirmService: ConfirmService,
    private toastr: ToastrService
  ) {
    // Form grubu oluşturuluyor ve gerekli validasyonlar ekleniyor
    this.vehicleForm = this.fb.group({
      brand: ['', Validators.required],
      model: ['', Validators.required],
      modelYear: ['', [Validators.required, Validators.min(2010), Validators.max(2050)]],
      vehicleType: ['', Validators.required],
      fuelType: ['', Validators.required],
      gearType: ['', Validators.required],
      airConditioning: ['', Validators.required],
      numberOfPeople: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      numberOfDoors: ['', [Validators.required, Validators.min(2), Validators.max(5)]],
      color: ['', Validators.required],
      numberPlate: ['', Validators.required],
      location: ['', Validators.required],
      dailyRentalFee: ['', [Validators.required, Validators.pattern('^[0-9]*\\.?[0-9]+$')]],
      discountRate: ['', [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern('^[0-9]+$')]],
      minDriverAge: ['', [Validators.required, Validators.min(18), Validators.max(65)]],
      minDrivingLicenseYear: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      status: ['', Validators.required],
      description: [''],
      vehicleImages: this.fb.array([]), // Araç fotoğrafları için form array
      vehicleFeatures: this.fb.array([]) // Araç özellikleri için form array
    });
  }

  ngOnInit() {
    // Component yüklendiğinde çalışacak metodlar
    this.getBrands();
    this.getAvailableFeatures();
    this.getVehicleTypes();
    this.getGearTypes();
    this.getFuelTypes();
    this.getColors();
    this.getAirConditionings();
    this.getLocations();
    this.addImageControls();  // Fotoğraf kontrollerini başlat
    this.initFeatureControls();  // Özellik kontrollerini başlat
  }

  // Fotoğraf URL'leri için form kontrollerini başlatma
  addImageControls() {
    const imagesArray = this.vehicleForm.get('vehicleImages') as FormArray;
    for (let i = 0; i < 5; i++) {
      imagesArray.push(this.fb.control('', Validators.required)); // Zorunlu alan olarak ayarla
    }
  }

  // Form array'leri getter metodları
  get vehicleImages(): FormArray {
    return this.vehicleForm.get('vehicleImages') as FormArray;
  }

  get vehicleFeatures(): FormArray {
    return this.vehicleForm.get('vehicleFeatures') as FormArray;
  }

  // Marka bilgilerini almak için metod
  getBrands(): void {
    this.vehicleService.getBrands().subscribe({
      next: (response) => {
        this.brands = response;
      },
      error: (error) => {
        console.error('Markalar alınırken bir hata oluştu:', error);
      }
    });
  }

  // Araç tipi bilgilerini almak için metod
  getVehicleTypes(): void {
    this.vehicleService.getVehicleTypes().subscribe({
      next: (response) => {
        this.vehicleTypes = response;
      },
      error: (error) => {
        console.error('Araç Tipleri alınırken bir hata oluştu:', error);
      }
    });
  }

  // Vites tipi bilgilerini almak için metod
  getGearTypes(): void {
    this.vehicleService.getGearTypes().subscribe({
      next: (response) => {
        this.gearTypes = response;
      },
      error: (error) => {
        console.error('Vites Tipleri alınırken bir hata oluştu:', error);
      }
    });
  }

  // Yakıt tipi bilgilerini almak için metod
  getFuelTypes(): void {
    this.vehicleService.getFuelTypes().subscribe({
      next: (response) => {
        this.fuelTypes = response;
      },
      error: (error) => {
        console.error('Yakıt Tipleri alınırken bir hata oluştu:', error);
      }
    });
  }

  // Renk bilgilerini almak için metod
  getColors(): void {
    this.vehicleService.getColors().subscribe({
      next: (response) => {
        this.colors = response;
      },
      error: (error) => {
        console.error('Araç renkleri alınırken bir hata oluştu:', error);
      }
    });
  }

  // Klima tiplerini almak için metod
  getAirConditionings(): void {
    this.vehicleService.getAirConditionings().subscribe({
      next: (response) => {
        this.airConditionings = response;
      },
      error: (error) => {
        console.error('Araç klima tipleri alınırken bir hata oluştu:', error);
      }
    });
  }

  // Lokasyon bilgilerini almak için metod
  getLocations(): void {
    this.vehicleService.getLocations().subscribe({
      next: (response) => {
        this.locations = response;
      },
      error: (error) => {
        console.error('Araç lokasyonları alınırken bir hata oluştu:', error);
      }
    });
  }

  // Özellik kontrollerini başlatma
  initFeatureControls(): void {
    const featureControls = this.availableFeatures.map(() => this.fb.control(false));
    this.vehicleForm.setControl('vehicleFeatures', this.fb.array(featureControls));
  }

  // Mevcut özellikleri almak için metod
  getAvailableFeatures(): void {
    this.vehicleService.getVehicleFeatures().subscribe({
      next: (response) => {
        this.availableFeatures = response;
        const featureControls = this.availableFeatures.map(() => this.fb.control(false));
        this.vehicleForm.setControl('vehicleFeatures', this.fb.array(featureControls));
      },
      error: (error) => {
        console.error('Özellikler alınırken bir hata oluştu:', error);
      }
    });
  }

  // Özellik değişimlerini işleyen metod
  onFeatureChange(feature: any, event: any): void {
    const featureIndex = this.availableFeatures.findIndex(f => f.vehicleFeatureId === feature.vehicleFeatureId);
    if (event.target.checked) {
      this.vehicleFeatures.controls[featureIndex].setValue(true);
    } else {
      this.vehicleFeatures.controls[featureIndex].setValue(false);
    }
  }

  // Marka değişimlerinde model bilgilerini almak için metod
  onBrandChange() {
    const brandId = this.vehicleForm.get('brand')?.value;
    if (brandId) {
      this.vehicleService.getModels(brandId).subscribe(
        (models: any[]) => {
          this.models = models;
          this.vehicleForm.get('model')!.reset();
        },
        (error) => {
          this.models = [];
          console.error('Model bilgileri alınırken hata oluştu:', error);
        }
      );
    }
  }

  // Form gönderim işlemi
  submitForm() {
    if (this.vehicleForm.invalid) {
      this.displayFirstFormError();
      return;
    }

    const formData = this.vehicleForm.value;

    const vehicleFeatureAssignments = formData.vehicleFeatures
      .map((checked: boolean, index: number) => checked ? {
        vehicleFeaturesId: this.availableFeatures[index].vehicleFeatureId
      } : null)
      .filter((feature: any) => feature !== null);

    const vehicleData = {
      brandId: formData.brand,
      modelId: formData.model,  
      modelYear: formData.modelYear,
      vehicleTypeId: formData.vehicleType,  
      fuelTypeId: formData.fuelType,
      gearTypeId: formData.gearType,
      airConditioningId: formData.airConditioning,
      numberOfPeople: formData.numberOfPeople,
      numberOfDoors: formData.numberOfDoors,
      colorId: formData.color,
      numberPlate: formData.numberPlate,
      locationId: formData.location,
      dailyRentalFee: formData.dailyRentalFee,
      discountRate: formData.discountRate,
      minDriverAge: formData.minDriverAge,
      minDrivingLicenseYear: formData.minDrivingLicenseYear,
      status: formData.status,
      description: formData.description,
      vehicleImages: formData.vehicleImages.map((url: string) => ({
        vehicleImageUrl: url
      })),
      vehicleFeatureAssignments: vehicleFeatureAssignments
    };

    // API isteği gönderilir
    this.vehicleService.addVehicle(vehicleData).subscribe({
      next: (response) => {
        this.toastr.success('Araç başarıyla kaydedildi');
      },
      error: (error) => {
        if (error.status === 400 && error.error && error.error.Errors) {
          this.toastr.error('Doğrulama hataları: ' + error.error.Errors.join(', '));
        } else {
          this.toastr.error('Araç kaydedilirken bir hata oluştu');
        }
        console.error('Araç kaydedilirken bir hata oluştu:', error);
      }
    });
  }

  // Formdaki ilk hatayı gösteren metod
  private displayFirstFormError() {
    for (const key in this.vehicleForm.controls) {
      if (this.vehicleForm.controls.hasOwnProperty(key)) {
        const control = this.vehicleForm.get(key);
        if (control && control.invalid) {
          if (key === 'vehicleImages') {
            (control as FormArray).controls.forEach((imageControl, index) => {
              if (imageControl.invalid) {
                this.toastr.error(`Araç Fotoğrafı - ${index + 1} alanı gereklidir.`);
              }
            });
          } else {
            const firstErrorKey = Object.keys(control.errors!)[0];
            this.toastr.error(this.getErrorMessage(key, firstErrorKey, control.errors![firstErrorKey]));
          }
          break; // İlk hata mesajını gösterdikten sonra döngüden çık
        }
      }
    }
  }

  // Hata mesajlarını almak için metod
  private getErrorMessage(controlName: string, errorKey: string, errorValue: any): string {
    const controlNameTr = this.getControlNameTr(controlName);
    switch (errorKey) {
      case 'required':
        return `${controlNameTr} alanı gereklidir.`;
      case 'min':
        return `${controlNameTr} alanı en az ${errorValue.min} olmalıdır.`;
      case 'max':
        return `${controlNameTr} alanı en fazla ${errorValue.max} olmalıdır.`;
      case 'pattern':
        return `${controlNameTr} alanı geçersiz bir formata sahip.`;
      default:
        return `${controlNameTr} alanında hata var: ${errorKey}`;
    }
  }

  // Kontrol adlarını Türkçe'ye çevirmek için metod
  private getControlNameTr(controlName: string): string {
    const controlNames: { [key: string]: string } = {
      brand: 'Marka',
      model: 'Model',
      modelYear: 'Model Yılı',
      vehicleType: 'Araç Tipi',
      fuelType: 'Yakıt Tipi',
      gearType: 'Vites Tipi',
      airConditioning: 'Klima Tipi',
      numberOfPeople: 'Kişi Kapasitesi',
      numberOfDoors: 'Kapı Sayısı',
      color: 'Renk',
      numberPlate: 'Araç Plakası',
      location: 'Lokasyon',
      dailyRentalFee: 'Günlük Ücret',
      discountRate: 'İskonto (%)',
      minDriverAge: 'Minimum Sürücü Yaşı',
      minDrivingLicenseYear: 'Minimum Ehliyet Yaşı',
      status: 'Durum',
      description: 'Açıklama',
      vehicleImageUrl: "Araç Fotoğrafları"
    };
    return controlNames[controlName] || controlName;
  }
}
