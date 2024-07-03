import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home-routing.module';
import { MainContextComponent } from './main-context/main-context.component';
import { MostRentalsComponent } from './most-rentals/most-rentals.component'; // Import the routing module
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { RecommenderAiComponent } from './recommender-ai/recommender-ai.component';

@NgModule({
  declarations: [HomeComponent, MainContextComponent, MostRentalsComponent, RecommenderAiComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class HomeModule { }
