import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class SidebarService {
  private sidebarOpen = new BehaviorSubject<boolean>(false); // Sidebar açık/kapalı durumunu tutan BehaviorSubject
  sidebarOpen$ = this.sidebarOpen.asObservable(); // Sidebar durumunu gözlemlemek için kullanılan observable

  // Sidebar açık/kapalı durumunu değiştiren fonksiyon
  toggleSidebar() {
    this.sidebarOpen.next(!this.sidebarOpen.value);
  }

  // Sidebar kapalı durumuna ayarlayan fonksiyon
  closeSidebar() {
    this.sidebarOpen.next(false);
  }
}