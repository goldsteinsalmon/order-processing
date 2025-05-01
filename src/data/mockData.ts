
import { Customer, Product, Order, StandingOrder, Return, Complaint, MissingItem, User, Picker, BatchUsage } from "../types";
import { addDays, subDays, format } from "date-fns";

// Mock Customers
export const customers: Customer[] = [
  { 
    id: "c1", 
    accountNumber: "ACC001",
    name: "John Smith", 
    email: "john@example.com", 
    phone: "01234567890", 
    address: "123 Main St, London", 
    type: "Private" 
  },
  { 
    id: "c2", 
    accountNumber: "ACC002",
    name: "ABC Groceries", 
    email: "orders@abcgroceries.com", 
    phone: "02087654321", 
    address: "Unit 4, Business Park, Manchester", 
    type: "Trade" 
  },
  { 
    id: "c3", 
    accountNumber: "ACC003",
    name: "Sarah Jones", 
    email: "sarah@example.com", 
    phone: "07700900123", 
    address: "45 Park Lane, Bristol", 
    type: "Private",
    onHold: true,
    holdReason: "Payment issue"
  },
];

// Mock Products with weights
export const products: Product[] = [
  { 
    id: "p1", 
    name: "Fresh Apples", 
    sku: "FR-APL-001", 
    description: "Red apples, 1kg bag", 
    stockLevel: 150,
    weight: 1000 // Weight in grams (1kg)
  },
  { 
    id: "p2", 
    name: "Organic Carrots", 
    sku: "ORG-CRT-002", 
    description: "Organic carrots, 500g bag", 
    stockLevel: 85,
    weight: 500 // Weight in grams (500g)
  },
  { 
    id: "p3", 
    name: "Free Range Eggs", 
    sku: "EGG-FR-003", 
    description: "Free range eggs, pack of 6", 
    stockLevel: 120,
    weight: 360 // Weight in grams (6 eggs at ~60g each)
  },
];

// Mock Orders
const today = new Date();
export const orders: Order[] = [
  {
    id: "o1",
    customerId: "c1",
    customer: customers[0],
    customerOrderNumber: "ORD-1234",
    orderDate: format(today, "yyyy-MM-dd"),
    deliveryMethod: "Delivery",
    items: [
      {
        id: "oi1",
        productId: "p1",
        product: products[0],
        quantity: 2,
      },
      {
        id: "oi2",
        productId: "p3",
        product: products[2],
        quantity: 3,
      }
    ],
    notes: "Please deliver before noon",
    status: "Pending",
    created: new Date().toISOString(),
  },
  {
    id: "o2",
    customerId: "c2",
    customer: customers[1],
    customerOrderNumber: "ABC-5678",
    orderDate: format(addDays(today, 1), "yyyy-MM-dd"),
    deliveryMethod: "Delivery",
    items: [
      {
        id: "oi3",
        productId: "p1",
        product: products[0],
        quantity: 10,
      },
      {
        id: "oi4",
        productId: "p2",
        product: products[1],
        quantity: 15,
      }
    ],
    status: "Pending",
    created: new Date().toISOString(),
  },
];

// Mock Completed Orders
export const completedOrders: Order[] = [
  {
    id: "o3",
    customerId: "c1",
    customer: customers[0],
    customerOrderNumber: "ORD-1200",
    orderDate: format(subDays(today, 3), "yyyy-MM-dd"),
    deliveryMethod: "Collection",
    items: [
      {
        id: "oi5",
        productId: "p3",
        product: products[2],
        quantity: 2,
        blownPouches: 1,
      }
    ],
    status: "Completed",
    picker: "Jane Doe",
    isPicked: true,
    batchNumber: "B12345",
    totalBlownPouches: 1,
    created: subDays(today, 4).toISOString(),
    updated: subDays(today, 3).toISOString(),
  },
];

// Mock Standing Orders
export const standingOrders: StandingOrder[] = [
  {
    id: "so1",
    customerId: "c2",
    customer: customers[1],
    customerOrderNumber: "ST-ABC-001",
    schedule: {
      frequency: "Weekly",
      dayOfWeek: 1, // Monday
      deliveryMethod: "Delivery",
      skippedDates: [
        format(addDays(today, 7), "yyyy-MM-dd")
      ],
      modifiedDeliveries: [
        {
          date: format(addDays(today, 14), "yyyy-MM-dd"),
          modifications: {
            items: [
              {
                id: "oi6",
                productId: "p1",
                product: products[0],
                quantity: 15,
              }
            ],
            notes: "Extra quantity for event"
          }
        }
      ]
    },
    items: [
      {
        id: "oi7",
        productId: "p1",
        product: products[0],
        quantity: 10,
      },
      {
        id: "oi8",
        productId: "p2",
        product: products[1],
        quantity: 5,
      }
    ],
    active: true,
    created: subDays(today, 30).toISOString(),
  },
];

// Mock Returns
export const returns: Return[] = [
  {
    id: "r1",
    customerType: "Private",
    customerName: "John Smith",
    contactEmail: "john@example.com",
    contactPhone: "01234567890",
    dateReturned: format(subDays(today, 2), "yyyy-MM-dd"),
    orderNumber: "o1",
    productSku: "FR-APL-001",
    product: products[0],
    quantity: 1,
    reason: "Damaged product",
    returnsRequired: "Yes",
    returnStatus: "Pending",
    resolutionStatus: "Open",
    created: subDays(today, 2).toISOString(),
  },
];

// Mock Complaints
export const complaints: Complaint[] = [
  {
    id: "cp1",
    customerType: "Trade",
    customerName: "ABC Groceries",
    contactEmail: "orders@abcgroceries.com",
    dateSubmitted: format(subDays(today, 1), "yyyy-MM-dd"),
    orderNumber: "o2",
    complaintType: "Foreign Object Found",
    complaintDetails: "Found plastic in product",
    returnsRequired: "No",
    returnStatus: "No Return Required",
    resolutionStatus: "In Progress",
    created: subDays(today, 1).toISOString(),
  },
];

// Mock Missing Items
export const missingItems: MissingItem[] = [
  {
    id: "mi1",
    orderId: "o1",
    order: orders[0],
    productId: "p3",
    product: products[2],
    quantity: 1,
    date: format(today, "yyyy-MM-dd"),
  },
];

// Mock Users
export const users: User[] = [
  {
    id: "u1",
    name: "Nick Goldstein",
    email: "nickgoldstein",
    password: "Bigfish1!",
    role: "Admin",
    active: true,
  },
  {
    id: "u2",
    name: "Nila",
    email: "nila",
    password: "Bigfish1!",
    role: "User",
    active: true,
  },
  {
    id: "u3",
    name: "Manager User",
    email: "manager@example.com",
    role: "Manager",
    active: true,
  },
  {
    id: "u4",
    name: "Regular User",
    email: "user@example.com",
    role: "User",
    active: true,
  },
];

// Mock Pickers
export const pickers: Picker[] = [
  {
    id: "pk1",
    name: "Jane Doe",
    active: true,
  },
  {
    id: "pk2",
    name: "Mike Johnson",
    active: true,
  },
  {
    id: "pk3",
    name: "Sarah Williams",
    active: false,
  },
];

// Mock Batch Usage Data
export const batchUsages: BatchUsage[] = [
  {
    id: "bu1",
    batchNumber: "B12345",
    productId: "p3",
    productName: "Free Range Eggs",
    totalWeight: 720, // 2 units at 360g each
    usedWeight: 720,  
    ordersCount: 1,
    firstUsed: subDays(new Date(), 3).toISOString(),
    lastUsed: subDays(new Date(), 3).toISOString()
  }
];
