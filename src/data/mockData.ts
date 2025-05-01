// This file previously contained mock data
// It's now empty as mock data has been removed to allow for custom data testing

import { Customer, Product, Order, StandingOrder, Return, Complaint, MissingItem, User, Picker, BatchUsage } from "../types";

// Empty arrays for each data type
export const customers: Customer[] = [];
export const products: Product[] = [];
export const orders: Order[] = [];
export const completedOrders: Order[] = [];
export const standingOrders: StandingOrder[] = [];
export const returns: Return[] = [];
export const complaints: Complaint[] = [];
export const missingItems: MissingItem[] = [];
export const users: User[] = [
  // Keep one admin user so you can log in
  {
    id: "u1",
    name: "Admin User",
    email: "admin",
    password: "password",
    role: "Admin",
    active: true,
  }
];
export const pickers: Picker[] = [];
export const batchUsages: BatchUsage[] = [];
