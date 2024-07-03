import { Component, OnInit } from '@angular/core';
import { RentalService } from '../../../services/rental.service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Vehicle } from '../../../models/vehicle.model';
import { VehicleService } from '../../../services/vehicle.service';

@Component({
  selector: 'app-most-rentals', // Bu bileşenin HTML etiket adı
  templateUrl: './most-rentals.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrl: './most-rentals.component.css' // Bileşen için kullanılan stil dosyasının yolu
})
export class MostRentalsComponent implements OnInit {
  vehicles: Vehicle[] = []; // En çok kiralanan araçları tutan dizi

  // RentalService ve VehicleService bağımlılıklarını enjekte ediyoruz
  constructor(private rentalService: RentalService, private vehicleService: VehicleService) {}

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    this.getTopRentedVehicles().subscribe((response: any) => {
      this.vehicles = response; // En çok kiralanan araçları al ve vehicles dizisine ata
    });
  }

  // En çok kiralanan araçları getiren fonksiyon
  getTopRentedVehicles(): Observable<any> {
    return this.rentalService.getTopRentedVehicles();
  }

  // Fiyatı biçimlendiren fonksiyon
  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price);
  }

  // İki tarih arasındaki gün farkını hesaplayan fonksiyon
  calculateDateDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInTime = end.getTime() - start.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24); // Milisaniye cinsinden farkı gün cinsine çevir
    return differenceInDays;
  }
}
