import { Component, EventEmitter, OnInit } from '@angular/core';
import { Log } from '../../../models/log.model';
import { LogService } from '../../../services/log.service';
import { PagedResult } from '../../../models/rental.model';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css'
})
export class LogsComponent implements OnInit {
  logs: Log[] = []; // Log kayıtlarını tutan dizi
  searchQuery: string = ''; // Arama sorgusu
  totalItems = 0; // Toplam kayıt sayısı
  currentPage = 1; // Mevcut sayfa numarası
  pageSize = 20; // Sayfa başına kayıt sayısı
  totalPages = 0; // Toplam sayfa sayısı
  pageChange: EventEmitter<number> = new EventEmitter<number>(); // Sayfa değişikliklerini bildiren event emitter

  constructor(private logService: LogService) {}

  ngOnInit(): void {
    this.getLogs(); // Bileşen yüklendiğinde log kayıtlarını al
  }

  getLogs(): void {
    // Log kayıtlarını API'den almak için log servisini kullanır
    this.logService.getLogs(this.searchQuery, this.currentPage, this.pageSize).subscribe(
      result => {
        this.logs = result.items; // Alınan log kayıtlarını diziye atar
        this.totalItems = result.totalCount; // Toplam kayıt sayısını günceller
        this.totalPages = Math.ceil(this.totalItems / this.pageSize); // Toplam sayfa sayısını hesaplar
      },
      error => {
        console.error('Error loading log list:', error); // Hata durumunda konsola yazdırır
      }
    );
  }

  previousPage(): void {
    // Önceki sayfaya geçiş yapar
    if (this.currentPage > 1) {
      this.currentPage--;
      this.getLogs(); // Yeni sayfanın log kayıtlarını alır
    }
  }

  nextPage(): void {
    // Sonraki sayfaya geçiş yapar
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.getLogs(); // Yeni sayfanın log kayıtlarını alır
    }
  }

  goToPage(page: number): void {
    // Belirtilen sayfaya geçiş yapar
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.getLogs(); // Yeni sayfanın log kayıtlarını alır
    }
  }

  getPages(): number[] {
    // Sayfa numaralarının listesini oluşturur
    const pages: number[] = [];
    const maxPagesToShow = 5; // Gösterilecek maksimum sayfa numarası
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(this.currentPage - halfPagesToShow, 1);
    let endPage = Math.min(startPage + maxPagesToShow - 1, this.totalPages);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i); // Sayfa numaralarını diziye ekler
    }

    return pages; // Sayfa numaraları dizisini döner
  }

  onPageChange(page: number): void {
    // Sayfa değiştiğinde log kayıtlarını yeniden alır
    this.currentPage = page;
    this.getLogs();
  }

  onSearchChange(event: Event): void {
    // Arama sorgusu değiştiğinde log kayıtlarını yeniden alır
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.currentPage = 1;  // Sayfayı sıfırla
    this.getLogs();
  }
}
