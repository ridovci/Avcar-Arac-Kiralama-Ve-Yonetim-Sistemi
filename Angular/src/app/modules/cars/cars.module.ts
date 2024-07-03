import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarsComponent } from './cars.component';
import { CarsRoutingModule } from './cars-routing.module';
import { SharedModule } from "../shared/shared.module";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CarDetailsComponent } from './car-details/car-details.component';
import { RentalModalComponent } from './rental-modal/rental-modal.component';
import { RentalPayComponent } from './rental-pay/rental-pay.component';
import { RentalThanksComponent } from './rental-thanks/rental-thanks.component';



@NgModule({
    declarations: [
        CarsComponent,
        CarDetailsComponent,
        RentalModalComponent,
        RentalPayComponent,
        RentalThanksComponent
    ],
    imports: [
        CommonModule,
        CarsRoutingModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule
    ]
})
export class CarsModule { }
