import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class GlobalStateService {
  private menuOpen = new BehaviorSubject<boolean>(false); // Menü açık/kapalı durumunu tutan BehaviorSubject
  menuOpen$ = this.menuOpen.asObservable(); // Menü durumunu gözlemlemek için kullanılan observable

  // Menü açık/kapalı durumunu değiştiren fonksiyon
  toggleMenu() {
    this.menuOpen.next(!this.menuOpen.value);
  }

  // Menü kapalı durumuna ayarlayan fonksiyon
  closeMenu() {
    this.menuOpen.next(false);
  }

}