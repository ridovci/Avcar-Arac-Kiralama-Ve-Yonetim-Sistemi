import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Log } from '../models/log.model';
import { PagedResult } from './vehicle.service';

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class LogService {
  private apiUrl = 'http://localhost:5000/api'; // API'nin temel URL'si
  constructor(private http: HttpClient) { }

  // Log kayıtlarını getiren fonksiyon
  getLogs(searchQuery: string, page: number, pageSize: number): Observable<PagedResult<Log>> {
    // HTTP parametrelerini ayarla
    let params = new HttpParams()
      .set('searchQuery', searchQuery)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    // HTTP GET isteği ile log kayıtlarını al
    return this.http.get<PagedResult<Log>>(`${this.apiUrl}/logs`, { params });
  }
}