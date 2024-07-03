import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CarsComponent } from './cars.component';
import { CarDetailsComponent } from './car-details/car-details.component';
import { RentalPayComponent } from './rental-pay/rental-pay.component';
import { RentalThanksComponent } from './rental-thanks/rental-thanks.component';

// Yönlendirme yapılandırması
const routes: Routes = [
  { path: '', component: CarsComponent }, // Ana yol, CarsComponent'i gösterir
  { path: 'details', component: CarDetailsComponent }, // Araç detayları sayfası
  { path: 'pay', component: RentalPayComponent }, // Kiralama ödeme sayfası
  { path: 'thanks', component: RentalThanksComponent}, // Kiralama teşekkür sayfası
  { path: '**', redirectTo: '/not-found' } // Bulunamayan sayfalar için yönlendirme
];

@NgModule({
  imports: [RouterModule.forChild(routes)], // Yönlendirme yapılandırmasını modüle ekler
  exports: [RouterModule] // RouterModule'ü dışa aktarır, böylece diğer modüller bu yönlendirmeyi kullanabilir
})
export class CarsRoutingModule { }
