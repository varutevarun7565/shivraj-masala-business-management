import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, Search, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function Products() {
  const { products, setProducts, invoices, productionBatches } = useApp();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Blended Masala');
  const [packageSize, setPackageSize] = useState('100g');
  const [sellingPrice, setSellingPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [gstPercent, setGstPercent] = useState('0');
  const [stock, setStock] = useState('');

  const openAdd = () => { setEditingId(null); setName(''); setCategory('Blended Masala'); setPackageSize('100g'); setSellingPrice(''); setWholesalePrice(''); setGstPercent('0'); setStock(''); setShowModal(true); };
  const openEdit = (id:string) => { const p=products.find(x=>x.id===id); if(!p)return; setEditingId(id); setName(p.name); setCategory(p.category); setPackageSize(p.packageSize); setSellingPrice(String(p.retailPrice ?? p.sellingPrice)); setWholesalePrice(String(p.wholesalePrice ?? p.sellingPrice)); setGstPercent(String(p.gstPercent ?? 0)); setStock(String(p.currentStock)); setShowModal(true); };

  const handleAdd = () => {
    if (!name || !sellingPrice) { toast.error(t('toast.fillRequired')); return; }
    if (editingId) { setProducts(prev => prev.map(p => p.id===editingId ? {...p,name,category,packageSize,sellingPrice:Number(sellingPrice),retailPrice:Number(sellingPrice),wholesalePrice:Number(wholesalePrice||sellingPrice),gstPercent:Number(gstPercent)||0,currentStock:Number(stock)||0}:p)); setShowModal(false); toast.success(`"${name}" updated`); return; }
    setProducts(prev => [...prev, {
      id: 'P' + String(prev.length + 1).padStart(3, '0'),
      name,
      category,
      packageSize,
      sellingPrice: Number(sellingPrice),
      retailPrice: Number(sellingPrice), wholesalePrice: Number(wholesalePrice||sellingPrice), gstPercent: Number(gstPercent)||0,
      currentStock: Number(stock) || 0,
      publishStatus: false,
    }]);
    setShowModal(false);
    setName(''); setSellingPrice(''); setWholesalePrice(''); setGstPercent('0'); setStock('');
    toast.success(`"${name}" ${t('toast.saved').toLowerCase()}`);
  };

  const togglePublish = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, publishStatus: !p.publishStatus } : p));
    toast.success(t('toast.catalogueUpdated'));
  };

  // Check if product is referenced
  const isProductReferenced = (productName: string) => {
    const inInvoices = invoices.some(inv => inv.items.some(item => item.name.includes(productName)));
    const inProduction = productionBatches.some(b => b.product === productName);
    return inInvoices || inProduction;
  };

  const handleRemoveProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (isProductReferenced(product.name)) {
      // Archive instead of delete
      setProducts(prev => prev.map(p =>
        p.id === id ? { ...p, publishStatus: false, name: `[Archived] ${p.name}` } : p
      ));
      toast.success(t('remove.productArchived'));
    } else {
      // Safe to remove
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success(t('remove.productSuccess'));
    }
    setRemoveTarget(null);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const removeProduct = removeTarget ? products.find(p => p.id === removeTarget) : null;
  const isReferenced = removeProduct ? isProductReferenced(removeProduct.name) : false;

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1 className="page-hd-title">{t('products.title')}</h1>
          <p className="page-hd-sub">{t('products.subtitle')}</p>
        </div>
        <div className="page-hd-actions">
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> {t('products.addProduct')}
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('products.searchProducts')}
          />
        </div>
        <div style={{ color: 'var(--clr-text-2)', fontSize: '13px' }}>
          {filtered.length} {t('products.title').toLowerCase()}
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('table.id')}</th>
                <th>{t('products.name')}</th>
                <th>{t('rawMaterials.category')}</th>
                <th>{t('products.packageSize')}</th>
                <th className="td-r">{t('products.sellingPrice')}</th>
                <th className="td-r">{t('products.stock')}</th>
                <th>{t('products.catalogue')}</th>
                <th className="td-c">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="td-mono td-dim">{p.id}</td>
                  <td className="td-bold">{p.name}</td>
                  <td>
                    <Badge
                      text={p.category}
                      variant={p.category === 'Blended Masala' ? 'green' : p.category === 'Ground Spice' ? 'orange' : 'gray'}
                    />
                  </td>
                  <td>{p.packageSize}</td>
                  <td className="td-r td-num">{formatCurrency(p.sellingPrice)}</td>
                  <td className="td-r td-num">{p.currentStock}</td>
                  <td>
                    <button onClick={() => togglePublish(p.id)}
                      className="toggle-btn"
                      style={{display:'inline-flex',alignItems:'center',gap:'6px',cursor:'pointer',background:'none',border:'none',padding:0}}>
                      <span style={{width:32,height:18,borderRadius:99,background:p.publishStatus?'#166534':'#D1D5DB',display:'inline-block',position:'relative',transition:'background 150ms',flexShrink:0}}>
                        <span style={{position:'absolute',top:2,left:p.publishStatus?14:2,width:14,height:14,borderRadius:'50%',background:'#fff',transition:'left 150ms',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}} />
                      </span>
                      <Badge text={p.publishStatus ? t('status.published') : t('status.draft')} variant={p.publishStatus ? 'green' : 'gray'} />
                    </button>
                  </td>
                  <td className="td-c">
                    <button onClick={() => openEdit(p.id)} className="btn btn-ghost btn-icon btn-sm" title="Edit"><Pencil size={15}/></button>
                    <button
                      onClick={() => setRemoveTarget(p.id)}
                      className="btn btn-ghost btn-icon btn-sm"
                      title={t('remove.product')}
                      aria-label={t('remove.product')}
                    >
                      <Trash2 size={15} style={{ color: '#DC2626' }} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr className="tbl-empty">
                  <td colSpan={8}>{t('table.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Product' : t('products.addProduct')}
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <button onClick={() => setShowModal(false)} className="btn btn-secondary">{t('action.cancel')}</button>
            <button onClick={handleAdd} className="btn btn-primary">{editingId ? 'Update' : t('action.save')}</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label className="label">{t('products.name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Paneer Masala" className="input" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">{t('rawMaterials.category')}</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                <option>Blended Masala</option>
                <option>Ground Spice</option>
                <option>Whole Spice Pack</option>
              </select>
            </div>
            <div className="field">
              <label className="label">{t('products.packageSize')}</label>
              <input value={packageSize} onChange={e=>setPackageSize(e.target.value)} className="input" list="package-sizes" placeholder="e.g. 100g / 1kg / 1 packet"/><datalist id="package-sizes"><option value="50g"/><option value="100g"/><option value="200g"/><option value="500g"/><option value="1kg"/><option value="1 packet"/><option value="1 box"/></datalist>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">Retail Selling Price incl. GST (₹)</label>
              <input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="e.g. 85" className="input" />
            </div><div className="field"><label className="label">Wholesale Selling Price incl. GST (₹)</label><input type="number" value={wholesalePrice} onChange={e=>setWholesalePrice(e.target.value)} placeholder="e.g. 75" className="input" /></div><div className="field"><label className="label">GST %</label><input type="number" min="0" max="100" value={gstPercent} onChange={e=>setGstPercent(e.target.value)} className="input"/><p className="text-xs text-gray-500 mt-1">GST is included in these prices. Retail taxable: {formatCurrency(Number(sellingPrice||0)/(1+Number(gstPercent||0)/100))} · Wholesale taxable: {formatCurrency(Number(wholesalePrice||sellingPrice||0)/(1+Number(gstPercent||0)/100))}</p>
            </div>
            <div className="field">
              <label className="label">{t('rawMaterials.openingStock')}</label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="e.g. 100" className="input" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Remove Product Confirmation */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={t('remove.productConfirm')}
        footer={
          <>
            <button onClick={() => setRemoveTarget(null)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button
              onClick={() => removeTarget && handleRemoveProduct(removeTarget)}
              className="btn"
              style={{ background: '#DC2626', color: '#fff' }}
            >
              {isReferenced ? t('remove.archiveBtn') : t('remove.confirmBtn')}
            </button>
          </>
        }
      >
        {removeProduct && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{t('remove.productMessage')}</p>
            {isReferenced && (
              <div className="info-banner-warn">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                  <p className="text-sm text-amber-800">{t('remove.productWarning')}</p>
                </div>
              </div>
            )}
            <div className="p-3 rounded-md" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <p className="text-sm"><strong>{t('products.name')}:</strong> {removeProduct.name}</p>
              <p className="text-sm"><strong>{t('rawMaterials.category')}:</strong> {removeProduct.category}</p>
              <p className="text-sm"><strong>{t('products.stock')}:</strong> {removeProduct.currentStock}</p>
            </div>
            <p className="text-xs text-gray-400">{t('remove.affects')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
