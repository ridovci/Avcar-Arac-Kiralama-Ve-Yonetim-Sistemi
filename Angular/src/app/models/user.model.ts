import { Rental } from "./rental.model";

export interface User {
    userId: number;
    email: string;
    passwordHash: string;
    tcNumber: string;
    registrationDate: Date;
    roleId: number;
    role?: Role;
    userContactInfoId: number;
    userContactInfo?: UserContactInfo;
    personalInfoId: number;
    userPersonalInfo?: UserPersonalInfo;
    licenseInfoId: number;
    userLicenseInfo?: UserLicenseInfo;
    rental?: Rental[];
  }
  
  export interface UserContactInfo {
    userContactInfoId: number;
    mobilePhone: string;
    mobilePhoneBackup?: string;
  }
  
  export interface UserLicenseInfo {
    userLicenseInfoId: number;
    driverLicenseIssueDate: Date;
    driverLicenseClass: string;
    driverLicenseNumber: string;
  }
  
  export interface UserPersonalInfo {
    userPersonalInfoId: number;
    firstName: string;
    lastName: string;
    genderCode: number;
    dateOfBirth: Date;
  }
  
  export interface Role {
    roleId: number;
    roleName: string;
  }
  

  export interface UserDto {
    userId: number;
    firstName: string;
    lastName: string;
    genderCode: number;
    dateOfBirth: Date;
    email: string;
    mobilePhone: string;
    driverLicenseNumber: string;
    driverLicenseClass: string;
  }

  export interface PagedResult<T> {
    items: T[];
    totalCount: number;
  }