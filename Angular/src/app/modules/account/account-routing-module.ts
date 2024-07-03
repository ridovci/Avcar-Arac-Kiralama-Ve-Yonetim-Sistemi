import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from './account.component';

import { AccountGuard } from '../../guards/account.guard';
import { ProfileComponent } from './profile/profile.component';
import { RentalComponent } from './rental/rental.component';
import { RentalsComponent } from '../admin/rentals/rentals.component';
import { UsersComponent } from '../admin/users/users.component';

// Route yapılandırması
const routes: Routes = [
  { 
    path: '', // Ana yol
    component: AccountComponent, // Ana bileşen
    canActivate: [AccountGuard], // Guard ile koruma
    children: [ // Alt yollar
      { path: '',  component: ProfileComponent }, // Profili göster
      { path: 'profile', component: ProfileComponent }, // Profili göster
      { path: 'rental', component: RentalComponent }, // Kiralama bileşenini göster
    ]
  },
  { path: '**', redirectTo: '/not-found' } // Tanımlanmamış yollar için yönlendirme
];

@NgModule({
  imports: [RouterModule.forChild(routes)], // Router modülünü içe aktar
  exports: [RouterModule] // Router modülünü dışa aktar
})
export class AccountRoutingModule { }
