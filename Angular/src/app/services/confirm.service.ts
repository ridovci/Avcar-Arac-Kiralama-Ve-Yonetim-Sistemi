import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class ConfirmService {

  // Kullanıcıdan bir eylemi onaylamasını isteyen fonksiyon
  confirmAction(message: string, action: () => void): void {
    Swal.fire({
      title: 'Emin misiniz?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, devam et!',
      cancelButtonText: 'Hayır, iptal et'
    }).then((result) => {
      if (result.isConfirmed) {
        action(); // Kullanıcı onaylarsa verilen eylemi gerçekleştir
      }
    });
  }

}