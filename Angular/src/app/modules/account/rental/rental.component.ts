import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { RentalDto, PagedResult, RentalStatus } from '../../../models/rental.model';
import { RentalService } from '../../../services/rental.service';
import { AuthService } from '../../../services/auth.service';
import { VehicleService } from '../../../services/vehicle.service';

@Component({
  selector: 'app-rental',
  templateUrl: './rental.component.html',
  styleUrl: './rental.component.css'
})
export class RentalComponent implements OnInit {

  rentals: RentalDto[] = []; // Kullanıcının kiralamalarını tutan dizi
  totalItems = 0; // Toplam kiralama sayısı
  currentPage = 1; // Mevcut sayfa numarası
  pageSize = 5; // Sayfa başına kiralama sayısı
  totalPages = 0; // Toplam sayfa sayısı
  status?: RentalStatus; // Kiralama durumu
  searchQuery: string = ''; // Arama sorgusu
  userId: number | undefined; // Kullanıcı ID'si
  today = new Date(); // Bugünün tarihi

  // Başlangıç tarihinin bugün veya daha sonra olup olmadığını kontrol eder
  isStartDateTodayOrLater(startDate: string): boolean {
    const startDateDate = new Date(startDate);
    return startDateDate <= this.today;
  }

  constructor(
    private rentalService: RentalService, // RentalService servisini enjekte eder
    private vehicleService: VehicleService, // VehicleService servisini enjekte eder
    private authService: AuthService, // AuthService servisini enjekte eder
    private toastr: ToastrService // ToastrService servisini enjekte eder
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getUserId(); // AuthService'den kullanıcı ID'sini al
    
    if (this.userId !== undefined) {
      this.loadRentalsForUser(this.userId); // Kullanıcının kiralamalarını yükle
    } else {
      this.toastr.error('Kiralamaları görüntülemek için kullanıcı girişi yapılmalıdır.', 'Kimlik Doğrulama Gerekli');
    }
  }

  // Belirtilen kullanıcı ID'sine göre kiralamaları yükler
  loadRentalsForUser(userId: number | undefined): void {
    if (userId === undefined) {
      this.toastr.error('Kiralamaları görüntülemek için kullanıcının giriş yapmış olması gerekir.', 'Kimlik Doğrulama Gerekli');
      return;
    }
  
    this.rentalService.getRentalsByUserId(userId, this.currentPage, this.pageSize, this.status, this.searchQuery).subscribe({
      next: (response: PagedResult<RentalDto>) => {
        this.rentals = response.items;
        this.totalItems = response.totalCount;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      },
      error: (error) => {
        this.toastr.error('Kiralama bilgileri yüklenemedi.', 'Error!');
      }
    });
  }

  // Sayfa numaralarını döndürür
  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Önceki sayfaya gider
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRentalsForUser(this.userId);
    }
  }

  // Sonraki sayfaya gider
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRentalsForUser(this.userId);
    }
  }

  // Belirtilen sayfaya gider
  goToPage(page: number) {
    this.currentPage = page;
    this.loadRentalsForUser(this.userId);
  }

  // Sayfa değiştiğinde çağrılır
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRentalsForUser(this.userId);
  }

  // Durum değiştiğinde çağrılır
  onStatusChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.status = selectElement.value ? parseInt(selectElement.value) as RentalStatus : undefined;
    this.loadRentalsForUser(this.userId);
  }

  // Arama değiştiğinde çağrılır
  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.currentPage = 1; // Sayfayı sıfırla
    this.loadRentalsForUser(this.userId);
  }

  // Kiralamayı iptal eder
  cancelRental(rental: RentalDto): void {
    if (rental.status !== 'Pending') { // Sadece beklemede olan kiralamalar iptal edilebilir
      this.toastr.error('Sadece beklemede olan kiralamalar iptal edilebilir.', 'İptal Hatası');
      return;
    }

    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu kiralamayı iptal etmek istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, iptal et!',
      cancelButtonText: 'Hayır, iptal etme'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rentalService.cancelRental(rental.rentalId).subscribe(
          () => {
            Swal.fire('İptal edildi!', 'Kiralama iptal edildi.', 'success');
            this.loadRentalsForUser(this.userId); // Kiralamaları yeniden yükle
          },
          (error: any) => {
            Swal.fire('Hata!', 'Kiralama iptal edilirken bir hata oluştu.', 'error');
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
}
