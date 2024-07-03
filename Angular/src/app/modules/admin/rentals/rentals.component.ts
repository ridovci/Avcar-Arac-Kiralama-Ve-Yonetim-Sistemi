import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr'; // Toastr bildirim servisini içe aktarır
import { RentalService } from '../../../services/rental.service'; // RentalService servisini içe aktarır
import { RentalDto } from '../../../models/rental.model'; // RentalDto modelini içe aktarır
import { PagedResult, VehicleService } from '../../../services/vehicle.service'; // PagedResult ve VehicleService'i içe aktarır
import Swal from 'sweetalert2'; // SweetAlert2 bildirim kütüphanesini içe aktarır

@Component({
  selector: 'app-rentals',
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.css']
})
export class RentalsComponent implements OnInit {

  rentals: RentalDto[] = []; // Kiralamaları tutan dizi
  totalItems = 0; // Toplam kiralama sayısı
  currentPage = 1; // Şu anki sayfa numarası
  pageSize = 5; // Sayfa başına kiralama sayısı
  totalPages = 0; // Toplam sayfa sayısı
  status: number | undefined = undefined; // Kiralama durumu
  searchQuery: string = ''; // Arama sorgusu

  constructor(
    private rentalService: RentalService, // Kiralama servisi
    private vehicleService: VehicleService, // Araç servisi
    private toastr: ToastrService // Toastr servisi
  ) { }

  ngOnInit(): void {
    this.loadRentals(); // Bileşen yüklendiğinde kiralamaları yükle
  }

  // Kiralamaları yükler
  loadRentals(): void {
    this.rentalService.getRentals(this.currentPage, this.pageSize, this.status, this.searchQuery).subscribe(
      (response: PagedResult<RentalDto>) => {
        this.rentals = response.items; // Kiralama öğelerini diziye atar
        this.totalItems = response.totalCount; // Toplam kiralama sayısını atar
        this.totalPages = Math.ceil(this.totalItems / this.pageSize); // Toplam sayfa sayısını hesaplar
      },
      (error) => {
        console.error('Kiralama bilgileri yüklenirken hata oluştu:', error);
        this.toastr.error('Kiralama bilgileri yüklenemedi.');
      }
    );
  }

  // Sayfa numaralarını döner
  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Önceki sayfaya geçer
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRentals();
    }
  }

  // Sonraki sayfaya geçer
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRentals();
    }
  }

  // Belirli bir sayfaya gider
  goToPage(page: number) {
    this.currentPage = page;
    this.loadRentals();
  }

  // Sayfa değişikliğinde çalışır
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRentals();
  }

  // Kiralama durumunu değiştirir
  onStatusChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.status = selectElement.value === '4' ? undefined : Number(selectElement.value); // 'Tüm Kiralamalar' seçeneği için undefined ayarlanır
    this.currentPage = 1;  // Sayfayı sıfırla
    this.loadRentals();
  }

  // Arama sorgusunu değiştirir
  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.currentPage = 1;  // Sayfayı sıfırla
    this.loadRentals();
  }

  // Kiralamayı siler
  deleteRental(id: number): void {
    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu kiralamayı silmek istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'Hayır, iptal et'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rentalService.deleteRental(id).subscribe(
          () => {
            Swal.fire('Silindi!', 'Kiralama başarıyla silindi.', 'success');
            this.loadRentals();
          },
          (error: any) => {
            Swal.fire('Hata!', 'Kiralama silinirken bir hata oluştu.', 'error');
          }
        );
      }
    });
  }

  // İki tarih arasındaki gün farkını hesaplar
  getDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Kiralama durumunu çevirir
  translateStatus(status: string): string {
    switch (status) {
      case 'Approved':
        return 'Onaylandı';
      case 'Cancelled':
        return 'İptal Edildi';
      case 'Completed':
        return 'Tamamlandı';
      case 'Pending':
        return 'Beklemede';
      default:
        return status;
    }
  }

  // Fiyatı formatlar
  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price);
  }
// Mevcut tarih ile iade tarihi arasındaki gün farkını hesaplar
getRemainingDays(endDate: string): string | number {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : "İade tarihi geçti";
}

}
