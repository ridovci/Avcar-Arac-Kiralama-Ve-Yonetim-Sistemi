import { Component, OnInit } from '@angular/core';
import { PagedResult, VehicleService } from '../../../services/vehicle.service';
import { ToastrService } from 'ngx-toastr';
import { Vehicle } from '../../../models/vehicle.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cars-admin',
  templateUrl: './cars-admin.component.html',
  styleUrls: ['./cars-admin.component.css']
})
export class CarsAdminComponent implements OnInit {

  vehicles: Vehicle[] = []; // Araçları tutan dizi
  totalItems = 0; // Toplam araç sayısı
  currentPage = 1; // Mevcut sayfa numarası
  pageSize = 5; // Sayfa başına gösterilecek araç sayısı
  totalPages = 0; // Toplam sayfa sayısı
  sortField: string = 'createdDate'; // Sıralama için kullanılan alan
  sortOrder: string = 'asc'; // Sıralama düzeni (asc veya desc)
  status: number | undefined = undefined; // Araç durumu, varsayılan olarak undefined
  searchQuery: string = ''; // Araç plakası için arama sorgusu

  constructor(
    public vehicleService: VehicleService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadVehicles(); // Bileşen yüklendiğinde araçları yükle
  }

  loadVehicles(): void {
    // API'den araçları al ve bileşen durumunu güncelle
    this.vehicleService.getVehicles(this.currentPage, this.pageSize, this.sortField, this.sortOrder, this.status, this.searchQuery).subscribe(
      (response: PagedResult<Vehicle>) => {
        this.vehicles = response.items; // Alınan araçları diziye ata
        this.totalItems = response.totalCount; // Toplam araç sayısını güncelle
        this.totalPages = Math.ceil(this.totalItems / this.pageSize); // Toplam sayfa sayısını hesapla
        this.vehicles.forEach(vehicle => {
          const statusNumber = Number(vehicle.status); // Status alanını number tipine dönüştür
          vehicle.rentalStatusMessage = this.vehicleService.getStatusDescription(statusNumber); // Araç durumu açıklamasını al
          if (statusNumber === 3) { // Araç müsait ise kiralama durumunu kontrol et
            this.checkRentalStatus(vehicle);
          }
        });
      },
      (error) => {
        console.error('Araçları yüklerken hata oluştu:', error); // Hata oluştuğunda konsola yazdır
      }
    );
  }

  checkRentalStatus(vehicle: Vehicle): void {
    // API'den aracın kiralama durumunu kontrol et ve güncelle
    this.vehicleService.checkRentalStatus(vehicle.vehicleId).subscribe(
      (isRented: boolean) => {
        vehicle.rentalStatusMessage = this.vehicleService.getStatusDescription(isRented ? 2 : 3); // 2 = Kirada, 3 = Müsait
      },
      (error) => {
        console.error('Hata oluştu', error); // Hata oluştuğunda konsola yazdır
        vehicle.rentalStatusMessage = 'Durum kontrol edilemedi'; // Hata durumunda durum mesajı güncelle
      }
    );
  }

  getPages(): number[] {
    // Sayfa numaralarını içeren bir dizi döner
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  previousPage() {
    // Önceki sayfaya geçiş yapar
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadVehicles(); // Yeni sayfanın araçlarını alır
    }
  }

  nextPage() {
    // Sonraki sayfaya geçiş yapar
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadVehicles(); // Yeni sayfanın araçlarını alır
    }
  }

  goToPage(page: number) {
    // Belirtilen sayfaya geçiş yapar
    this.currentPage = page;
    this.loadVehicles(); // Yeni sayfanın araçlarını alır
  }

  onPageChange(page: number): void {
    // Sayfa değiştiğinde yeni sayfanın araçlarını alır
    this.currentPage = page;
    this.loadVehicles();
  }

  onSortChange(event: Event): void {
    // Sıralama değişikliğinde araçları yeniden yükler
    const selectElement = event.target as HTMLSelectElement;
    const [field, order] = selectElement.value.split(',');
    this.sortField = field;
    this.sortOrder = order;
    this.loadVehicles();
  }

  onStatusChange(event: Event): void {
    // Araç durumu değişikliğinde araçları yeniden yükler
    const selectElement = event.target as HTMLSelectElement;
    this.status = selectElement.value === '4' ? undefined : Number(selectElement.value); // 'Tüm Araçlar' seçeneği için undefined ayarlanır
    this.currentPage = 1;  // Sayfayı sıfırla
    this.loadVehicles();
  }

  onSearchChange(event: Event): void {
    // Arama sorgusu değiştiğinde araçları yeniden yükler
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.currentPage = 1;  // Sayfayı sıfırla
    this.loadVehicles();
  }

  deleteVehicle(id: number): void {
    // Araç silme işlemi için kullanıcıdan onay alır ve araç silme API çağrısı yapar
    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu aracı silmek istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'Hayır, iptal et'
    }).then((result) => {
      if (result.isConfirmed) {
        this.vehicleService.deleteVehicle(id).subscribe(
          () => {
            Swal.fire('Silindi!', 'Araç başarıyla silindi.', 'success'); // Başarılı mesajı göster
            this.loadVehicles(); // Araçları yeniden yükle
          },
          (error: any) => {
            Swal.fire('Hata!', 'Araç silinirken bir hata oluştu.', 'error'); // Hata mesajı göster
          }
        );
      }
    });
  }

  formatPrice(price: number): string {
    // Fiyatı formatlar
    return this.vehicleService.formatPrice(price);
  }
}
