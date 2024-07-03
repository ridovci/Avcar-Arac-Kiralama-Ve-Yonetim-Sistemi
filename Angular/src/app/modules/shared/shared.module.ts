import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';
import { FooterDashboardComponent } from './footer-dashboard/footer-dashboard.component';
import { HeaderDashboardComponent } from './header-dashboard/header-dashboard.component';
import { SidebarAccountComponent } from './sidebar-account/sidebar-account.component';

@NgModule({
  declarations: [
    HeaderComponent, // Header bileşenini modüle dahil eder
    HeaderDashboardComponent, // HeaderDashboard bileşenini modüle dahil eder
    FooterComponent, // Footer bileşenini modüle dahil eder
    FooterDashboardComponent, // FooterDashboard bileşenini modüle dahil eder
    SidebarAccountComponent, // SidebarAccount bileşenini modüle dahil eder
  ],
  imports: [
    CommonModule, // Ortak Angular direktiflerini ve pipe'ları sağlayan modül
    RouterModule  // Router ile ilgili direktifleri ve servisleri sağlayan modül
  ],
  exports: [
    HeaderComponent, // Header bileşenini diğer modüller tarafından kullanılabilir hale getirir
    HeaderDashboardComponent, // HeaderDashboard bileşenini diğer modüller tarafından kullanılabilir hale getirir
    FooterComponent, // Footer bileşenini diğer modüller tarafından kullanılabilir hale getirir
    FooterDashboardComponent, // FooterDashboard bileşenini diğer modüller tarafından kullanılabilir hale getirir
    SidebarAccountComponent, // SidebarAccount bileşenini diğer modüller tarafından kullanılabilir hale getirir
  ]
})
export class SharedModule { }
