import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountGuard } from './guards/account.guard'; // Hesap koruması
import { AdminGuard } from './guards/admin.guard'; // Yönetici koruması
import { NotFoundComponent } from './modules/not-found/not-found.component'; // 404 Bulunamadı bileşeni

const routes: Routes = [
  { 
    path: '', 
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule) // Ana sayfa modülünü yükler
  },
  { 
    path: 'register', 
    loadChildren: () => import('./modules/register/register.module').then(m => m.RegisterModule) // Kayıt modülünü yükler
  },
  { 
    path: 'login', 
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule) // Giriş modülünü yükler
  },
  { 
    path: 'cars', 
    loadChildren: () => import('./modules/cars/cars.module').then(m => m.CarsModule) // Araçlar modülünü yükler
  },
  { 
    path: 'account', 
    canActivate: [AccountGuard], // Hesap koruması kontrolü
    loadChildren: () => import('./modules/account/account.module').then(m => m.AccountModule) // Hesap modülünü yükler
  },
  { 
    path: 'admin', 
    canActivate: [AdminGuard], // Yönetici koruması kontrolü
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule) // Yönetici modülünü yükler
  },
  { 
    path: '**', 
    component: NotFoundComponent // 404 Bulunamadı bileşeni
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Ana yönlendirme modülü ile rotaları yükler
  exports: [RouterModule] // Yönlendirme modülünü dışa aktarır
})
export class AppRoutingModule { }
