// admin.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminComponent } from './admin.component';
import { AdminContextComponent } from './admin-context/admin-context.component';
import { CarsAdminComponent } from './cars/cars-admin.component';
import { CarsEditComponent } from './cars/cars-edit/cars-edit.component';
import { CarSettingsComponent } from './cars/settings/car-settings.component';
import { RentalsComponent } from './rentals/rentals.component';
import { RentalEditComponent } from './rentals/edit/rental-edit.component';
import { RentalsSettingsComponent } from './rentals/settings/rentals-settings.component';
import { UsersComponent } from './users/users.component';
import { UserEditComponent } from './users/user-edit/user-edit.component';
import { UserAddComponent } from './users/user-add/user-add.component';
import { CarsAddComponent } from './cars/cars-add/cars-add/cars-add.component';
import { RouterModule } from '@angular/router';
import { RentalAddComponent } from './rentals/add/rental-add.component';
import { LogsComponent } from './logs/logs.component';

@NgModule({
  declarations: [
    AdminComponent, 
    AdminContextComponent, 
    CarsAdminComponent,
    CarsEditComponent,
    CarSettingsComponent,
    RentalsComponent,
    RentalEditComponent,
    RentalsSettingsComponent,
    UsersComponent,
    UserEditComponent,
    UserAddComponent,
    CarsAddComponent,
    RentalAddComponent,
    LogsComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule 
  ]
})
export class AdminModule { }
