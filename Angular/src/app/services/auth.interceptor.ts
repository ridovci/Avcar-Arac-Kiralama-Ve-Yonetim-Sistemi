import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Yerel depolamadan JWT token'ı alın
    const authToken = localStorage.getItem('Jwt_token'); 

    // Eğer token varsa, isteğe Authorization başlığı ekleyin
    if (authToken) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
    }

    // İsteği bir sonraki handle fonksiyonuna iletin
    return next.handle(req);
  }
}