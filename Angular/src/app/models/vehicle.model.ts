import { Rental } from "./rental.model";

export interface Vehicle {
    vehicleFeatureAssignments: VehicleFeatureAssignment[];
    model: Model;
    vehicleId: number;
    modelId: number;
    brandId: number;
    brand: Brand;
    location: Location;
    vehicleType: VehicleType;
    color: Color;
    gearType: GearType;
    fuelType: FuelType;
    airConditioning: AirConditioning;
    modelName: string;
    brandName: string;
    modelYear: number;
    vehicleTypeId: number;
    vehicleTypeName: string;
    fuelTypeId: number;
    fuelTypeName: string;
    gearTypeId: number;
    gearTypeName: string;
    airConditioningId: number;
    airConditioningName: string;
    hasAirConditioning: boolean;
    numberOfPeople: number;
    numberOfDoors: number;
    colorId: number;
    colorName: string;
    numberPlate: string;
    locationId: number;
    locationName: string;
    dailyRentalFee: number;
    discountRate: number;
    minDriverAge: number;
    minDrivingLicenseYear: number;
    status: string;
    description: string;
    vehicleImages: VehicleImage[];
    vehicleFeatures: string[];
    rentalStatusMessage?: string;
  }

export interface Model {
    modelId: number;
    brandId: number;
    brand?: Brand;
    modelName: string;
}

export interface Brand {
    brandId: number;
    brandName: string;
    models?: Model[];
}

export interface Location {
    locationId: number;
    locationName: string;
}

export interface VehicleType {
    vehicleTypeId: number;
    vehicleTypeName: string;
}

export interface Color {
    colorId: number;
    colorName: string;
}

export interface GearType {
    gearTypeId: number;
    gearTypeName: string;
}

export interface FuelType {
    fuelTypeId: number;
    fuelTypeName: string;
}

export interface AirConditioning {
    airConditioningId: number;
    airConditioningName: string;
}

export interface VehicleImage {
    vehicleImageId: number;
    vehicleImageUrl: string;
    vehicleId: number;
    vehicle?: Vehicle;
}

export interface VehicleFeatureAssignment {
    vehicleId: number;
    vehicle?: Vehicle;
    vehicleFeaturesId: number;
    vehicleFeatures?: VehicleFeature;
}

export interface VehicleFeature {
    vehicleFeatureId: number;
    vehicleFeatureName: string;
    vehicleFeatureAssignments?: VehicleFeatureAssignment[];
}

export interface VehicleSearchCriteria {
    rentalDate: string;
    returnDate: string;
    departureLocationId: number;
    arrivalLocationId: number;
    brandId?: number;
    modelId?: number;
    vehicleTypeId?: number;
    gearTypeId?: number;
    fuelTypeId?: number;
    airConditioningId?: number;
    minDailyRentalFee?: number;
    maxDailyRentalFee?: number;
    featureIds?: number[];
    color?: string;
    minNumberOfPeople?: number;
    maxNumberOfPeople?: number;
    minNumberOfDoors?: number;
    maxNumberOfDoors?: number;
    locationId?: number;
  }