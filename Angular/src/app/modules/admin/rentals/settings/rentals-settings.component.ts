import { HttpClient } from '@angular/common/http'; // HttpClient servisini içe aktarır
import { Component, OnInit } from '@angular/core'; // Component ve OnInit ömrü yöntemini içe aktarır
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // FormBuilder, FormGroup ve Validators'ı içe aktarır
import { ConfirmService } from '../../../../services/confirm.service'; // ConfirmService servisini içe aktarır
import { RentalService } from '../../../../services/rental.service'; // RentalService servisini içe aktarır
import Swal from 'sweetalert2'; // SweetAlert2 bildirim kütüphanesini içe aktarır

@Component({
  selector: 'app-rentals-settings',
  templateUrl: './rentals-settings.component.html',
  styleUrl: './rentals-settings.component.css'
})
export class RentalsSettingsComponent implements OnInit {
  additionalRentalProductsFormEdit!: FormGroup; // Düzenleme form grubu
  additionalRentalProductsFormAdd!: FormGroup; // Ekleme form grubu

  locationsFormEdit!: FormGroup; // Lokasyon düzenleme form grubu
  locationsFormAdd!: FormGroup; // Lokasyon ekleme form grubu

  locations: any[] = []; // Lokasyonları tutan dizi
  additionalRentalProducts: any[] = []; // Ek kiralama ürünlerini tutan dizi
  selectedProduct: any; // Seçili ürün

  constructor(
    private http: HttpClient, // HttpClient servisini enjekte eder
    private fb: FormBuilder, // FormBuilder servisini enjekte eder
    private confirmService: ConfirmService, // ConfirmService servisini enjekte eder
    private rentalService: RentalService // RentalService servisini enjekte eder
  ) { }

  ngOnInit(): void {
    this.getAdditionalRentalProduct(); // Ek kiralama ürünlerini getir
    this.getLocations(); // Lokasyonları getir

    // Ek kiralama ürünleri düzenleme formunu oluştur
    this.additionalRentalProductsFormEdit = this.fb.group({
      additionalRentalProductId: ['', Validators.required],
      additionalRentalProductName: ['', Validators.required],
      additionalRentalProductFee: ['', Validators.required],
      additionalRentalProductDescription: ['']
    });

    // Ek kiralama ürünleri ekleme formunu oluştur
    this.additionalRentalProductsFormAdd = this.fb.group({
      additionalRentalProductName: ['', Validators.required],
      additionalRentalProductFee: ['', Validators.required],
      additionalRentalProductDescription: ['']
    });

    // Lokasyon düzenleme formunu oluştur
    this.locationsFormEdit = this.fb.group({
      locationId: ['', Validators.required],
      locationName: ['', Validators.required]
    });

    // Lokasyon ekleme formunu oluştur
    this.locationsFormAdd = this.fb.group({
      locationName: ['', Validators.required]
    });
  }

  // Lokasyonları getirir
  getLocations(): void {
    this.rentalService.getAllLocations().subscribe(response => {
      this.locations = response;
      this.locationsFormEdit.get('locationId')?.setValue(''); // Lokasyon ID'sini sıfırlar
      this.locationsFormEdit.get('locationName')?.setValue(''); // Lokasyon adını sıfırlar
    });
  }

  // Yeni lokasyon ekler
  onAddLocations(): void {
    if (this.locationsFormAdd.valid) {
      const newLocation = this.locationsFormAdd.value;
      this.rentalService.addLocation(newLocation).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni ofis lokasyonu başarıyla eklendi.', 'success');
          this.getLocations();
          this.locationsFormAdd.reset(); // Formu sıfırlar
        },
        error => {
          Swal.fire('Hata!', 'Yeni ofis lokasyonu eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Lokasyon adını değiştirir
  onRenameLocations(): void {
    if (this.locationsFormEdit.valid) {
      this.confirmService.confirmAction('Bu ofis lokasyonunu yeniden adlandırmak istediğinize emin misiniz?', () => {
        const location = this.locationsFormEdit.value;
        this.rentalService.updateLocation(location).subscribe(response => {
          this.getLocations();
          Swal.fire('Yeniden Adlandırıldı!', 'Ofis Lokasyonu başarıyla yeniden adlandırıldı.', 'success');
        }, error => {
          Swal.fire('Hata!', 'Ofis Lokasyonu yeniden adlandırılırken bir hata oluştu.', 'error');
        });
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Lokasyon siler
  onDeleteLocations(): void {
    let locationId = this.locationsFormEdit.get('locationId')?.value;
    if (!locationId) {
      // Hata durumunu işle
      return;
    }
    this.confirmService.confirmAction('Bu Ofis Lokasyonunu silmek istediğinize emin misiniz?', () => {
      this.rentalService.deleteLocation(locationId).subscribe(
        () => {
          Swal.fire('Silindi!', 'Ofis Lokasyonu başarıyla silindi.', 'success');
          this.getLocations();
          this.locationsFormEdit.get('locationId')?.setValue(''); // Lokasyon ID'sini sıfırlar
        },
        (error: any) => {
          Swal.fire('Hata!', 'Ofis Lokasyonu silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }

  // Ek kiralama ürünlerini getirir
  getAdditionalRentalProduct(): void {
    this.rentalService.getAdditionalRentalProducts().subscribe(response => {
      this.additionalRentalProducts = response;
      this.additionalRentalProductsFormEdit.get('additionalRentalProductId')?.setValue(''); // Ek kiralama ürünü ID'sini sıfırlar
    });
  }

  // Ek kiralama ürünleri formu değişikliklerini izler
  onChanges(): void {
    this.additionalRentalProductsFormEdit.get('additionalRentalProductId')?.valueChanges.subscribe(productId => {
      this.onProductSelect(productId);
    });
  }

  // Ek kiralama ürünü seçimini işler
  onProductSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const productId = parseInt(target.value, 10);

    const selectedProduct = this.additionalRentalProducts.find(product => product.additionalRentalProductId === productId);

    if (selectedProduct) {
      this.additionalRentalProductsFormEdit.patchValue({
        additionalRentalProductName: selectedProduct.additionalRentalProductName,
        additionalRentalProductFee: selectedProduct.additionalRentalProductFee,
        additionalRentalProductDescription: selectedProduct.additionalRentalProductDescription
      });
    }
  }

  // Yeni ek kiralama ürünü ekler
  onAddAdditionalRentalProduct(): void {
    if (this.additionalRentalProductsFormAdd.valid) {
      const newProduct = this.additionalRentalProductsFormAdd.value;
      this.rentalService.addAdditionalRentalProduct(newProduct).subscribe(
        response => {
          Swal.fire('Eklendi!', 'Yeni Eklenebilir Kiralama Özelliği başarıyla eklendi.', 'success');
          this.getAdditionalRentalProduct();
          this.additionalRentalProductsFormAdd.reset(); // Formu sıfırlar
        },
        error => {
          Swal.fire('Hata!', 'Yeni Eklenebilir Kiralama Özelliği eklenirken bir hata oluştu.', 'error');
        }
      );
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Ek kiralama ürününü yeniden adlandırır
  onRenameAdditionalRentalProduct(): void {
    if (this.additionalRentalProductsFormEdit.valid) {
      this.confirmService.confirmAction('Bu Eklenebilir Kiralama Özelliğini değiştirmek istediğinize emin misiniz?', () => {
        const additionalRentalProduct = this.additionalRentalProductsFormEdit.value;
        this.rentalService.updateAdditionalRentalProduct(additionalRentalProduct).subscribe(response => {
          this.getAdditionalRentalProduct();
          this.additionalRentalProductsFormEdit.reset(); // Formu sıfırlar
          Swal.fire('Değiştirildi!', 'Eklenebilir Kiralama Özelliği başarıyla değiştirildi.', 'success');
        }, error => {
          Swal.fire('Hata!', 'Eklenebilir Kiralama Özelliği değiştirilirken bir hata oluştu.', 'error');
        });
      });
    } else {
      Swal.fire('Hata!', 'Lütfen tüm gerekli alanları doldurun.', 'error');
    }
  }

  // Ek kiralama ürününü siler
  onDeleteAdditionalRentalProduct(): void {
    let additionalRentalProductId = this.additionalRentalProductsFormEdit.get('additionalRentalProductId')?.value;
    if (!additionalRentalProductId) {
      // Hata durumunu işle
      return;
    }
    this.confirmService.confirmAction('Bu Eklenebilir Kiralama Özelliğini silmek istediğinize emin misiniz?', () => {
      this.rentalService.deleteAdditionalRentalProduct(additionalRentalProductId).subscribe(
        () => {
          Swal.fire('Silindi!', 'Eklenebilir Kiralama Özelliği başarıyla silindi.', 'success');
          this.getAdditionalRentalProduct();
          this.additionalRentalProductsFormEdit.reset(); // Formu sıfırlar
          this.additionalRentalProductsFormEdit.get('additionalRentalProductId')?.setValue(''); // Ek kiralama ürünü ID'sini sıfırlar
        },
        (error: any) => {
          Swal.fire('Hata!', 'Eklenebilir Kiralama Özelliği silinirken bir hata oluştu.', 'error');
        }
      );
    });
  }
}
