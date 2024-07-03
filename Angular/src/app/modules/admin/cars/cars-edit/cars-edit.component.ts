import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { VehicleService } from '../../../../services/vehicle.service';

interface VehicleFeature {
  vehicleFeatureId: number;
  vehicleFeatureName: string;
}

@Component({
  selector: 'app-cars-edit',
  templateUrl: './cars-edit.component.html',
  styleUrls: ['./cars-edit.component.css']
})
export class CarsEditComponent implements OnInit {

  vehicleForm!: FormGroup;
  brands: any[] = [];
  models: any[] = [];
  vehicleTypes: any[] = [];
  gearTypes: any[] = [];
  fuelTypes: any[] = [];
  colors: any[] = [];
  airConditionings: any[] = [];
  locations: any[] = [];
  availableFeatures: VehicleFeature[] = [];
  vehicleId = this.route.snapshot.params['id'];
  
  constructor(
    private fb: FormBuilder,
    private vehicleService: VehicleService,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {

    this.initializeForm();
    this.loadInitialData(this.vehicleId);

  }

  initializeForm() {
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
      vehicleImages: this.fb.array([]),
      vehicleFeatures: this.fb.array(this.availableFeatures.map(() => this.fb.control(false)))
    });
}


loadInitialData(vehicleId: number) {
  this.vehicleService.getVehicleDetails(vehicleId).subscribe({
    next: (data) => {
      if (data) {
        const vehicle = data;

        // Tüm seçeneklerin yüklenmesi
        this.vehicleService.getBrands().subscribe(brands => {
          this.brands = brands;
          this.vehicleForm.patchValue({ brand: vehicle.brandId });
        });


        this.vehicleService.getBrands().subscribe(brands => {
          this.brands = brands;
          this.vehicleForm.patchValue({ brand: vehicle.brandId });
          // Markalar yüklendiğinde, mevcut brandId'ye göre modelleri getir
          this.loadModels(vehicle.brandId, vehicle.modelId);
        });

        this.vehicleService.getVehicleTypes().subscribe(types => {
          this.vehicleTypes = types;
          this.vehicleForm.patchValue({ vehicleType: vehicle.vehicleTypeId });
        });
      

        this.vehicleService.getGearTypes().subscribe(gearTypes => {
          this.gearTypes = gearTypes;
          this.vehicleForm.patchValue({ gearType: vehicle.gearTypeId });
        });

        this.vehicleService.getFuelTypes().subscribe(fuelTypes => {
          this.fuelTypes = fuelTypes;
          this.vehicleForm.patchValue({ fuelType: vehicle.fuelTypeId });
        });

        this.vehicleService.getColors().subscribe(colors => {
          this.colors = colors;
          this.vehicleForm.patchValue({ color: vehicle.colorId });
        });

        this.vehicleService.getAirConditionings().subscribe(airConditionings => {
          this.airConditionings = airConditionings;
          this.vehicleForm.patchValue({ airConditioning: vehicle.airConditioningId });
        });

        this.vehicleService.getLocations().subscribe(locations => {
          this.locations = locations;
          this.vehicleForm.patchValue({ location: vehicle.locationId });
        });

        this.vehicleService.getVehicleFeatures().subscribe(features => {
          this.availableFeatures = features;
          this.vehicleForm.setControl('vehicleFeatures', this.fb.array(this.availableFeatures.map(feature => this.fb.control(vehicle.vehicleFeatureAssignments.some((assignment: any) => assignment.vehicleFeaturesId === feature.vehicleFeatureId)))));
        });
        // Araç detaylarını forma atama
        this.vehicleForm.patchValue({
          modelYear: vehicle.modelYear,
          numberOfPeople: vehicle.numberOfPeople,
          numberOfDoors: vehicle.numberOfDoors,
          numberPlate: vehicle.numberPlate,
          dailyRentalFee: vehicle.dailyRentalFee,
          discountRate: vehicle.discountRate,
          minDriverAge: vehicle.minDriverAge,
          minDrivingLicenseYear: vehicle.minDrivingLicenseYear,
          status: vehicle.status,
          description: vehicle.description
        });

        // Araç özelliklerini form array olarak eklemek
        const featuresArray = this.vehicleForm.get('vehicleFeatures') as FormArray;
        if (data.vehicleFeatureAssignments) {
          data.vehicleFeatureAssignments.forEach((featureAssignment: any) => {
            featuresArray.push(this.fb.control(featureAssignment.vehicleFeaturesId));
          });
        }

        // Araç resimlerini form array olarak eklemek
        const imagesArray = this.vehicleForm.get('vehicleImages') as FormArray;
        if (vehicle.vehicleImages) {
          vehicle.vehicleImages.forEach((image: any) => {
            imagesArray.push(this.fb.control(image.vehicleImageUrl));
          });
        }
      } else {
        this.toastr.error('Araç verileri alınamadı.');
      }
    },
    error: (error) => {
      console.error('Araç detayları yüklenirken bir hata oluştu', error);
      this.toastr.error('Araç detayları yüklenirken bir hata oluştu');
    }
  });
}


loadModels(brandId: string, modelId?: number) {
  if (brandId) {
    this.models = [];

    this.vehicleService.getModels(brandId).subscribe(models => {
      this.models = models;
      if (modelId) {
        this.vehicleForm.patchValue({ model: modelId });
        this.vehicleForm.patchValue({ brand: brandId });

      }
    });
  }
}


submitForm() {
  if (this.vehicleForm.invalid) {
    this.displayFirstFormError();
    return;
  }

  const formData = this.vehicleForm.value;

  const vehicleFeatureAssignments = formData.vehicleFeatures
    .map((checked: boolean, index: number) => {
      return checked ? { vehicleFeaturesId: this.availableFeatures[index]?.vehicleFeatureId } : null;
    })
    .filter((feature: any) => feature !== null && feature.vehicleFeaturesId !== undefined);

  const vehicleData = {
    vehicleId: this.vehicleId,  // Mevcut araç ID'sini ekleyin
    brandId: formData.brand,
    modelId: formData.model,  // ModelId gönderiliyor
    modelYear: formData.modelYear,
    vehicleTypeId: formData.vehicleType,  // vehicleTypeId gönderiliyor
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
  this.vehicleService.updateVehicle(vehicleData).subscribe({
    next: (response) => {
      this.toastr.success('Araç başarıyla güncellendi');
    },
    error: (error) => {
      if (error.status === 400 && error.error && error.error.Errors) {
        this.toastr.error('Doğrulama hataları: ' + error.error.Errors.join(', '));
      } else {
        this.toastr.error('Araç güncellenirken bir hata oluştu');
      }
      console.error('Araç güncellenirken bir hata oluştu:', error);
    }
  });
}


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


  onBrandChange() {
    const brandId = this.vehicleForm.get('brand')?.value;
    if (brandId) {
      this.loadModels(brandId);
    }
  }

  // Dinamik form array fonksiyonları
  get vehicleImages(): FormArray {
    return this.vehicleForm.get('vehicleImages') as FormArray;
  }

  addVehicleImage(imageUrl: string) {
    this.vehicleImages.push(this.fb.control(imageUrl, Validators.required));
  }

  onFeatureChange(vehicleFeatureId: number, event: any): void {
    const featuresArray = this.vehicleForm.get('vehicleFeatures') as FormArray;
    if (event.target.checked) {
      if (!featuresArray.value.includes(vehicleFeatureId)) {
        featuresArray.push(this.fb.control(vehicleFeatureId));
      }
    } else {
      const index = featuresArray.controls.findIndex(x => x.value === vehicleFeatureId);
      if (index !== -1) {
        featuresArray.removeAt(index);
      }
    }
}

}
