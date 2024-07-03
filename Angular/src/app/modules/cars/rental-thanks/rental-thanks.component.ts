import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rental-thanks', // Bu bileşenin HTML etiket adı
  templateUrl: './rental-thanks.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrl: './rental-thanks.component.css' // Bileşen için kullanılan stil dosyasının yolu
})

export class RentalThanksComponent implements OnInit {
  rentalId!: number; // Kiralama ID'si
  paymentId!: number; // Ödeme ID'si

  // Router servisini enjekte eden constructor
  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation(); // Mevcut yönlendirme bilgisini al
    if (navigation?.extras.state) {
      // Yönlendirme durumunda rentalId ve paymentId varsa, değişkenlere ata
      this.rentalId = navigation.extras.state['rentalId'];
      this.paymentId = navigation.extras.state['paymentId'];
    }
  }

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    window.scrollTo(0, 0);
    // Eğer rentalId veya paymentId yoksa, hata mesajı göster ve ana sayfaya yönlendir
    if (!this.rentalId || !this.paymentId) {
      console.log("Kiralama ve ödeme bilgisi alınamadı!"); // Hata mesajı
      this.router.navigate(['/']); // Ana sayfaya yönlendir
      return;
    }
  }
}
