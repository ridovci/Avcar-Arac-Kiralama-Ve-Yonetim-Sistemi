import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { PagedResult, Role, User, UserDto } from '../models/user.model';
import { Log } from '../models/log.model';

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class AccountService {
  private apiUrl = 'http://localhost:5000/api'; // API'nin temel URL'si
  constructor(private http: HttpClient) { }

  // Kullanıcı girişi fonksiyonu
  login(email: string, password: string): Observable<any> {
    // Giriş için gerekli olan verileri içeren nesne
    let body = {
      email: email,
      password: password
    };
    // HTTP POST isteği ile giriş yapma
    return this.http.post<any>(`${this.apiUrl}/users/login`, body);
  }

  // Kullanıcı kaydı fonksiyonu
  register(
    email: string,
    password: string,
    tcNumber: string,
    mobilePhone: string,
    mobilePhoneBackup: string,
    firstName: string,
    lastName: string,
    genderCode: number,
    dateOfBirth: Date,
    driverLicenseIssueDate: Date,
    driverLicenseClass: string,
    driverLicenseNumber: string,
    roleId: number
  ): Observable<any> {
    // Kayıt için gerekli olan verileri içeren nesne
    let body = {
      email: email,
      passwordHash: password,
      tcNumber: String(tcNumber),
      roleId: roleId,
      registrationDate: new Date(),
      userContactInfo: {
        mobilePhone: mobilePhone,
        mobilePhoneBackup: mobilePhoneBackup
      },
      userpersonalInfo: {
        firstName: firstName,
        lastName: lastName,
        genderCode: genderCode,
        dateOfBirth: dateOfBirth
      },
      userlicenseInfo: {
        driverLicenseIssueDate: driverLicenseIssueDate,
        driverLicenseClass: driverLicenseClass,
        driverLicenseNumber: driverLicenseNumber
      }
    };
    // HTTP POST isteği ile kayıt yapma
    return this.http.post<any>(`${this.apiUrl}/users/register`, body);
  }

  // Roller listesini getiren fonksiyon
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/users/roles`);
  }

  // Kullanıcı listesini getiren fonksiyon
  getUserList(searchQuery: string, page: number, pageSize: number, sortField: string): Observable<PagedResult<UserDto>> {
    // HTTP parametrelerini ayarla
    let params = new HttpParams()
      .set('searchQuery', searchQuery)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sort', sortField);
    // HTTP GET isteği ile kullanıcı listesini al
    return this.http.get<PagedResult<UserDto>>(`${this.apiUrl}/users/user-list`, { params });
  }

  // Belirli bir kullanıcıyı ID ile getiren fonksiyon
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  // Belirli bir kullanıcıyı TC kimlik numarası ile getiren fonksiyon
  getTCtoUser(tc: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/tc/${tc}`);
  }

  // Kullanıcıları sorguya göre arayan fonksiyon
  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/search?query=${query}`);
  }

  // Belirli bir kullanıcıyı ID ile silen fonksiyon
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // Admin tarafından kullanıcıyı güncelleyen fonksiyon
  updateUserByAdmin(userId: number, updatedUser: any): Observable<any> {
    return this.http.request('PUT', `${this.apiUrl}/users/admin-update/${userId}`, {
      body: updatedUser,
      responseType: 'text' 
    });
  }

  // Kullanıcı tarafından kendi bilgilerini güncelleyen fonksiyon
  updateUserByUser(userId: number, updatedUser: any): Observable<any> {
    return this.http.request('PUT', `${this.apiUrl}/users/self-update/${userId}`, {
      body: updatedUser,
      responseType: 'text' 
    });
  }

  // Kullanıcı sayısını getiren fonksiyon
  usersCounter(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/counter`);
  }

}
