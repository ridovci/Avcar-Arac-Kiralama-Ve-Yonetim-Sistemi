import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdditionalRentalProduct, Rental, RentalDto, RentalRequestModel, RentalStatus } from '../models/rental.model';
import { PagedResult } from './vehicle.service';
import { Vehicle } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class RentalService {

  private apiUrl = 'http://localhost:5000/api'; // API'nin temel URL'si

  constructor(private http: HttpClient) { }

  // En çok kiralanan araçları getiren fonksiyon
  getTopRentedVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/rentals/top-rented-vehicles`);
  }

  // Belirli bir konumu ID ile getiren fonksiyon
  getLocations(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/locations/${id}`);
  }

  // Tüm konumları getiren fonksiyon
  getAllLocations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/locations`);
  }

  // Belirli bir konumu ID ile silen fonksiyon
  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/locations/${id}`);
  }

  // Belirli bir konumu güncelleyen fonksiyon
  updateLocation(location: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/locations/${location.locationId}`, location);
  }

  // Yeni bir konum ekleyen fonksiyon
  addLocation(location: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/locations/`, location);
  }

  // Belirli bir ek kiralama ürününü ID ile silen fonksiyon
  deleteAdditionalRentalProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/additional-rental-products/${id}`);
  }

  // Belirli bir ek kiralama ürününü güncelleyen fonksiyon
  updateAdditionalRentalProduct(additionalRentalProduct: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/additional-rental-products/${additionalRentalProduct.additionalRentalProductId}`, additionalRentalProduct);
  }

  // Yeni bir ek kiralama ürünü ekleyen fonksiyon
  addAdditionalRentalProduct(additionalRentalProduct: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/additional-rental-products/`, additionalRentalProduct);
  }

  // Yeni bir kiralama oluşturan fonksiyon
  createRental(rentalData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rentals`, rentalData);
  }

  // Tüm ek kiralama ürünlerini getiren fonksiyon
  getAdditionalRentalProducts(): Observable<AdditionalRentalProduct[]> {
    return this.http.get<AdditionalRentalProduct[]>(`${this.apiUrl}/additional-rental-products/`);
  }

  // Belirli bir ek kiralama ürününü ID ile getiren fonksiyon
  getAdditionalRentalProduct(id: number): Observable<AdditionalRentalProduct> {
    return this.http.get<AdditionalRentalProduct>(`${this.apiUrl}/additional-rental-products/${id}`);
  }  

  // Belirli bir kiralama için ek kiralama ürünlerini getiren fonksiyon
  getAdditionalProductsForRental(rentalId: number): Observable<AdditionalRentalProduct[]> {
    return this.http.get<AdditionalRentalProduct[]>(`${this.apiUrl}/additional-rental-products/by-rental/${rentalId}`);
  }  

  // Belirli bir kiralamayı ID ile getiren fonksiyon
  getRentalById(id: number): Observable<Rental> {
    return this.http.get<Rental>(`${this.apiUrl}/rentals/${id}`);
  }

  // Belirli bir kiralamayı güncelleyen fonksiyon
  updateRental(id: number, rentalRequest: RentalRequestModel): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/rentals/${id}`, rentalRequest);
  }

  // Kiralama listesini getiren fonksiyon, sayfalama ve filtreleme destekli
  getRentals(page: number = 1, pageSize: number = 5, status?: RentalStatus, searchQuery?: string): Observable<PagedResult<RentalDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (status !== undefined) {
      params = params.set('status', status.toString());
    }

    if (searchQuery) {
      params = params.set('searchQuery', searchQuery);
    }

    return this.http.get<PagedResult<RentalDto>>(`${this.apiUrl}/rentals`, { params });
  }

  // Belirli bir kiralamayı ID ile silen fonksiyon
  deleteRental(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rentals/${id}`);
  }

  // Bekleyen kiralama sayısını getiren fonksiyon
  pendingCounter(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rentals/pending-counter`);
  }

  // Toplam kiralama sayısını getiren fonksiyon
  rentalsCounter(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rentals/counter`);
  } 

  // Bekleyen kiralamaları getiren fonksiyon, sayfalama destekli
  getPendingRentals(page: number, pageSize: number): Observable<PagedResult<RentalDto>> {
    return this.http.get<PagedResult<RentalDto>>(`${this.apiUrl}/rentals/pending?page=${page}&pageSize=${pageSize}`);
  }

    // Tamamlanacak kiralamaları getiren fonksiyon, sayfalama destekli
    getCompletedRentals(page: number, pageSize: number): Observable<PagedResult<RentalDto>> {
      return this.http.get<PagedResult<RentalDto>>(`${this.apiUrl}/rentals/completed?page=${page}&pageSize=${pageSize}`);
    }
 

  // Belirli bir kiralamayı onaylayan fonksiyon
  approveRental(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/rentals/approve/${id}`, {});
  }

    // Belirli bir kiralamayı tamamlandı yapan fonksiyon
    completeRental(id: number): Observable<void> {
      return this.http.put<void>(`${this.apiUrl}/rentals/complete/${id}`, {});
    }

  // Belirli bir kiralamayı iptal eden fonksiyon
  cancelRental(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/rentals/cancel/${id}`, {});
  }

  // Belirli bir kullanıcının kiralamalarını getiren fonksiyon, sayfalama ve filtreleme destekli
  getRentalsByUserId(userId: number, page: number = 1, pageSize: number = 5, status?: RentalStatus, searchQuery?: string): Observable<PagedResult<RentalDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('rentalUserId', userId.toString());

    if (status !== undefined) {
      params = params.set('status', status.toString());
    }

    if (searchQuery) {
      params = params.set('searchQuery', searchQuery);
    }

    return this.http.get<PagedResult<RentalDto>>(`${this.apiUrl}/rentals`, { params });
  }

  // Ödeme işlemi oluşturan fonksiyon
  createPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rentals/payment`, paymentData);
  }

}
