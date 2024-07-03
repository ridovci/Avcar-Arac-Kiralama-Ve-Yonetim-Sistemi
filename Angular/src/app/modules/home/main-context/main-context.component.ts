import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { RentalService } from '../../../services/rental.service';
import { Locations } from '../../../models/location.model';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-main-context', // Bu bileşenin HTML etiket adı
  templateUrl: './main-context.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrls: ['./main-context.component.css'] // Bileşen için kullanılan stil dosyasının yolu
})
export class MainContextComponent implements OnInit {
  locations!: Locations[]; // Konumları tutan değişken
  vehicleSearchForm!: FormGroup; // Araç arama formu

  // RentalService, FormBuilder ve Router bağımlılıklarını enjekte ediyoruz
  constructor(private rentalService: RentalService, private fb: FormBuilder, private router: Router) {
    // Başlangıçta hataları önlemek için boş bir form grubu oluşturuyoruz
    this.vehicleSearchForm = this.fb.group({
      departureLocationId: ['', Validators.required],
      arrivalLocationId: ['', Validators.required],
      rentalDate: new FormControl('', [Validators.required, this.validateRentalDate.bind(this)]),
      returnDate: ['', Validators.required]
    }, { validators: this.validateDateRange });
  }

  // Tarih aralığını doğrulayan fonksiyon
  validateDateRange(group: FormGroup): { [key: string]: any } | null {
    const rental = new Date(group.get('rentalDate')!.value);
    const returnDate = new Date(group.get('returnDate')!.value);

    if (rental && returnDate && returnDate <= rental) {
      return { 'dateRangeInvalid': true };
    }
    return null;
  }

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    this.getAllLocations();
  }

  // Formu başlatan fonksiyon
  initializeForm(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

    // Konumlar yüklendikten sonra formu güncelle
    this.vehicleSearchForm.setValue({
      departureLocationId: this.locations[0]?.locationId || '',
      arrivalLocationId: this.locations[0]?.locationId || '',
      rentalDate: this.formatDate(tomorrow),
      returnDate: this.formatDate(dayAfterTomorrow)
    });
  }

  // Tüm konumları getiren fonksiyon
  getAllLocations(): void {
    this.rentalService.getAllLocations().subscribe({
      next: (data) => {
        this.locations = data;
        if (data.length > 0) {
          this.initializeForm(); // Veriler yüklendikten sonra formu başlat
        }
      },
      error: (error) => {
        console.error('Konumlar yüklenirken hata oluştu:', error);
      }
    });
  }

  // Tarihi YYYY-MM-DD formatında biçimlendiren fonksiyon
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Formu gönderme işlemi
  submitForm() {
    this.vehicleSearchForm.markAllAsTouched(); // Tüm alanları touched olarak işaretle

    if (this.vehicleSearchForm.invalid) {
      let errorMessages: string[] = [];

      if (this.vehicleSearchForm.get('rentalDate')!.errors?.['invalidDate']) {
        errorMessages.push('Alış tarihi bugünden önce olamaz.');
      }

      if (this.vehicleSearchForm.errors?.['dateRangeInvalid']) {
        errorMessages.push('İade tarihi, alış tarihinden sonra bir tarih olmalıdır.');
      }

      this.showError(errorMessages.join('<br>'));
      return;
    }

    this.router.navigate(['/cars'], {
      state: {
        departureLocationId: this.vehicleSearchForm.value.departureLocationId,
        rentalDate: this.vehicleSearchForm.value.rentalDate,
        returnDate: this.vehicleSearchForm.value.returnDate,
        arrivalLocationId: this.vehicleSearchForm.value.arrivalLocationId,
      }
    });
    window.scrollTo(0, 0);
  }

  // Alış tarihini doğrulayan fonksiyon
  validateRentalDate(control: FormControl): { [key: string]: any } | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Saat kısmını 00:00:00 yap
    const selectedDate = new Date(control.value);

    if (selectedDate < today) {
      return { 'invalidDate': true }; // Seçilen tarih bugünden önceyse hata döndür
    }
    return null;
  }

  // Hata mesajını gösteren fonksiyon
  showError(errorMsg: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Dikkat!',
      html: errorMsg, // <br> etiketlerini yorumlamak için html kullan
      confirmButtonText: 'Tamam'
    });
  }
}
