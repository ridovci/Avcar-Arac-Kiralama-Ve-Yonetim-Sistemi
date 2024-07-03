import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../../services/account.service'; // AccountService servisini içe aktarır
import { UserDto } from '../../../models/user.model'; // UserDto modelini içe aktarır
import Swal from 'sweetalert2'; // SweetAlert2 kütüphanesini içe aktarır

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {

  users: UserDto[] = []; // Kullanıcıları tutan dizi
  searchQuery: string = ''; // Arama sorgusu
  selectedSortOption: number = 0; // Seçilen sıralama seçeneği
  totalItems = 0; // Toplam kullanıcı sayısı
  currentPage = 1; // Mevcut sayfa numarası
  pageSize = 5; // Sayfa başına kullanıcı sayısı
  totalPages = 0; // Toplam sayfa sayısı

  constructor(private accountService: AccountService) { }

  ngOnInit(): void {
    this.loadUserList(); // Bileşen yüklendiğinde kullanıcı listesini yükler
  }

  // Kullanıcı listesini yükler
  loadUserList(): void {
    const sortField = this.selectedSortOption.toString();
    this.accountService.getUserList(this.searchQuery, this.currentPage, this.pageSize, sortField)
      .subscribe(
        result => {
          this.users = result.items; // Kullanıcıları ayarlar
          this.totalItems = result.totalCount; // Toplam kullanıcı sayısını ayarlar
          this.totalPages = Math.ceil(this.totalItems / this.pageSize); // Toplam sayfa sayısını hesaplar
        },
        error => {
          console.error('Kullanıcı listesi yüklenirken hata oluştu:', error); // Hata durumunda konsola hata mesajı yazar
        }
      );
  }

  // Kullanıcıları sıralar
  sortUsers(): void {
    this.currentPage = 1; // Sayfayı sıfırlar
    this.loadUserList(); // Kullanıcı listesini yeniden yükler
  }

  // Kullanıcının yaşını hesaplar
  getAge(dateOfBirth?: Date): number | null {
    if (!dateOfBirth) {
      return null;
    }
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
      this.loadUserList();
    }
  }

  // Sonraki sayfaya gider
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUserList();
    }
  }

  // Belirtilen sayfaya gider
  goToPage(page: number) {
    this.currentPage = page;
    this.loadUserList();
  }

  // Sayfa değiştiğinde çağrılır
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUserList();
  }

  // Arama sorgusu değiştiğinde çağrılır
  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.currentPage = 1; // Sayfayı sıfırla
    this.loadUserList();
  }

  // Kullanıcıyı siler
  deleteUser(id: number): void {
    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu kullanıcıyı silmek istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'Hayır, iptal et'
    }).then((result) => {
      if (result.isConfirmed) {
        this.accountService.deleteUser(id).subscribe(
          () => {
            Swal.fire('Silindi!', 'Kullanıcı başarıyla silindi.', 'success');
            this.loadUserList(); // Kullanıcı listesini yeniden yükler
          },
          (error: any) => {
            Swal.fire('Hata!', 'Kullanıcı silinirken bir hata oluştu.', 'error');
          }
        );
      }
    });
  }

}
