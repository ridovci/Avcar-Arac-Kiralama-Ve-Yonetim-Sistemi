import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { Role, User } from '../models/user.model';
import { Model, Vehicle, VehicleFeature, VehicleFeatureAssignment, VehicleSearchCriteria } from '../models/vehicle.model';
import { DecimalPipe } from '@angular/common';

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class VehicleService {
  private apiUrl = 'http://localhost:5000/api'; // API'nin temel URL'si

  constructor(private http: HttpClient, private decimalPipe: DecimalPipe) { }

  // Belirli bir aracın detaylarını getiren fonksiyon
  getVehicleDetails(vehicleId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehicles/${vehicleId}`);
  }

  // Belirli bir aracın kiralama durumunu kontrol eden fonksiyon
  checkRentalStatus(vehicleId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/vehicles/check-rental-status?vehicleId=${vehicleId}`);
  }

  // Belirli bir markayı ID ile getiren fonksiyon
  getBrandById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/brands/${id}`);
  }

  // Belirli bir modeli ID ile getiren fonksiyon
  getModelById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/models/${id}`);
  }

  // Belirli bir araç tipini ID ile getiren fonksiyon
  getVehicleTypeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vehicle-types/${id}`);
  }

  // Belirli bir vites tipini ID ile getiren fonksiyon
  getGearTypeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/gear-types/${id}`);
  }

  // Belirli bir yakıt tipini ID ile getiren fonksiyon
  getFuelTypeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fuel-types/${id}`);
  }

  // Belirli bir rengi ID ile getiren fonksiyon
  getColorById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/colors/${id}`);
  }

  // Belirli bir klima tipini ID ile getiren fonksiyon
  getAirConditioningById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/air-conditionings/${id}`);
  }

  // Belirli bir konumu ID ile getiren fonksiyon
  getLocationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/locations/${id}`);
  }

  // Belirli bir aracın özelliklerini getiren fonksiyon
  getVehicleFeaturesById(vehicleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vehicle-feature-assignments/by-vehicle/${vehicleId}`).pipe(
      switchMap((assignments: any[]) => {
        const featureRequests = assignments.map(a => this.http.get<any>(`${this.apiUrl}/vehicle-features/${a.vehicleFeaturesId}`));
        return forkJoin(featureRequests);
      })
    );
  }

  // Araç listesini getiren fonksiyon, sayfalama ve filtreleme destekli
  getVehicles(page: number, pageSize: number, sortField?: string, sortOrder?: string, status?: number, searchQuery?: string): Observable<PagedResult<Vehicle>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (sortField && sortOrder) {
      params = params.set('sortField', sortField).set('sortOrder', sortOrder);
    }

    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }

    if (searchQuery) {
      params = params.set('searchQuery', searchQuery);
    }

    return this.http.get<PagedResult<Vehicle>>(`${this.apiUrl}/vehicles`, { params });
  }

  // Tüm araç tiplerini getiren fonksiyon
  getVehicleTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vehicle-types`);
  }

  // Tüm vites tiplerini getiren fonksiyon
  getGearTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/gear-types`);
  }

  // Tüm yakıt tiplerini getiren fonksiyon
  getFuelTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fuel-types`);
  }

  // Tüm renkleri getiren fonksiyon
  getColors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/colors`);
  }

  // Tüm klima tiplerini getiren fonksiyon
  getAirConditionings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/air-conditionings`);
  }

  // Tüm araç özelliklerini getiren fonksiyon
  getVehicleFeatures(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vehicle-features`);
  }

  // Tüm konumları getiren fonksiyon
  getLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/locations`);
  }

  // Tüm markaları getiren fonksiyon
  getBrands(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/brands`);
  }

  // Belirli bir markayı ID ile silen fonksiyon
  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/brands/${id}`);
  }

  // Belirli bir markayı güncelleyen fonksiyon
  updateBrand(brand: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/brands/${brand.brandId}`, brand);
  }

  // Yeni bir marka ekleyen fonksiyon
  addBrand(brand: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/brands/`, brand);
  }

  // Belirli bir markanın modellerini getiren fonksiyon
  getModels(brandId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/models/by-brand?brandId=${brandId}`);
  }

  // Yeni bir model ekleyen fonksiyon
  addModel(model: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/models/`, model);
  }

  // Belirli bir modeli güncelleyen fonksiyon
  updateModel(model: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/models/${model.modelId}`, model);
  }

  // Belirli bir modeli ID ile silen fonksiyon
  deleteModel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/models/${id}`);
  }

  // Belirli bir araç tipini ID ile silen fonksiyon
  deleteVehicleType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehicle-types/${id}`);
  }

  // Belirli bir araç tipini güncelleyen fonksiyon
  updateVehicleType(vehicleType: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/vehicle-types/${vehicleType.vehicleTypeId}`, vehicleType);
  }

  // Yeni bir araç tipi ekleyen fonksiyon
  addVehicleType(vehicleType: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/vehicle-types/`, vehicleType);
  }

  // Belirli bir vites tipini ID ile silen fonksiyon
  deleteGearType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/gear-types/${id}`);
  }

  // Belirli bir vites tipini güncelleyen fonksiyon
  updateGearType(gearType: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/gear-types/${gearType.gearTypeId}`, gearType);
  }

  // Yeni bir vites tipi ekleyen fonksiyon
  addGearType(gearType: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/gear-types/`, gearType);
  }

  // Belirli bir yakıt tipini ID ile silen fonksiyon
  deleteFuelType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/fuel-types/${id}`);
  }

  // Belirli bir yakıt tipini güncelleyen fonksiyon
  updateFuelType(fuelType: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/fuel-types/${fuelType.fuelTypeId}`, fuelType);
  }

  // Yeni bir yakıt tipi ekleyen fonksiyon
  addFuelType(fuelType: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fuel-types/`, fuelType);
  }

  // Belirli bir rengi ID ile silen fonksiyon
  deleteColor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/colors/${id}`);
  }

  // Belirli bir rengi güncelleyen fonksiyon
  updateColor(color: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/colors/${color.colorId}`, color);
  }

  // Yeni bir renk ekleyen fonksiyon
  addColor(color: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/colors/`, color);
  }

  // Belirli bir klima tipini ID ile silen fonksiyon
  deleteAirConditioning(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/air-conditionings/${id}`);
  }

  // Belirli bir klima tipini güncelleyen fonksiyon
  updateAirConditioning(airConditioning: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/air-conditionings/${airConditioning.airConditioningId}`, airConditioning);
  }

  // Yeni bir klima tipi ekleyen fonksiyon
  addAirConditioning(airConditioning: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/air-conditionings`, airConditioning);
  }

  // Belirli bir araç özelliğini ID ile silen fonksiyon
  deleteVehicleFeature(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehicle-features/${id}`);
  }

  // Belirli bir araç özelliğini güncelleyen fonksiyon
  updateVehicleFeature(vehicleFeature: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/vehicle-features/${vehicleFeature.vehicleFeatureId}`, vehicleFeature);
  }

  // Yeni bir araç özelliği ekleyen fonksiyon
  addVehicleFeature(vehicleFeature: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/vehicle-features`, vehicleFeature);
  }

  // Yeni bir araç ekleyen fonksiyon
  addVehicle(vehicleData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/vehicles`, vehicleData);
  }

  // Belirli bir aracı güncelleyen fonksiyon
  updateVehicle(vehicleData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/vehicles/${vehicleData.vehicleId}`, vehicleData);
  }

  // Belirli bir aracı ID ile silen fonksiyon
  deleteVehicle(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/vehicles/${id}`);
  }

  // Belirli bir aracı ID ile getiren fonksiyon
  getVehicleById(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.apiUrl}/vehicles/${id}`);
  }

  // Belirli bir plakaya göre aracı getiren fonksiyon
  getVehicleByPlate(plate: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.apiUrl}/vehicles/by-plate/${plate}`);
  }

  // Hata yönetimi fonksiyonu
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  // Araç sayısını getiren fonksiyon
  vehiclesCounter(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehicles/counter`);
  }

  // Bakımdaki araçları getiren fonksiyon
  getMaintenanceVehicleList(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles/maintenance`);
  }

  // Araç durumunun açıklamasını döndüren fonksiyon
  getStatusDescription(status: number): string {
    switch (status) {
      case 0:
        return 'Arızalı';
      case 1:
        return 'Bakımda';
      case 2:
        return 'Kirada';
      case 3:
        return 'Müsait';
      default:
        return 'Bilinmiyor';
    }
  }

  // Araç arama fonksiyonu, sayfalama destekli
  searchVehicles(criteria: VehicleSearchCriteria, page: number, pageSize: number): Observable<PagedResult<Vehicle>> {
    const url = `${this.apiUrl}/vehicles/search?page=${page}&pageSize=${pageSize}`;
    return this.http.post<PagedResult<Vehicle>>(url, criteria);
  }

  // Fiyatı biçimlendiren fonksiyon
  formatPrice(price: number): string {
    const formattedPrice = this.decimalPipe.transform(price, '1.2-2', 'tr-TR');
    return formattedPrice ? `${formattedPrice} ₺` : '';
  }

}
