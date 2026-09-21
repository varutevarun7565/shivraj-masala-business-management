import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Products from './pages/Products';
import RawMaterials from './pages/RawMaterials';
import Production from './pages/Production';
import Services from './pages/Services';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Administration from './pages/Administration';
import PriceManagement from './pages/PriceManagement';
import Profile from './pages/Profile';
import CAWorkspace from './pages/CAWorkspace';

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<Login />} />

      {/* Main app */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/raw-materials" element={<RawMaterials />} />
        <Route path="/production" element={<Production />} />
        <Route path="/services" element={<Services />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/ca" element={<CAWorkspace />} />
        <Route path="/administration" element={<Administration />} />
        <Route path="/price-management" element={<PriceManagement />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
