// ============================================================
// Mock Data for Masala Business Management System Prototype
// All data is hardcoded — no persistence, no API calls
// ============================================================

export interface RawMaterial {
  id: string;
  name: string;
  category: 'Seeds' | 'Powder' | 'Whole Spice' | 'Other';
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  pricePerUnit: number;
  retailPrice?: number;
  wholesalePrice?: number;
  gstPercent?: number;
  hsnSac?: string;
  purchaseHistory: PurchaseEntry[];
  consumptionHistory: ConsumptionEntry[];
  saleHistory: SaleHistoryEntry[];
}

export interface PurchaseEntry {
  id: string;
  date: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  supplier: string;
  supplierGstin?: string;
  supplierInvoiceNo?: string;
  taxableAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  grandTotal?: number;
}

export interface ConsumptionEntry {
  id: string;
  date: string;
  quantity: number;
  batchNumber: string;
  product: string;
}

export interface SaleHistoryEntry {
  id: string;
  date: string;
  quantity: number;
  pricePerUnit: number;
  customer: string;
  invoiceNo: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  packageSize: string;
  sellingPrice: number;
  retailPrice?: number;
  wholesalePrice?: number;
  gstPercent?: number;
  hsnSac?: string;
  currentStock: number;
  publishStatus: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  customerType?: 'Retail' | 'Wholesale';
  gstin?: string;
  totalPurchases: number;
  pendingAmount: number;
  lastPurchaseDate: string;
  purchaseHistory: CustomerPurchase[];
  invoices: CustomerInvoice[];
}

export interface CustomerPurchase {
  id: string;
  date: string;
  items: string;
  amount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
}

export interface CustomerInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Partial' | 'Pending';
}

export interface Service {
  id: string;
  name: string;
  price: number;
  retailPrice?: number;
  wholesalePrice?: number;
  gstPercent?: number;
  hsnSac?: string;
  unit: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  product: string;
  productionDate: string;
  quantityProduced: number;
  materialsConsumed: { material: string; quantity: number; unit: string }[];
  status: 'Completed' | 'In Progress';
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  customer: string;
  items: { name: string; qty: number; price: number; discount: number; discountPercent?: number; unit?: string; baseQty?: number; gstPercent?: number; gstAmount?: number; taxableAmount?: number; hsnSac?: string }[];
  customerType?: 'Retail' | 'Wholesale';
  customerGstin?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  pendingAmount: number;
  status: 'Paid' | 'Partial' | 'Pending';
  pdfPath?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}

// ──────────────────────────────────────────────
// Raw Materials
// ──────────────────────────────────────────────
export const rawMaterials: RawMaterial[] = [
  {
    id: 'RM001',
    name: 'Jeera (Cumin Seeds)',
    category: 'Seeds',
    currentStock: 45,
    unit: 'kg',
    lowStockThreshold: 20,
    pricePerUnit: 320,
    purchaseHistory: [
      { id: 'PH001', date: '2026-09-10', quantity: 25, pricePerUnit: 310, totalPrice: 7750, supplier: 'Rajkot Spice Traders' },
      { id: 'PH002', date: '2026-08-28', quantity: 50, pricePerUnit: 300, totalPrice: 15000, supplier: 'Gujarat Masala Mart' },
    ],
    consumptionHistory: [
      { id: 'CH001', date: '2026-09-12', quantity: 8, batchNumber: 'BATCH-2026-0043', product: 'Garam Masala' },
      { id: 'CH002', date: '2026-09-08', quantity: 5, batchNumber: 'BATCH-2026-0041', product: 'Kitchen King' },
    ],
    saleHistory: [
      { id: 'SH001', date: '2026-09-11', quantity: 2, pricePerUnit: 380, customer: 'Ramesh Patil', invoiceNo: 'INV-2026-0089' },
    ],
  },
  {
    id: 'RM002',
    name: 'Mohari (Mustard Seeds)',
    category: 'Seeds',
    currentStock: 12,
    unit: 'kg',
    lowStockThreshold: 15,
    pricePerUnit: 140,
    purchaseHistory: [
      { id: 'PH003', date: '2026-09-05', quantity: 20, pricePerUnit: 135, totalPrice: 2700, supplier: 'Nashik Seeds Co.' },
    ],
    consumptionHistory: [
      { id: 'CH003', date: '2026-09-10', quantity: 3, batchNumber: 'BATCH-2026-0042', product: 'Sambar Masala' },
    ],
    saleHistory: [],
  },
  {
    id: 'RM003',
    name: 'Lal Mirchi (Red Chilli)',
    category: 'Whole Spice',
    currentStock: 68,
    unit: 'kg',
    lowStockThreshold: 25,
    pricePerUnit: 280,
    purchaseHistory: [
      { id: 'PH004', date: '2026-09-08', quantity: 40, pricePerUnit: 275, totalPrice: 11000, supplier: 'Guntur Chilli Farm' },
      { id: 'PH005', date: '2026-08-20', quantity: 50, pricePerUnit: 270, totalPrice: 13500, supplier: 'Sangli Spices' },
    ],
    consumptionHistory: [
      { id: 'CH004', date: '2026-09-12', quantity: 12, batchNumber: 'BATCH-2026-0043', product: 'Garam Masala' },
      { id: 'CH005', date: '2026-09-10', quantity: 20, batchNumber: 'BATCH-2026-0044', product: 'Chilli Powder' },
    ],
    saleHistory: [
      { id: 'SH002', date: '2026-09-09', quantity: 5, pricePerUnit: 340, customer: 'Suresh Kirana Store', invoiceNo: 'INV-2026-0087' },
    ],
  },
  {
    id: 'RM004',
    name: 'Haldi (Turmeric)',
    category: 'Whole Spice',
    currentStock: 8,
    unit: 'kg',
    lowStockThreshold: 20,
    pricePerUnit: 180,
    purchaseHistory: [
      { id: 'PH006', date: '2026-08-25', quantity: 30, pricePerUnit: 175, totalPrice: 5250, supplier: 'Sangli Spices' },
    ],
    consumptionHistory: [
      { id: 'CH006', date: '2026-09-12', quantity: 10, batchNumber: 'BATCH-2026-0043', product: 'Garam Masala' },
      { id: 'CH007', date: '2026-09-09', quantity: 15, batchNumber: 'BATCH-2026-0044', product: 'Turmeric Powder' },
    ],
    saleHistory: [],
  },
  {
    id: 'RM005',
    name: 'Dhaniya (Coriander)',
    category: 'Seeds',
    currentStock: 55,
    unit: 'kg',
    lowStockThreshold: 20,
    pricePerUnit: 160,
    purchaseHistory: [
      { id: 'PH007', date: '2026-09-06', quantity: 30, pricePerUnit: 155, totalPrice: 4650, supplier: 'Rajkot Spice Traders' },
    ],
    consumptionHistory: [
      { id: 'CH008', date: '2026-09-12', quantity: 6, batchNumber: 'BATCH-2026-0043', product: 'Garam Masala' },
    ],
    saleHistory: [
      { id: 'SH003', date: '2026-09-10', quantity: 3, pricePerUnit: 200, customer: 'Anita Deshmukh', invoiceNo: 'INV-2026-0088' },
    ],
  },
  {
    id: 'RM006',
    name: 'Methi (Fenugreek)',
    category: 'Seeds',
    currentStock: 18,
    unit: 'kg',
    lowStockThreshold: 10,
    pricePerUnit: 200,
    purchaseHistory: [
      { id: 'PH008', date: '2026-09-01', quantity: 15, pricePerUnit: 195, totalPrice: 2925, supplier: 'Gujarat Masala Mart' },
    ],
    consumptionHistory: [],
    saleHistory: [],
  },
  {
    id: 'RM007',
    name: 'Hing (Asafoetida)',
    category: 'Powder',
    currentStock: 3,
    unit: 'kg',
    lowStockThreshold: 5,
    pricePerUnit: 1800,
    purchaseHistory: [
      { id: 'PH009', date: '2026-08-15', quantity: 5, pricePerUnit: 1750, totalPrice: 8750, supplier: 'Mumbai Spice House' },
    ],
    consumptionHistory: [
      { id: 'CH009', date: '2026-09-10', quantity: 0.5, batchNumber: 'BATCH-2026-0042', product: 'Sambar Masala' },
    ],
    saleHistory: [],
  },
  {
    id: 'RM008',
    name: 'Kali Mirch (Black Pepper)',
    category: 'Whole Spice',
    currentStock: 22,
    unit: 'kg',
    lowStockThreshold: 10,
    pricePerUnit: 750,
    purchaseHistory: [
      { id: 'PH010', date: '2026-09-03', quantity: 15, pricePerUnit: 740, totalPrice: 11100, supplier: 'Kerala Pepper Exports' },
    ],
    consumptionHistory: [
      { id: 'CH010', date: '2026-09-12', quantity: 3, batchNumber: 'BATCH-2026-0043', product: 'Garam Masala' },
    ],
    saleHistory: [],
  },
  {
    id: 'RM009',
    name: 'Lavang (Cloves)',
    category: 'Whole Spice',
    currentStock: 6,
    unit: 'kg',
    lowStockThreshold: 5,
    pricePerUnit: 1200,
    purchaseHistory: [
      { id: 'PH011', date: '2026-08-20', quantity: 8, pricePerUnit: 1180, totalPrice: 9440, supplier: 'Kerala Pepper Exports' },
    ],
    consumptionHistory: [
      { id: 'CH011', date: '2026-09-12', quantity: 2, batchNumber: 'BATCH-2026-0043', product: 'Garam Masala' },
    ],
    saleHistory: [],
  },
  {
    id: 'RM010',
    name: 'Dalchini (Cinnamon)',
    category: 'Whole Spice',
    currentStock: 14,
    unit: 'kg',
    lowStockThreshold: 8,
    pricePerUnit: 480,
    purchaseHistory: [
      { id: 'PH012', date: '2026-09-02', quantity: 10, pricePerUnit: 470, totalPrice: 4700, supplier: 'Mumbai Spice House' },
    ],
    consumptionHistory: [
      { id: 'CH012', date: '2026-09-12', quantity: 2, batchNumber: 'BATCH-2026-0043', product: 'Garam Masala' },
    ],
    saleHistory: [],
  },
];

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────
export const products: Product[] = [
  { id: 'P001', name: 'Garam Masala', category: 'Blended Masala', packageSize: '100g', sellingPrice: 85, currentStock: 240, publishStatus: true },
  { id: 'P002', name: 'Garam Masala', category: 'Blended Masala', packageSize: '500g', sellingPrice: 380, currentStock: 65, publishStatus: true },
  { id: 'P003', name: 'Chilli Powder', category: 'Ground Spice', packageSize: '200g', sellingPrice: 60, currentStock: 180, publishStatus: true },
  { id: 'P004', name: 'Turmeric Powder', category: 'Ground Spice', packageSize: '200g', sellingPrice: 45, currentStock: 30, publishStatus: true },
  { id: 'P005', name: 'Kitchen King Masala', category: 'Blended Masala', packageSize: '100g', sellingPrice: 75, currentStock: 120, publishStatus: false },
  { id: 'P006', name: 'Sambar Masala', category: 'Blended Masala', packageSize: '100g', sellingPrice: 70, currentStock: 95, publishStatus: true },
  { id: 'P007', name: 'Chole Masala', category: 'Blended Masala', packageSize: '100g', sellingPrice: 65, currentStock: 110, publishStatus: false },
  { id: 'P008', name: 'Pav Bhaji Masala', category: 'Blended Masala', packageSize: '100g', sellingPrice: 70, currentStock: 85, publishStatus: true },
];

// ──────────────────────────────────────────────
// Customers
// ──────────────────────────────────────────────
export const customers: Customer[] = [
  {
    id: 'C001',
    name: 'Ramesh Patil',
    phone: '9876543210',
    address: 'Shop No. 12, Main Market, Sangli',
    totalPurchases: 84500,
    pendingAmount: 4200,
    lastPurchaseDate: '2026-09-11',
    purchaseHistory: [
      { id: 'CP001', date: '2026-09-11', items: 'Garam Masala x20, Jeera 2kg', amount: 2460, paymentStatus: 'Partial' },
      { id: 'CP002', date: '2026-09-05', items: 'Chilli Powder x30, Kitchen King x15', amount: 2925, paymentStatus: 'Paid' },
      { id: 'CP003', date: '2026-08-28', items: 'Turmeric Powder x25', amount: 1125, paymentStatus: 'Paid' },
    ],
    invoices: [
      { id: 'CI001', invoiceNo: 'INV-2026-0089', date: '2026-09-11', amount: 2460, status: 'Partial' },
      { id: 'CI002', invoiceNo: 'INV-2026-0082', date: '2026-09-05', amount: 2925, status: 'Paid' },
      { id: 'CI003', invoiceNo: 'INV-2026-0075', date: '2026-08-28', amount: 1125, status: 'Paid' },
    ],
  },
  {
    id: 'C002',
    name: 'Suresh Kirana Store',
    phone: '9823456789',
    address: '45, Market Yard, Kolhapur',
    totalPurchases: 156200,
    pendingAmount: 8500,
    lastPurchaseDate: '2026-09-09',
    purchaseHistory: [
      { id: 'CP004', date: '2026-09-09', items: 'Lal Mirchi 5kg, Garam Masala x50', amount: 5950, paymentStatus: 'Partial' },
      { id: 'CP005', date: '2026-09-01', items: 'Sambar Masala x40, Chole Masala x30', amount: 4750, paymentStatus: 'Paid' },
    ],
    invoices: [
      { id: 'CI004', invoiceNo: 'INV-2026-0087', date: '2026-09-09', amount: 5950, status: 'Partial' },
      { id: 'CI005', invoiceNo: 'INV-2026-0079', date: '2026-09-01', amount: 4750, status: 'Paid' },
    ],
  },
  {
    id: 'C003',
    name: 'Anita Deshmukh',
    phone: '9812345678',
    address: '78, Laxmi Road, Pune',
    totalPurchases: 42300,
    pendingAmount: 0,
    lastPurchaseDate: '2026-09-10',
    purchaseHistory: [
      { id: 'CP006', date: '2026-09-10', items: 'Dhaniya 3kg, Pav Bhaji Masala x10', amount: 1300, paymentStatus: 'Paid' },
    ],
    invoices: [
      { id: 'CI006', invoiceNo: 'INV-2026-0088', date: '2026-09-10', amount: 1300, status: 'Paid' },
    ],
  },
  {
    id: 'C004',
    name: 'Mahalaxmi General Store',
    phone: '9867891234',
    address: '23, Station Road, Miraj',
    totalPurchases: 198750,
    pendingAmount: 5950,
    lastPurchaseDate: '2026-09-07',
    purchaseHistory: [
      { id: 'CP007', date: '2026-09-07', items: 'Garam Masala x100, Chilli Powder x60', amount: 12100, paymentStatus: 'Partial' },
      { id: 'CP008', date: '2026-08-25', items: 'Turmeric Powder x40, Kitchen King x25', amount: 3675, paymentStatus: 'Paid' },
    ],
    invoices: [
      { id: 'CI007', invoiceNo: 'INV-2026-0085', date: '2026-09-07', amount: 12100, status: 'Partial' },
      { id: 'CI008', invoiceNo: 'INV-2026-0073', date: '2026-08-25', amount: 3675, status: 'Paid' },
    ],
  },
  {
    id: 'C005',
    name: 'Priya Foods & Spices',
    phone: '9845671234',
    address: '56, APMC Market, Sangli',
    totalPurchases: 325000,
    pendingAmount: 0,
    lastPurchaseDate: '2026-09-12',
    purchaseHistory: [
      { id: 'CP009', date: '2026-09-12', items: 'Bulk Grinding Service, Jeera 10kg', amount: 4700, paymentStatus: 'Paid' },
      { id: 'CP010', date: '2026-09-03', items: 'Garam Masala x200', amount: 17000, paymentStatus: 'Paid' },
    ],
    invoices: [
      { id: 'CI009', invoiceNo: 'INV-2026-0090', date: '2026-09-12', amount: 4700, status: 'Paid' },
      { id: 'CI010', invoiceNo: 'INV-2026-0080', date: '2026-09-03', amount: 17000, status: 'Paid' },
    ],
  },
  {
    id: 'C006',
    name: 'Vijay Traders',
    phone: '',
    address: '12, Grain Market, Satara',
    totalPurchases: 67800,
    pendingAmount: 0,
    lastPurchaseDate: '2026-08-30',
    purchaseHistory: [
      { id: 'CP011', date: '2026-08-30', items: 'Chole Masala x50, Pav Bhaji x30', amount: 5350, paymentStatus: 'Paid' },
    ],
    invoices: [
      { id: 'CI011', invoiceNo: 'INV-2026-0076', date: '2026-08-30', amount: 5350, status: 'Paid' },
    ],
  },
];

// ──────────────────────────────────────────────
// Services
// ──────────────────────────────────────────────
export const services: Service[] = [
  { id: 'S001', name: 'Grinding (Customer Material)', price: 40, unit: 'per kg' },
  { id: 'S002', name: 'Packing (Pouches)', price: 5, unit: 'per packet' },
  { id: 'S003', name: 'Mixing / Blending', price: 30, unit: 'per kg' },
  { id: 'S004', name: 'Custom Blend Preparation', price: 100, unit: 'per batch' },
  { id: 'S005', name: 'Roasting', price: 25, unit: 'per kg' },
];

// ──────────────────────────────────────────────
// Expenses
// ──────────────────────────────────────────────
export const expenses: Expense[] = [
  { id: 'E001', category: 'Raw Material Purchase', amount: 15000, description: 'Jeera 50kg from Gujarat Masala Mart', date: '2026-09-12' },
  { id: 'E002', category: 'Electricity', amount: 4800, description: 'September electricity bill - factory', date: '2026-09-10' },
  { id: 'E003', category: 'Rent', amount: 15000, description: 'Factory premises rent - September', date: '2026-09-01' },
  { id: 'E004', category: 'Salary/Wages', amount: 35000, description: 'Staff salaries - 4 workers', date: '2026-09-01' },
  { id: 'E005', category: 'Transport', amount: 2200, description: 'Delivery to Kolhapur - tempo charges', date: '2026-09-09' },
  { id: 'E006', category: 'Packaging', amount: 3500, description: 'Printed pouches 100g - 2000 pcs', date: '2026-09-07' },
  { id: 'E007', category: 'Maintenance', amount: 1800, description: 'Grinding machine belt replacement', date: '2026-09-06' },
  { id: 'E008', category: 'Fuel', amount: 1200, description: 'Diesel for delivery van', date: '2026-09-08' },
  { id: 'E009', category: 'Marketing', amount: 500, description: 'Visiting cards printing', date: '2026-09-04' },
  { id: 'E010', category: 'Other', amount: 350, description: 'Tea/snacks for workers', date: '2026-09-11' },
  { id: 'E011', category: 'Raw Material Purchase', amount: 11000, description: 'Lal Mirchi 40kg from Guntur', date: '2026-09-08' },
  { id: 'E012', category: 'Transport', amount: 1500, description: 'Pickup from APMC market', date: '2026-09-05' },
];

// ──────────────────────────────────────────────
// Production Batches
// ──────────────────────────────────────────────
export const productionBatches: ProductionBatch[] = [
  {
    id: 'PB001',
    batchNumber: 'BATCH-2026-0043',
    product: 'Garam Masala',
    productionDate: '2026-09-12',
    quantityProduced: 200,
    materialsConsumed: [
      { material: 'Jeera (Cumin Seeds)', quantity: 8, unit: 'kg' },
      { material: 'Lal Mirchi (Red Chilli)', quantity: 12, unit: 'kg' },
      { material: 'Haldi (Turmeric)', quantity: 10, unit: 'kg' },
      { material: 'Dhaniya (Coriander)', quantity: 6, unit: 'kg' },
      { material: 'Kali Mirch (Black Pepper)', quantity: 3, unit: 'kg' },
      { material: 'Lavang (Cloves)', quantity: 2, unit: 'kg' },
      { material: 'Dalchini (Cinnamon)', quantity: 2, unit: 'kg' },
    ],
    status: 'Completed',
  },
  {
    id: 'PB002',
    batchNumber: 'BATCH-2026-0044',
    product: 'Chilli Powder',
    productionDate: '2026-09-10',
    quantityProduced: 150,
    materialsConsumed: [
      { material: 'Lal Mirchi (Red Chilli)', quantity: 20, unit: 'kg' },
    ],
    status: 'Completed',
  },
  {
    id: 'PB003',
    batchNumber: 'BATCH-2026-0042',
    product: 'Sambar Masala',
    productionDate: '2026-09-10',
    quantityProduced: 100,
    materialsConsumed: [
      { material: 'Mohari (Mustard Seeds)', quantity: 3, unit: 'kg' },
      { material: 'Hing (Asafoetida)', quantity: 0.5, unit: 'kg' },
      { material: 'Lal Mirchi (Red Chilli)', quantity: 5, unit: 'kg' },
      { material: 'Dhaniya (Coriander)', quantity: 4, unit: 'kg' },
    ],
    status: 'Completed',
  },
  {
    id: 'PB004',
    batchNumber: 'BATCH-2026-0041',
    product: 'Kitchen King Masala',
    productionDate: '2026-09-08',
    quantityProduced: 80,
    materialsConsumed: [
      { material: 'Jeera (Cumin Seeds)', quantity: 5, unit: 'kg' },
      { material: 'Dhaniya (Coriander)', quantity: 5, unit: 'kg' },
      { material: 'Lal Mirchi (Red Chilli)', quantity: 3, unit: 'kg' },
      { material: 'Haldi (Turmeric)', quantity: 2, unit: 'kg' },
    ],
    status: 'Completed',
  },
];

// ──────────────────────────────────────────────
// Recent Invoices
// ──────────────────────────────────────────────
export const invoices: Invoice[] = [
  {
    id: 'INV001',
    invoiceNo: 'INV-2026-0090',
    date: '2026-09-12',
    customer: 'Priya Foods & Spices',
    items: [
      { name: 'Grinding Service (10kg)', qty: 1, price: 400, discount: 0 },
      { name: 'Jeera (Cumin Seeds) 10kg', qty: 1, price: 3800, discount: 0 },
    ],
    subtotal: 4200,
    discount: 0,
    tax: 0,
    total: 4200,
    paymentMethod: 'UPI',
    paidAmount: 4200,
    pendingAmount: 0,
    status: 'Paid',
  },
  {
    id: 'INV002',
    invoiceNo: 'INV-2026-0089',
    date: '2026-09-11',
    customer: 'Ramesh Patil',
    items: [
      { name: 'Garam Masala 100g', qty: 20, price: 85, discount: 0 },
      { name: 'Jeera (Cumin Seeds) 2kg', qty: 1, price: 760, discount: 0 },
    ],
    subtotal: 2460,
    discount: 0,
    tax: 0,
    total: 2460,
    paymentMethod: 'Partial',
    paidAmount: 1000,
    pendingAmount: 1460,
    status: 'Partial',
  },
  {
    id: 'INV003',
    invoiceNo: 'INV-2026-0088',
    date: '2026-09-10',
    customer: 'Anita Deshmukh',
    items: [
      { name: 'Dhaniya (Coriander) 3kg', qty: 1, price: 600, discount: 0 },
      { name: 'Pav Bhaji Masala 100g', qty: 10, price: 70, discount: 0 },
    ],
    subtotal: 1300,
    discount: 0,
    tax: 0,
    total: 1300,
    paymentMethod: 'Cash',
    paidAmount: 1300,
    pendingAmount: 0,
    status: 'Paid',
  },
  {
    id: 'INV004',
    invoiceNo: 'INV-2026-0087',
    date: '2026-09-09',
    customer: 'Suresh Kirana Store',
    items: [
      { name: 'Lal Mirchi (Red Chilli) 5kg', qty: 1, price: 1700, discount: 0 },
      { name: 'Garam Masala 100g', qty: 50, price: 85, discount: 0 },
    ],
    subtotal: 5950,
    discount: 0,
    tax: 0,
    total: 5950,
    paymentMethod: 'Partial',
    paidAmount: 3000,
    pendingAmount: 2950,
    status: 'Partial',
  },
  {
    id: 'INV005',
    invoiceNo: 'INV-2026-0085',
    date: '2026-09-07',
    customer: 'Mahalaxmi General Store',
    items: [
      { name: 'Garam Masala 100g', qty: 100, price: 85, discount: 5 },
      { name: 'Chilli Powder 200g', qty: 60, price: 60, discount: 0 },
    ],
    subtotal: 12100,
    discount: 425,
    tax: 0,
    total: 11675,
    paymentMethod: 'Partial',
    paidAmount: 8000,
    pendingAmount: 3675,
    status: 'Partial',
  },
];

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
export const users: User[] = [
  { id: 'U001', name: 'Shivraj Masale', email: 'shivraj@masale.com', role: 'Owner/Admin', status: 'Active' },
  { id: 'U002', name: 'Rajesh Kumar', email: 'rajesh@masale.com', role: 'Seller/Billing Staff', status: 'Active' },
  { id: 'U003', name: 'Pradeep Jadhav', email: 'pradeep@masale.com', role: 'Production/Inventory Staff', status: 'Active' },
  { id: 'U004', name: 'Meena Patil', email: 'meena@masale.com', role: 'Viewer/Accountant', status: 'Active' },
];

// ──────────────────────────────────────────────
// Dashboard Stats (pre-computed)
// ──────────────────────────────────────────────
export const dashboardStats = {
  todaySales: 12400,
  todayServiceIncome: 2800,
  todayExpenses: 4200,
  pendingPayments: 18650,
};

// Monthly data for chart
export const monthlySalesExpenses = [
  { month: 'Apr', sales: 145000, expenses: 78000 },
  { month: 'May', sales: 162000, expenses: 82000 },
  { month: 'Jun', sales: 138000, expenses: 75000 },
  { month: 'Jul', sales: 178000, expenses: 91000 },
  { month: 'Aug', sales: 195000, expenses: 88000 },
  { month: 'Sep', sales: 156000, expenses: 79000 },
];

// Expense categories for dropdown
export const expenseCategories = [
  'Raw Material Purchase',
  'Electricity',
  'Rent',
  'Salary/Wages',
  'Transport',
  'Packaging',
  'Maintenance',
  'Fuel',
  'Marketing',
  'Other',
];

// Role permissions matrix
export const permissionsMatrix = [
  { permission: 'View Dashboard', owner: true, seller: true, production: true, viewer: true },
  { permission: 'Create Sales / Invoices', owner: true, seller: true, production: false, viewer: false },
  { permission: 'Edit Prices', owner: true, seller: false, production: false, viewer: false },
  { permission: 'Apply Discounts', owner: true, seller: false, production: false, viewer: false },
  { permission: 'Manage Production Batches', owner: true, seller: false, production: true, viewer: false },
  { permission: 'Manage Raw Materials', owner: true, seller: false, production: true, viewer: false },
  { permission: 'View Reports', owner: true, seller: false, production: false, viewer: true },
  { permission: 'Export Reports', owner: true, seller: false, production: false, viewer: true },
  { permission: 'Record Expenses', owner: true, seller: false, production: false, viewer: true },
  { permission: 'Manage Users', owner: true, seller: false, production: false, viewer: false },
  { permission: 'Manage Customers', owner: true, seller: true, production: false, viewer: false },
  { permission: 'Manage Products', owner: true, seller: false, production: true, viewer: false },
  { permission: 'Toggle GST', owner: true, seller: false, production: false, viewer: false },
  { permission: 'Manage Services', owner: true, seller: true, production: false, viewer: false },
  { permission: 'View Stock Levels', owner: true, seller: true, production: true, viewer: true },
];

// Payment method breakdown for reports
export const paymentMethodBreakdown = [
  { method: 'Cash', amount: 45000 },
  { method: 'UPI', amount: 38000 },
  { method: 'Bank Transfer', amount: 22000 },
  { method: 'Credit', amount: 18650 },
];
