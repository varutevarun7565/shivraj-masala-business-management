import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { RawMaterial, Product, Customer, Service, Expense, ProductionBatch, Invoice, User } from '../data/mockData';
import { rawMaterials as initialRawMaterials, products as initialProducts, customers as initialCustomers, services as initialServices, expenses as initialExpenses, productionBatches as initialBatches, invoices as initialInvoices, users as initialUsers } from '../data/mockData';

export type Role = 'Owner/Admin' | 'Seller/Billing Staff' | 'Production/Inventory Staff' | 'Viewer/Accountant';
export type FontSize = 'small' | 'normal' | 'large';
interface AppContextType {
  role: Role; setRole: (role: Role) => void; userName: string; setUserName: (name: string) => void; fontSize: FontSize; setFontSize: (size: FontSize) => void;
  rawMaterials: RawMaterial[]; setRawMaterials: React.Dispatch<React.SetStateAction<RawMaterial[]>>;
  products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[]; setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  services: Service[]; setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  expenses: Expense[]; setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  productionBatches: ProductionBatch[]; setProductionBatches: React.Dispatch<React.SetStateAction<ProductionBatch[]>>;
  invoices: Invoice[]; setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Owner/Admin'); const [userName, setUserName] = useState('Shivraj Masale');
  const [fontSize, setFontSizeState] = useState<FontSize>(() => (localStorage.getItem('shivraj-font-size') as FontSize) || 'normal');
  const setFontSize = (size: FontSize) => { setFontSizeState(size); localStorage.setItem('shivraj-font-size', size); };
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([...initialRawMaterials]);
  const [products, setProducts] = useState<Product[]>([...initialProducts]); const [customers, setCustomers] = useState<Customer[]>([...initialCustomers]);
  const [services, setServices] = useState<Service[]>([...initialServices]); const [expenses, setExpenses] = useState<Expense[]>([...initialExpenses]);
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>([...initialBatches]); const [invoices, setInvoices] = useState<Invoice[]>([...initialInvoices]);
  const [users, setUsers] = useState<User[]>([...initialUsers]);
  useEffect(() => { document.documentElement.dataset.fontSize = fontSize; }, [fontSize]);
  const hydrated = useRef(false);
  useEffect(() => { (async () => {
    if (!window.desktopAPI) { hydrated.current = true; return; }
    const s = await window.desktopAPI.loadState();
    if (Array.isArray(s.rawMaterials)) setRawMaterials(s.rawMaterials as RawMaterial[]); if (Array.isArray(s.products)) setProducts(s.products as Product[]);
    if (Array.isArray(s.customers)) setCustomers(s.customers as Customer[]); if (Array.isArray(s.services)) setServices(s.services as Service[]);
    if (Array.isArray(s.expenses)) setExpenses(s.expenses as Expense[]); if (Array.isArray(s.productionBatches)) setProductionBatches(s.productionBatches as ProductionBatch[]);
    if (Array.isArray(s.invoices)) setInvoices(s.invoices as Invoice[]); if (Array.isArray(s.users)) setUsers(s.users as User[]);
    hydrated.current = true;
  })().catch(console.error); }, []);
  useEffect(() => { if (!hydrated.current || !window.desktopAPI) return; const timer=setTimeout(() => window.desktopAPI?.saveState({rawMaterials,products,customers,services,expenses,productionBatches,invoices,users}).catch(console.error),250); return()=>clearTimeout(timer); }, [rawMaterials,products,customers,services,expenses,productionBatches,invoices,users]);
  return <AppContext.Provider value={{role,setRole,userName,setUserName,fontSize,setFontSize,rawMaterials,setRawMaterials,products,setProducts,customers,setCustomers,services,setServices,expenses,setExpenses,productionBatches,setProductionBatches,invoices,setInvoices,users,setUsers}}>{children}</AppContext.Provider>;
}
export function useApp(){const ctx=useContext(AppContext);if(!ctx)throw new Error('useApp must be used within AppProvider');return ctx;}
