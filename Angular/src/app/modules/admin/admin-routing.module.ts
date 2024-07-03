import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { UsersComponent } from './users/users.component';
import { CarsAdminComponent } from './cars/cars-admin.component';
import { RentalsComponent } from './rentals/rentals.component';
import { AdminGuard } from '../../guards/admin.guard';
import { AdminContextComponent } from './admin-context/admin-context.component';
import { CarsEditComponent } from './cars/cars-edit/cars-edit.component';
import { CarSettingsComponent } from './cars/settings/car-settings.component';
import { RentalsSettingsComponent } from './rentals/settings/rentals-settings.component';
import { RentalEditComponent } from './rentals/edit/rental-edit.component';
import { UserEditComponent } from './users/user-edit/user-edit.component';
import { NotFoundComponent } from '../not-found/not-found.component';
import { UserAddComponent } from './users/user-add/user-add.component';
import { CarsAddComponent } from './cars/cars-add/cars-add/cars-add.component';
import { RentalAddComponent } from './rentals/add/rental-add.component';
import { LogsComponent } from './logs/logs.component';

const routes: Routes = [
  { 
    path: '', 
    component: AdminComponent, // AdminComponent rotası
    canActivate: [AdminGuard], // AdminGuard tarafından korunuyor
    children: [
      { path: '', component: AdminContextComponent }, // Admin ana sayfası
      { path: 'users', component: UsersComponent }, // Kullanıcı yönetimi sayfası
      { path: 'users/edit/:id', component: UserEditComponent }, // Kullanıcı düzenleme sayfası
      { path: 'users/add', component: UserAddComponent }, // Yeni kullanıcı ekleme sayfası
      { path: 'rentals', component: RentalsComponent }, // Kiralama yönetimi sayfası
      { path: 'rentals/settings', component: RentalsSettingsComponent }, // Kiralama ayarları sayfası
      { path: 'rentals/edit/:id', component: RentalEditComponent }, // Kiralama düzenleme sayfası
      { path: 'rentals/add', component: RentalAddComponent }, // Yeni kiralama ekleme sayfası
      { path: 'cars', component: CarsAdminComponent }, // Araç yönetimi sayfası
      { path: 'cars/settings', component: CarSettingsComponent }, // Araç ayarları sayfası
      { path: 'cars/edit/:id', component: CarsEditComponent }, // Araç düzenleme sayfası
      { path: 'cars/add', component: CarsAddComponent }, // Yeni araç ekleme sayfası
      { path: 'logs', component: LogsComponent }, // Log izleme sayfası
      { path: '**', redirectTo: '/not-found' } // Tanımsız rota olduğunda not-found sayfasına yönlendir
    ]
  },
  { path: '**', component: NotFoundComponent }, // Tanımsız rota için not-found bileşeni
];

@NgModule({
  imports: [RouterModule.forChild(routes)], // Çocuk rotaları içeren modülü ekle
  exports: [RouterModule] // RouterModule'u dışa aktar
})
export class AdminRoutingModule { }
