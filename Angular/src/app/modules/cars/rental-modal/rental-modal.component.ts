import { Component, OnInit, Input } from '@angular/core';
import { AdditionalRentalProduct, RentalStatus } from '../../../models/rental.model';
import { RentalService } from '../../../services/rental.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DecimalPipe } from '@angular/common';
import { VehicleService } from '../../../services/vehicle.service';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-rental-modal', // Bu bileşenin HTML etiket adı
  templateUrl: './rental-modal.component.html', // Bileşen için kullanılan HTML şablonunun yolu
  styleUrls: ['./rental-modal.component.css'], // Bileşen için kullanılan stil dosyasının yolu
  providers: [DecimalPipe] // DecimalPipe'i sağlayıcı olarak ekleyin
})
export class RentalModalComponent implements OnInit {
  status!: RentalStatus.Pending; // Kiralama durumu (başlangıçta beklemede)
  baseRentalPrice!: number; // Temel kiralama fiyatı
  additionalProductsTotal!: number; // Ek ürünlerin toplam fiyatı

  // Kiralama verileri
  rentalData: any = {
    userId: '',
    vehicleId: '',
    rentalDate: '',
    returnDate: '',
    departureLocationId: '',
    arrivalLocationId: '',
    status: '',
    baseRentalPrice:'',
    additionalProductsTotal:'',
    additionalProductIds: [] // Ek ürün ID'leri dizisi
  };

  // Giriş (Input) değişkenler
  @Input() userId!: number;
  @Input() vehicleId!: number;
  @Input() rentalDate!: string;
  @Input() returnDate!: string;
  @Input() dateDifference!: number;
  @Input() dailyRentalFee!: number;
  @Input() discountRate!: number;
  @Input() arrivalLocationId!: number;
  @Input() departureLocationId!: number;

  additionalProducts: AdditionalRentalProduct[] = []; // Mevcut ek ürünler
  cartItems: AdditionalRentalProduct[] = []; // Sepetteki ek ürünler
  totalRentalPrice: number = 0; // Toplam kiralama fiyatı

  constructor(
    private router: Router, // Router servisini enjekte et
    public activeModal: NgbActiveModal, // Aktif modal servisini enjekte et
    private rentalService: RentalService, // RentalService servisini enjekte et
    private vehicleService: VehicleService, // VehicleService servisini enjekte et
    private modalService: NgbModal, // NgbModal servisini enjekte et
    private decimalPipe: DecimalPipe // DecimalPipe servisini enjekte et
  ) {}

  // Bileşen ilk yüklendiğinde çalışacak olan Angular'ın ömür döngüsü metodu
  ngOnInit(): void {
    // Ek kiralama ürünlerini al ve sepette olup olmadığını kontrol et
    this.rentalService.getAdditionalRentalProducts().subscribe(products => {
      this.additionalProducts = products.map(product => ({
        ...product,
        inCart: false  // Başlangıçta sepette değil
      }));
    });

    this.calculateInitialRentalPrice(); // Başlangıç kiralama fiyatını hesapla

    // Kiralama verilerini giriş değişkenlerinden doldur
    this.rentalData.userId = this.userId;
    this.rentalData.vehicleId = this.vehicleId;
    this.rentalData.rentalDate = this.rentalDate;
    this.rentalData.returnDate = this.returnDate;
    this.rentalData.departureLocationId = this.departureLocationId;
    this.rentalData.arrivalLocationId = this.arrivalLocationId;
    this.rentalData.status = RentalStatus.Pending;

    // Eğer indirim varsa indirimli fiyatı hesapla, yoksa normal fiyatı kullan
    this.baseRentalPrice = this.discountRate > 0 ? this.dailyRentalFee * (1 - this.discountRate / 100) * this.dateDifference : this.dailyRentalFee * this.dateDifference;
    this.rentalData.baseRentalPrice = this.baseRentalPrice;
  }

  // Başlangıç kiralama fiyatını hesaplayan fonksiyon
  calculateInitialRentalPrice(): void {
    if (this.discountRate > 0) {
      this.totalRentalPrice = this.dailyRentalFee * (1 - this.discountRate / 100) * this.dateDifference;
    } else {
      this.totalRentalPrice = this.dailyRentalFee * this.dateDifference;
    }
  }

  // Sepetteki ürünleri yönetmek için kullanılan fonksiyon
  toggleCart(product: AdditionalRentalProduct): void {
    product.inCart = !product.inCart;
    if (product.inCart) {
      this.cartItems.push(product);
    } else {
      const index = this.cartItems.findIndex(item => item.additionalRentalProductId === product.additionalRentalProductId);
      this.cartItems.splice(index, 1);
    }
    this.updateTotalPrice(); // Toplam fiyatı güncelle
  }

  // Toplam fiyatı güncelleyen fonksiyon
  updateTotalPrice(): void {
    this.additionalProductsTotal = this.cartItems.reduce((acc, product) => acc + product.additionalRentalProductFee!, 0);
    this.totalRentalPrice = this.additionalProductsTotal + (this.discountRate > 0 ? this.dailyRentalFee * (1 - this.discountRate / 100) * this.dateDifference : this.dailyRentalFee * this.dateDifference);
    this.rentalData.additionalProductsTotal = this.additionalProductsTotal;
  }

  // Kiralama ödeme sayfasına yönlendiren fonksiyon
  goToRentalPay() {
    // rentalData içindeki additionalProductIds dizisini güncelle
    this.rentalData.additionalProductIds = this.cartItems.map(item => item.additionalRentalProductId);

    // Verileri state ile gönder
    this.router.navigate(['/cars/pay'], {
      state: {
        rentalData: this.rentalData
      }
    }).then(() => {
      // Modalı kapat ve sayfayı en üste kaydır
      this.activeModal.close();
      window.scrollTo(0, 0);
    });
  }

  // Modalı kapatan fonksiyon
  closeModal() {
    this.modalService.dismissAll();
  }

  // Toplam fiyatı hesaplayan fonksiyon
  getTotalPrice(): number {
    // Sepete eklenmiş ek ürünlerin toplam fiyatını hesapla
    const additionalProductsTotal = this.cartItems.reduce((acc, product) => acc + product.additionalRentalProductFee!, 0);
    // Kiralama ücreti ve ek ürünlerin toplam fiyatını birleştir
    return this.baseRentalPrice + additionalProductsTotal;
  }

  // Fiyatı biçimlendiren fonksiyon
  formatPrice(price: number): string {
    return this.vehicleService.formatPrice(price);
  }
}
