import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../services/confirm.service';
import Swal from 'sweetalert2';
import { VehicleService } from '../../../../services/vehicle.service';

@Component({
  selector: 'app-car-settings',
  templateUrl: './car-settings.component.html',
  styleUrls: ['./car-settings.component.css']
})
export class CarSettingsComponent implements OnInit {
  // Form grup tanımlamaları
  editForm!: FormGroup;
  addForm!: FormGroup;
  modelAddForm!: FormGroup;
  modelEditForm!: FormGroup;
  vehicleTypeFormEdit!: FormGroup;
  vehicleTypeFormAdd!: FormGroup;
  gearTypeFormEdit!: FormGroup;
  gearTypeFormAdd!: FormGroup;
  fuelTypeFormEdit!: FormGroup;
  fuelTypeFormAdd!: FormGroup;
  colorFormEdit!: FormGroup;
  colorFormAdd!: FormGroup;
  airConditioningFormEdit!: FormGroup;
  airConditioningFormAdd!: FormGroup;
  vehicleFeatureFormEdit!: FormGroup;
  vehicleFeatureFormAdd!: FormGroup;

  // Veri alanları
  brands: any[] = [];
  models: any[] = [];
  vehicleTypes: any[] = [];
  gearTypes: any[] = [];
  fuelTypes: any[] = [];
  colors: any[] = [];
  airConditionings: any[] = [];
  vehicleFeatures: any[] = [];
  selectedBrand: any;

  constructor(
    private http: HttpClient, 
    private fb: FormBuilder, 
    private confirmService: ConfirmService, 
    private vehicleService: VehicleService
  ) { }

  ngOnInit(): void {
    // Başlangıçta gerekli verileri yükleme
    this.getBrands();
    this.getVehicleTypes();
    this.getGearTypes();
    this.getFuelTypes();
    this.getColors();
    this.getAirConditionings();
    this.getVehicleFeatures();

    // Form gruplarını oluşturma
    this.editForm = this.fb.group({
      brandId: ['', Validators.required],
      brandName: ['', Validators.required]
    });

    this.addForm = this.fb.group({
      brandName: ['', Validators.required]
    });

    this.modelAddForm = this.fb.group({
      brandId: ['', Validators.required],
      modelName: ['', Validators.required]
    });

    this.modelEditForm = this.fb.group({
      brandId: ['', Validators.required],
      modelId: ['', Validators.required],
      modelName: ['', Validators.required]
    });

    this.vehicleTypeFormEdit = this.fb.group({
      vehicleTypeId: ['', Validators.required],
      vehicleTypeName: ['', Validators.required]
    });

    this.vehicleTypeFormAdd = this.fb.group({
      vehicleTypeName: ['', Validators.required]
    });

    this.fuelTypeFormEdit = this.fb.group({
      fuelTypeId: ['', Validators.required],
      fuelTypeName: ['', Validators.required]
    });

    this.fuelTypeFormAdd = this.fb.group({
      fuelTypeName: ['', Validators.required]
    });

    this.gearTypeFormEdit = this.fb.group({
      gearTypeId: ['', Validators.required],
      gearTypeName: ['', Validators.required]
    });

    this.gearTypeFormAdd = this.fb.group({
      gearTypeName: ['', Validators.required]
    });

    this.colorFormEdit = this.fb.group({
      colorId: ['', Validators.required],
      colorName: ['', Validators.required]
    });

    this.colorFormAdd = this.fb.group({
      colorName: ['', Validators.required]
    });

    this.airConditioningFormEdit = this.fb.group({
      airConditioningId: ['', Validators.required],
      airConditioningName: ['', Validators.required]
    });

    this.airConditioningFormAdd = this.fb.group({
      airConditioningName: ['', Validators.required]
    });

    this.vehicleFeatureFormEdit = this.fb.group({
      vehicleFeatureId: ['', Validators.required],
      vehicleFeatureName: ['', Validators.required]
    });

    this.vehicleFeatureFormAdd = this.fb.group({
      vehicleFeatureName: ['', Validators.required]
    });
  }

  // Markaları alma işlemi
  getBrands(): void {
    this.vehicleService.getBrands().subscribe(response => {
      this.brands = response;
      this.editForm.get('brandId')?.setValue(''); // brandId alanını sıfırla
      this.editForm.get('brandName')?.setValue(''); // brandId alanını sıfırla
    });
  }

  // Marka ekleme işlemi
  onAddBrands(): void {
    if (this.addForm.valid) {
      const newBrand = this.addForm.value;
      this.vehicleService.addBrand(newBrand).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni marka başarıyla eklendi.', 'success');
          this.getBrands();
          this.addForm.reset();
        },
        error => {
          Swal.fire('Hata!', 'Yeni marka eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Marka yeniden adlandırma işlemi
  onRenameBrands(): void {
    if (this.editForm.valid) {
      this.confirmService.confirmAction('Bu Markayı yeniden adlandırmak istediğinize emin misiniz?', () => {
        const brand = this.editForm.value;
        this.vehicleService.updateBrand(brand).subscribe(response => {
          this.getBrands();
          Swal.fire('Yeniden Adlandırıldı!', 'Marka başarıyla yeniden adlandırıldı.', 'success');
        }, error => {
          Swal.fire('Hata!', 'Marka yeniden adlandırılırken bir hata oluştu.', 'error');
        });
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Marka silme işlemi
  onDeleteBrands(): void {
    let brandId = this.editForm.get('brandId')?.value;
    if (!brandId) {
      return;
    }
    this.confirmService.confirmAction('Bu Markayı silmek istediğinize emin misiniz?', () => {
      this.vehicleService.deleteBrand(brandId).subscribe(
        () => {
          Swal.fire('Silindi!', 'Marka başarıyla silindi.', 'success');
          this.getBrands();
          this.editForm.get('brandId')?.setValue(''); // brandId alanını sıfırla
        },
        (error: any) => {
          Swal.fire('Hata!', 'Marka silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }

  // Modelleri alma işlemi
  getModels(brandId: string): void {
    this.vehicleService.getModels(brandId).subscribe(
      (response) => {
        this.models = response;
        this.editForm.get('brandId')?.setValue('');
        this.editForm.get('brandName')?.setValue('');
      },
      (error) => {
        this.models = []
      }
    );
  }
  
  // Model ekleme işlemi
  onAddModels(): void {
    if (this.modelAddForm.valid) {
      const newModel = this.modelAddForm.value;
      this.vehicleService.addModel(newModel).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni model başarıyla eklendi.', 'success');
          this.getModels(newModel.brandId);
          this.modelAddForm.reset();
        },
        error => {
          Swal.fire('Hata!', 'Yeni model eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Model yeniden adlandırma işlemi
  onRenameModels(): void {
    if (this.modelEditForm.valid) {
      this.confirmService.confirmAction('Bu Modeli yeniden adlandırmak istediğinize emin misiniz?', () => {
        const model = this.modelEditForm.value;
        this.vehicleService.updateModel(model).subscribe(response => {
          this.getModels(model.brandId);
          Swal.fire('Yeniden Adlandırıldı!', 'Model başarıyla yeniden adlandırıldı.', 'success');
        }, error => {
          Swal.fire('Hata!', 'Model yeniden adlandırılırken bir hata oluştu.', 'error');
        });
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Model silme işlemi
  onDeleteModels(): void {
    let modelId = this.modelEditForm.get('modelId')?.value;
    if (!modelId) {
      return;
    }
    this.confirmService.confirmAction('Bu Modeli silmek istediğinize emin misiniz?', () => {
      this.vehicleService.deleteModel(modelId).subscribe(
        () => {
          Swal.fire('Silindi!', 'Model başarıyla silindi.', 'success');
          this.getModels(this.modelEditForm.get('brandId')?.value);
          this.modelEditForm.get('modelId')?.setValue('');
        },
        (error: any) => {
          Swal.fire('Hata!', 'Model silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }

  // Marka değiştiğinde modelleri güncelleme
  onBrandChange(event: any): void {
    const brandId = event.target.value;
    if (brandId) {
      this.getModels(brandId);
    }
  }

  // Araç türlerini alma işlemi
  getVehicleTypes(): void {
    this.vehicleService.getVehicleTypes().subscribe(response => {
      this.vehicleTypes = response;
      this.vehicleTypeFormEdit.get('vehicleTypeId')?.setValue(''); // vehicleTypeId alanını sıfırla
      this.vehicleTypeFormEdit.get('vehicleTypeName')?.setValue(''); // vehicleTypeId alanını sıfırla
    });
  }

  // Araç türü ekleme işlemi
  onAddVehicleTypes(): void {
    if (this.vehicleTypeFormAdd.valid) {
      const newVehicleType = this.vehicleTypeFormAdd.value;
      this.vehicleService.addVehicleType(newVehicleType).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni araç tipi başarıyla eklendi.', 'success');
          this.getVehicleTypes();
          this.vehicleTypeFormAdd.reset();
        },
        error => {
          Swal.fire('Hata!', 'Yeni araç tipi eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Araç türü yeniden adlandırma işlemi
  onRenameVehicleTypes(): void {
    if (this.vehicleTypeFormEdit.valid) {
      this.confirmService.confirmAction('Bu Araç Tipini yeniden adlandırmak istediğinize emin misiniz?', () => {
        const vehicleType = this.vehicleTypeFormEdit.value;

        this.vehicleService.updateVehicleType(vehicleType).subscribe(response => {
          this.getVehicleTypes();
          Swal.fire('Yeniden Adlandırıldı!', 'Araç tipi başarıyla yeniden adlandırıldı.', 'success');
        }, error => {
          Swal.fire('Hata!', 'Araç tipi yeniden adlandırılırken bir hata oluştu.', 'error');
        });
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Araç türü silme işlemi
  onDeleteVehicleTypes(): void {
    let vehicleTypeId = this.vehicleTypeFormEdit.get('vehicleTypeId')?.value;
    if (!vehicleTypeId) {
      return;
    }
    this.confirmService.confirmAction('Bu Araç Tipini silmek istediğinize emin misiniz?', () => {
      this.vehicleService.deleteVehicleType(vehicleTypeId).subscribe(
        () => {
          Swal.fire('Silindi!', 'Araç tipi başarıyla silindi.', 'success');
          this.getVehicleTypes();
          this.vehicleTypeFormEdit.get('vehicleTypeId')?.setValue(''); // vehicleTypeId alanını sıfırla
        },
        (error: any) => {
          Swal.fire('Hata!', 'Araç tipi silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }

  // Vites türlerini alma işlemi
  getGearTypes(): void {
    this.vehicleService.getGearTypes().subscribe(response => {
      this.gearTypes = response;
      this.gearTypeFormEdit.get('gearTypeId')?.setValue(''); // gearTypeId alanını sıfırla
      this.gearTypeFormEdit.get('gearTypeName')?.setValue(''); // gearTypeId alanını sıfırla
    });
  }

  // Vites türü ekleme işlemi
  onAddGearTypes(): void {
    if (this.gearTypeFormAdd.valid) {
      const newGearType = this.gearTypeFormAdd.value;
      this.vehicleService.addGearType(newGearType).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni vites tipi başarıyla eklendi.', 'success');
          this.getGearTypes();
          this.gearTypeFormAdd.reset();
        },
        error => {
          Swal.fire('Hata!', 'Yeni vites tipi eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Vites türü yeniden adlandırma işlemi
  onRenameGearTypes(): void {
    if (this.gearTypeFormEdit.valid) {
      this.confirmService.confirmAction('Bu Vites Tipini yeniden adlandırmak istediğinize emin misiniz?', () => {
        const gearType = this.gearTypeFormEdit.value;
        this.vehicleService.updateGearType(gearType).subscribe(response => {
          this.getGearTypes();
          Swal.fire('Yeniden Adlandırıldı!', 'Vites tipi başarıyla yeniden adlandırıldı.', 'success');
        }, error => {
          Swal.fire('Hata!', 'Vites tipi yeniden adlandırılırken bir hata oluştu.', 'error');
        });
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Vites türü silme işlemi
  onDeleteGearTypes(): void {
    let gearTypeId = this.gearTypeFormEdit.get('gearTypeId')?.value;
    if (!gearTypeId) {
      return;
    }
    this.confirmService.confirmAction('Bu Vites Tipini silmek istediğinize emin misiniz?', () => {
      this.vehicleService.deleteGearType(gearTypeId).subscribe(
        () => {
          Swal.fire('Silindi!', 'Vites tipi başarıyla silindi.', 'success');
          this.getGearTypes();
          this.gearTypeFormEdit.get('gearTypeId')?.setValue(''); // gearTypeId alanını sıfırla
        },
        (error: any) => {
          Swal.fire('Hata!', 'Vites tipi silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }

  // Yakıt türlerini alma işlemi
  getFuelTypes(): void {
    this.vehicleService.getFuelTypes().subscribe(response => {
      this.fuelTypes = response;
      this.fuelTypeFormEdit.get('fuelTypeId')?.setValue(''); // fuelTypeId alanını sıfırla
      this.fuelTypeFormEdit.get('fuelTypeName')?.setValue(''); // fuelTypeId alanını sıfırla
    });
  }

  // Yakıt türü ekleme işlemi
  onAddFuelTypes(): void {
    if (this.fuelTypeFormAdd.valid) {
      const newFuelType = this.fuelTypeFormAdd.value;
      this.vehicleService.addFuelType(newFuelType).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni yakıt tipi başarıyla eklendi.', 'success');
          this.getFuelTypes();
          this.fuelTypeFormAdd.reset();
        },
        error => {
          Swal.fire('Hata!', 'Yeni yakıt tipi eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Yakıt türü yeniden adlandırma işlemi
  onRenameFuelTypes(): void {
    if (this.fuelTypeFormEdit.valid) {
      this.confirmService.confirmAction('Bu Yakıt Tipini yeniden adlandırmak istediğinize emin misiniz?', () => {
        const fuelType = this.fuelTypeFormEdit.value;
        this.vehicleService.updateFuelType(fuelType).subscribe(response => {
          this.getFuelTypes();
          Swal.fire('Yeniden Adlandırıldı!', 'Yakıt tipi başarıyla yeniden adlandırıldı.', 'success');
        }, error => {
          Swal.fire('Hata!', 'Yakıt tipi yeniden adlandırılırken bir hata oluştu.', 'error');
        });
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Yakıt türü silme işlemi
  onDeleteFuelTypes(): void {
    let fuelTypeId = this.fuelTypeFormEdit.get('fuelTypeId')?.value;
    if (!fuelTypeId) {
      return;
    }
    this.confirmService.confirmAction('Bu Yakıt Tipini silmek istediğinize emin misiniz?', () => {
      this.vehicleService.deleteFuelType(fuelTypeId).subscribe(
        () => {
          Swal.fire('Silindi!', 'Yakıt tipi başarıyla silindi.', 'success');
          this.getFuelTypes();
          this.fuelTypeFormEdit.get('fuelTypeId')?.setValue(''); // fuelTypeId alanını sıfırla
        },
        (error: any) => {
          Swal.fire('Hata!', 'Yakıt tipi silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }

  // Renkleri alma işlemi
  getColors(): void {
    this.vehicleService.getColors().subscribe(response => {
      this.colors = response;
      this.colorFormEdit.get('colorId')?.setValue(''); // colorId alanını sıfırla
      this.colorFormEdit.get('colorName')?.setValue(''); // colorId alanını sıfırla
    });
  }

  // Renk ekleme işlemi
  onAddColors(): void {
    if (this.colorFormAdd.valid) {
      const newColor = this.colorFormAdd.value;
      this.vehicleService.addColor(newColor).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni araç rengi başarıyla eklendi.', 'success');
          this.getColors();
          this.colorFormAdd.reset();
        },
        error => {
          Swal.fire('Hata!', 'Yeni renk eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Renk yeniden adlandırma işlemi
  onRenameColors(): void {
    if (this.colorFormEdit.valid) {
      this.confirmService.confirmAction('Bu rengi yeniden adlandırmak istediğinize emin misiniz?', () => {
        const color = this.colorFormEdit.value;
        this.vehicleService.updateColor(color).subscribe(response => {
          this.getColors();
          Swal.fire('Yeniden Adlandırıldı!', 'Araç rengi başarıyla yeniden adlandırıldı.', 'success');
        }, error => {
          Swal.fire('Hata!', 'Araç rengi yeniden adlandırılırken bir hata oluştu.', 'error');
        });
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Renk silme işlemi
  onDeleteColors(): void {
    let colorId = this.colorFormEdit.get('colorId')?.value;
    if (!colorId) {
      return;
    }
    this.confirmService.confirmAction('Bu Araç rengini silmek istediğinize emin misiniz?', () => {
      this.vehicleService.deleteColor(colorId).subscribe(
        () => {
          Swal.fire('Silindi!', 'Araç rengi başarıyla silindi.', 'success');
          this.getColors();
          this.colorFormEdit.get('colorId')?.setValue(''); // colorId alanını sıfırla
        },
        (error: any) => {
          Swal.fire('Hata!', 'Araç rengi silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }

  // Klima türlerini alma işlemi
  getAirConditionings(): void {
    this.vehicleService.getAirConditionings().subscribe(response => {
      this.airConditionings = response;
      this.airConditioningFormEdit.get('airConditioningId')?.setValue(''); // airConditioningId alanını sıfırla
      this.airConditioningFormEdit.get('airConditioningName')?.setValue(''); // airConditioningName alanını sıfırla
    });
  }

  // Klima türü ekleme işlemi
  onAddAirConditionings(): void {
    if (this.airConditioningFormAdd.valid) {
      const newAirConditioning = this.airConditioningFormAdd.value;
      this.vehicleService.addAirConditioning(newAirConditioning).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni araç klima türü başarıyla eklendi.', 'success');
          this.getAirConditionings();
          this.airConditioningFormAdd.reset();
        },
        error => {
          Swal.fire('Hata!', 'Yeni klima türü eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Klima türü yeniden adlandırma işlemi
  onRenameAirConditionings(): void {
    if (this.airConditioningFormEdit.valid) {
      this.confirmService.confirmAction('Bu klima türünü yeniden adlandırmak istediğinize emin misiniz?', () => {
        const airConditioning = this.airConditioningFormEdit.value;
        this.vehicleService.updateAirConditioning(airConditioning).subscribe(
          response => {
            this.getAirConditionings();
            Swal.fire('Yeniden Adlandırıldı!', 'Araç klima türü başarıyla yeniden adlandırıldı.', 'success');
          },
          error => {
            Swal.fire('Hata!', 'Araç klima türü yeniden adlandırılırken bir hata oluştu.', 'error');
          }
        );
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Klima türü silme işlemi
  onDeleteAirConditionings(): void {
    const airConditioningId = this.airConditioningFormEdit.get('airConditioningId')?.value;
    if (!airConditioningId) {
      Swal.fire('Hata!', 'Lütfen geçerli bir klima türü seçin.', 'error');
      return;
    }
    this.confirmService.confirmAction('Bu klima türünü silmek istediğinize emin misiniz?', () => {
      this.vehicleService.deleteAirConditioning(airConditioningId).subscribe(
        response => {
          Swal.fire('Silindi!', 'Araç klima türü başarıyla silindi.', 'success');
          this.getAirConditionings();
          this.airConditioningFormEdit.get('airConditioningId')?.setValue(''); // airConditioningId alanını sıfırla
          this.airConditioningFormEdit.get('airConditioningName')?.setValue(''); // airConditioningName alanını sıfırla
        },
        error => {
          Swal.fire('Hata!', 'Araç klima türü silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }

  // Araç özelliklerini alma işlemi
  getVehicleFeatures(): void {
    this.vehicleService.getVehicleFeatures().subscribe(response => {
      this.vehicleFeatures = response;
      this.vehicleFeatureFormEdit.get('vehicleFeatureId')?.setValue(''); // vehicleFeatureId alanını sıfırla
      this.vehicleFeatureFormEdit.get('vehicleFeatureName')?.setValue(''); // vehicleFeatureName alanını sıfırla
    });
  }

  // Araç özelliği ekleme işlemi
  onAddVehicleFeatures(): void {
    if (this.vehicleFeatureFormAdd.valid) {
      const newVehicleFeature = this.vehicleFeatureFormAdd.value;
      this.vehicleService.addVehicleFeature(newVehicleFeature).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni araç özelliği başarıyla eklendi.', 'success');
          this.getVehicleFeatures();
          this.vehicleFeatureFormAdd.reset();
        },
        error => {
          Swal.fire('Hata!', 'Yeni özelliği eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Araç özelliği yeniden adlandırma işlemi
  onRenameVehicleFeatures(): void {
    if (this.vehicleFeatureFormEdit.valid) {
      this.confirmService.confirmAction('Bu özelliğinü yeniden adlandırmak istediğinize emin misiniz?', () => {
        const vehicleFeature = this.vehicleFeatureFormEdit.value;
        this.vehicleService.updateVehicleFeature(vehicleFeature).subscribe(
          response => {
            this.getVehicleFeatures();
            Swal.fire('Yeniden Adlandırıldı!', 'Araç özelliği başarıyla yeniden adlandırıldı.', 'success');
          },
          error => {
            Swal.fire('Hata!', 'Araç özelliği yeniden adlandırılırken bir hata oluştu.', 'error');
          }
        );
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Araç özelliği silme işlemi
  onDeleteVehicleFeatures(): void {
    const vehicleFeatureId = this.vehicleFeatureFormEdit.get('vehicleFeatureId')?.value;
    if (!vehicleFeatureId) {
      Swal.fire('Hata!', 'Lütfen geçerli bir özelliği seçin.', 'error');
      return;
    }
    this.confirmService.confirmAction('Bu özelliğinü silmek istediğinize emin misiniz?', () => {
      this.vehicleService.deleteVehicleFeature(vehicleFeatureId).subscribe(
        response => {
          Swal.fire('Silindi!', 'Araç özelliği başarıyla silindi.', 'success');
          this.getVehicleFeatures();
          this.vehicleFeatureFormEdit.get('vehicleFeatureId')?.setValue(''); // vehicleFeatureId alanını sıfırla
          this.vehicleFeatureFormEdit.get('vehicleFeatureName')?.setValue(''); // vehicleFeatureName alanını sıfırla
        },
        error => {
          Swal.fire('Hata!', 'Araç özelliği silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }
}
