  export class Rental {
    rentalId?: number;
    vehicleId: number;
    userId: number;
    departureLocationId: number;
    arrivalLocationId: number;
    rentalDate: Date;
    returnDate: Date;
    requestDate: Date;
    status: string;
  
    constructor(
      vehicleId: number,
      userId: number,
      departureLocationId: number,
      arrivalLocationId: number,
      rentalDate: Date,
      returnDate: Date,
      requestDate: Date,
      status: string
    ) {
      this.vehicleId = vehicleId;
      this.userId = userId;
      this.departureLocationId = departureLocationId;
      this.arrivalLocationId = arrivalLocationId;
      this.rentalDate = rentalDate;
      this.returnDate = returnDate;
      this.requestDate = requestDate;
      this.status = status;
    }
  }
  export interface AdditionalRentalProduct {
    additionalRentalProductId: number;
    additionalRentalProductName: string;
    additionalRentalProductDescription?: string;
    additionalRentalProductFee?: number;
    inCart: boolean;  // Sepete eklenip eklenmediğini kontrol eden yeni özellik

  }

  export interface RentalRequestModel {
    rental: Rental;
    additionalProductIds: string[];
}

export interface AdditionalRentalProductAssignment {
  additionalRentalProductId: number;
  rentalId: number;
}

export interface RentalDto {
  rentalId: number;
  startDate: string;
  endDate: string;
  vehiclePlate: string;
  vehicleModel: string;
  brandName: string;
  modelYear: number;
  customerName: string;
  status: string;
  departureLocationName: string;
  arrivalLocationName: string;
  totalPrice: number;
  requestDate: string;
  mobilePhone: string;
}



export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}


export enum RentalStatus {
  Approved = 0,
  Cancelled = 1,
  Completed = 2,
  Pending = 3
}
