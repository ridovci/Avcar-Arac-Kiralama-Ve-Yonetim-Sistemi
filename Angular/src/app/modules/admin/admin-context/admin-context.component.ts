import { Component, OnInit } from '@angular/core';
import { RentalService } from '../../../services/rental.service';
import { VehicleService } from '../../../services/vehicle.service';
import { AccountService } from '../../../services/account.service';
import { PagedResult, RentalDto } from '../../../models/rental.model';
import Swal from 'sweetalert2';
import { Vehicle } from '../../../models/vehicle.model';

@Component({
  selector: 'app-admin-context',
  templateUrl: './admin-context.component.html',
  styleUrl: './admin-context.component.css'
})
export class AdminContextComponent implements OnInit {
  pendingCount: number = 0; // Bekleyen kiralamaların sayısını tutar
  vehiclesCount: number = 0; // Toplam araç sayısını tutar
  rentalsCount: number = 0; // Toplam kiralama sayısını tutar
  usersCount: number = 0; // Toplam kullanıcı sayısını tutar
  pendingRentals: RentalDto[] = []; // Bekleyen kiralamaların listesini tutar
  completedRentals: RentalDto[] = []; // Tamamlanacak kiralamaların listesini tutar
  maintenanceVehicleList: Vehicle[] = []; // Bakımda olan araçların listesini tutar
  currentPage: number = 1; // Şu anki sayfa numarası
  pageSize: number = 3; // Sayfa başına gösterilecek kiralama sayısı
  totalItems: number = 0; // Toplam kiralama sayısını tutar


  currentPageC: number = 1; // Şu anki sayfa numarası (Tamamlanacak kiralamalar için)
  pageSizeC: number = 3; // Sayfa başına gösterilecek kiralama sayısı (Tamamlanacak kiralamalar için)
  totalItemsC: number = 0; // Toplam kiralama sayısını tutar (Tamamlanacak kiralamalar için)

  constructor(private rentalService: RentalService, public vehicleService: VehicleService, private accountService: AccountService) {}

  ngOnInit(): void {
    // Component yüklendiğinde çalışacak metodlar
    this.getPendingRentals();
    this.getMaintenanceVehicleList();
    this.getCompletedRentals();

    // Bekleyen kiralamaların sayısını almak için rentalService kullanılır
    this.rentalService.pendingCounter().subscribe({
      next: (count) => {
        this.pendingCount = count;
      },
      error: (error) => {
        console.error("Bekleyen Bildirim sayısı alınamadı!", error)
      }
    });

    // Toplam kiralama sayısını almak için rentalService kullanılır
    this.rentalService.rentalsCounter().subscribe({
      next: (count) => {
        this.rentalsCount = count;
      },
      error: (error) => {
        console.error("Tüm kiralamaların sayısı alınamadı!", error)
      }
    });

    // Toplam araç sayısını almak için vehicleService kullanılır
    this.vehicleService.vehiclesCounter().subscribe({
      next: (count) => {
        this.vehiclesCount = count;
      },
      error: (error) => {
        console.error("Tüm araçların sayısı alınamadı!", error)
      }
    });

    // Toplam kullanıcı sayısını almak için accountService kullanılır
    this.accountService.usersCounter().subscribe({
      next: (count) => {
        this.usersCount = count;
      },
      error: (error) => {
        console.error("Tüm müşterilerin sayısı alınamadı!", error)
      }
    });
  }

  // Bakımda olan araçların listesini almak için metod
  getMaintenanceVehicleList(): void {
    this.vehicleService.getMaintenanceVehicleList().subscribe({
      next: (maintenanceVehicleList) => {
        this.maintenanceVehicleList = maintenanceVehicleList;
      },
      error: (error) => {
        console.error("Hata, Arızalı veya Bakımda olan araçlar görüntülenemedi:", error);
      }
    });
  }

  // Bekleyen kiralamaların listesini almak için metod
  getPendingRentals(): void {
    this.rentalService.getPendingRentals(this.currentPage, this.pageSize).subscribe({
      next: (result: PagedResult<RentalDto>) => {
        this.pendingRentals = result.items;
        this.totalItems = result.totalCount;
      },
      error: (error) => {
        console.log("Hata, Bekleyen kiralamalar görüntülenemedi", error);
      }
    });
  }

    // Tamamlanacak kiralamaların listesini almak için metod
    getCompletedRentals(): void {
      this.rentalService.getCompletedRentals(this.currentPageC, this.pageSizeC).subscribe({
        next: (result: PagedResult<RentalDto>) => {
          this.completedRentals = result.items;
          this.totalItemsC = result.totalCount;
        },
        error: (error) => {
          console.log("Hata, Bekleyen kiralamalar görüntülenemedi", error);
        }
      });
    }

  // Kiralamayı silmek için metod
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
            this.getPendingRentals(); // Silme işleminden sonra kiralama listesini güncelle
          },
          (error: any) => {
            Swal.fire('Hata!', 'Kiralama silinirken bir hata oluştu.', 'error');
          }
        );
      }
    });
  }

  // Kiralamayı onaylamak için metod
  approveRental(id: number): void {
    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu kiralamayı onaylamak istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, onayla!',
      cancelButtonText: 'Hayır, iptal et'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rentalService.approveRental(id).subscribe(
          () => {
            Swal.fire('Onaylandı!', 'Kiralama başarıyla onaylandı.', 'success');
            this.getPendingRentals(); // Onay işleminden sonra kiralama listesini güncelle
          },
          (error: any) => {
            Swal.fire('Hata!', 'Kiralama onaylanırken bir hata oluştu.', 'error');
          }
        );
      }
    });
  }

    // Kiralamayı tamamlamak için metod
    completeRental(id: number): void {
      Swal.fire({
        title: 'Emin misiniz?',
        text: 'Bu aracı teslim almak istediğinize emin misiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Evet, teslim al!',
        cancelButtonText: 'Hayır, iptal et'
      }).then((result) => {
        if (result.isConfirmed) {
          this.rentalService.completeRental(id).subscribe(
            () => {
              Swal.fire('Teslim alındı!', 'Araç başarıyla teslim alındı.', 'success');
              this.getCompletedRentals(); // teslim işleminden sonra kiralama listesini güncelle
            },
            (error: any) => {
              Swal.fire('Hata!', 'Araç teslim alınırken bir hata oluştu.', 'error');
            }
          );
        }
      });
    }

  // Kiralamayı iptal etmek için metod
  cancelRental(id: number): void {
    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu kiralamayı iptal etmek istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, iptal et!',
      cancelButtonText: 'Hayır, geri dön'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rentalService.cancelRental(id).subscribe(
          () => {
            Swal.fire('İptal edildi!', 'Kiralama başarıyla iptal edildi.', 'success');
            this.getPendingRentals(); // İptal işleminden sonra kiralama listesini güncelle
          },
          (error: any) => {
            Swal.fire('Hata!', 'Kiralama iptal edilirken bir hata oluştu.', 'error');
          }
        );
      }
    });
  }

  // İki tarih arasındaki gün farkını hesaplayan metod
  getDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Kiralama durumunu Türkçeye çeviren metod
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

  // Fiyatı formatlayan metod
  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price);
  }

  // Önceki sayfaya gitmek için metod
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.getPendingRentals();
    }
  }

    // Önceki sayfaya gitmek için metod
    previousPageC(): void {
      if (this.currentPageC > 1) {
        this.currentPageC--;
        this.getCompletedRentals();
      }
    }
  

  // Sonraki sayfaya gitmek için metod
  nextPage(): void {
    if (this.currentPage * this.pageSize < this.totalItems) {
      this.currentPage++;
      this.getPendingRentals();
    }
  }

    // Sonraki sayfaya gitmek için metod
    nextPageC(): void {
      if (this.currentPageC * this.pageSizeC < this.totalItemsC) {
        this.currentPageC++;
        this.getCompletedRentals();
      }
    }

  // Sayfa numaralarını almak için metod
  getPages(): number[] {
    return Array(Math.ceil(this.totalItems / this.pageSize)).fill(0).map((x, i) => i + 1);
  }

    // Sayfa numaralarını almak için metod
    getPagesC(): number[] {
      return Array(Math.ceil(this.totalItemsC / this.pageSizeC)).fill(0).map((x, i) => i + 1);
    }  

  // Belirli bir sayfaya gitmek için metod
  goToPage(page: number): void {
    this.currentPage = page;
    this.getPendingRentals();
  }

    // Belirli bir sayfaya gitmek için metod
    goToPageC(page: number): void {
      this.currentPageC = page;
      this.getCompletedRentals();
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
