import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import { Search, Users, Package, Wheat, FileText, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { customers, products, rawMaterials, invoices } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();
  const matchedCustomers = q ? customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 4) : [];
  const matchedProducts = q ? products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 4) : [];
  const matchedMaterials = q ? rawMaterials.filter(m => m.name.toLowerCase().includes(q)).slice(0, 4) : [];
  const matchedInvoices = q ? invoices.filter(i => i.invoiceNo.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q)).slice(0, 4) : [];

  const hasResults = matchedCustomers.length + matchedProducts.length + matchedMaterials.length + matchedInvoices.length > 0;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-24">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 text-[15px] outline-none bg-transparent min-w-0"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {query && (
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {!hasResults && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">{t('search.noResults')}</p>
            )}

            {matchedCustomers.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('search.customers')}</p>
                {matchedCustomers.map(c => (
                  <button key={c.id} onClick={() => handleSelect('/customers')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Users size={14} className="text-gray-400" />
                    <span>{c.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{c.phone || ''}</span>
                  </button>
                ))}
              </div>
            )}

            {matchedProducts.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('search.products')}</p>
                {matchedProducts.map(p => (
                  <button key={p.id} onClick={() => handleSelect('/products')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Package size={14} className="text-gray-400" />
                    <span>{p.name} ({p.packageSize})</span>
                    <span className="text-xs text-gray-400 ml-auto">₹{p.sellingPrice}</span>
                  </button>
                ))}
              </div>
            )}

            {matchedMaterials.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('search.materials')}</p>
                {matchedMaterials.map(m => (
                  <button key={m.id} onClick={() => handleSelect('/raw-materials')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Wheat size={14} className="text-gray-400" />
                    <span>{m.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{m.currentStock} {m.unit}</span>
                  </button>
                ))}
              </div>
            )}

            {matchedInvoices.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('search.invoices')}</p>
                {matchedInvoices.map(i => (
                  <button key={i.id} onClick={() => handleSelect('/sales')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <FileText size={14} className="text-gray-400" />
                    <span>{i.invoiceNo}</span>
                    <span className="text-xs text-gray-400 ml-auto">{i.customer}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            {t('search.placeholder')}
          </div>
        )}
      </div>
    </div>
  );
}
