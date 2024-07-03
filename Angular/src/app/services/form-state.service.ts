import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root' // Bu servis uygulamanın kök seviyesinde kullanılabilir
})
export class FormStateService {
  private formStateSubject = new BehaviorSubject<any>(null); // Form durumunu tutan BehaviorSubject
  formState$ = this.formStateSubject.asObservable(); // Form durumunu gözlemlemek için kullanılan observable

  // Form durumunu ayarlayan fonksiyon
  setFormState(state: any) {
    this.formStateSubject.next(state);
  }

  // Mevcut form durumunu döndüren fonksiyon
  getFormState() {
    return this.formStateSubject.value;
  }
}