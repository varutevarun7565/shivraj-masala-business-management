import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, ShoppingBag, ArrowLeft, Search, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RawMaterial } from '../data/mockData';
import { compatibleUnits, convertToBase } from '../utils/units';

const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function RawMaterials() {
  const { rawMaterials, setRawMaterials } = useApp();
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Add form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'Seeds' | 'Powder' | 'Whole Spice' | 'Other'>('Seeds');
  const [newUnit, setNewUnit] = useState('kg');
  const [newStock, setNewStock] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newWholesalePrice,setNewWholesalePrice]=useState(''); const [newGstPercent,setNewGstPercent]=useState('0');

  // Purchase form state
  const [purchaseMaterial, setPurchaseMaterial] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseUnit,setPurchaseUnit]=useState('kg');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingTotal, setSellingTotal] = useState(''); const [wholesaleSellingTotal,setWholesaleSellingTotal]=useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [supplierGstin,setSupplierGstin]=useState(''); const [supplierInvoiceNo,setSupplierInvoiceNo]=useState(''); const [purchaseGstPercent,setPurchaseGstPercent]=useState('0');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const openAddMaterial=()=>{setEditingId(null);setNewName('');setNewCategory('Seeds');setNewUnit('kg');setNewStock('');setNewThreshold('');setNewPrice('');setNewWholesalePrice('');setNewGstPercent('0');setShowAddModal(true);};
  const openEditMaterial=(id:string)=>{const m=rawMaterials.find(x=>x.id===id);if(!m)return;setEditingId(id);setNewName(m.name);setNewCategory(m.category);setNewUnit(m.unit);setNewStock(String(m.currentStock));setNewThreshold(String(m.lowStockThreshold));setNewPrice(String(m.retailPrice ?? m.pricePerUnit));setNewWholesalePrice(String(m.wholesalePrice ?? m.pricePerUnit));setNewGstPercent(String(m.gstPercent ?? 0));setShowAddModal(true);};

  const handleAddMaterial = () => {
    if (!newName) { toast.error(t('toast.fillRequired')); return; }
    if(editingId){setRawMaterials(prev=>prev.map(m=>m.id===editingId?{...m,name:newName,category:newCategory,currentStock:Number(newStock)||0,unit:newUnit,lowStockThreshold:Number(newThreshold)||0,pricePerUnit:Number(newPrice)||0,retailPrice:Number(newPrice)||0,wholesalePrice:Number(newWholesalePrice||newPrice)||0,gstPercent:Number(newGstPercent)||0}:m));setShowAddModal(false);toast.success(`"${newName}" updated`);return;}
    const id = 'RM' + String(rawMaterials.length + 1).padStart(3, '0');
    const newMaterial: RawMaterial = {
      id,
      name: newName,
      category: newCategory,
      currentStock: Number(newStock) || 0,
      unit: newUnit,
      lowStockThreshold: Number(newThreshold) || 10,
      pricePerUnit: Number(newPrice) || 0, retailPrice:Number(newPrice)||0, wholesalePrice:Number(newWholesalePrice||newPrice)||0, gstPercent:Number(newGstPercent)||0,
      purchaseHistory: [],
      consumptionHistory: [],
      saleHistory: [],
    };
    setRawMaterials(prev => [...prev, newMaterial]);
    setShowAddModal(false);
    setNewName(''); setNewStock(''); setNewThreshold('');
    toast.success(`"${newName}" ${t('toast.saved').toLowerCase()}`);
  };

  const handlePurchase = () => {
    if (!purchaseMaterial || !purchaseQty) { toast.error(t('toast.fillRequired')); return; }
    const material=rawMaterials.find(m=>m.id===purchaseMaterial);
    const qty = material ? convertToBase(Number(purchaseQty),purchaseUnit,material.unit) : Number(purchaseQty);
    const purchaseTotal = Number(purchasePrice) || 0;
    const purchaseGstRate = Number(purchaseGstPercent)||0;
    const taxableAmount = purchaseGstRate > 0 ? purchaseTotal / (1 + purchaseGstRate/100) : purchaseTotal;
    const purchaseGst = purchaseTotal - taxableAmount;
    const purchaseRate = qty > 0 ? purchaseTotal / qty : 0;
    const sellingRate = qty > 0 ? (Number(sellingTotal) || 0) / qty : 0; const wholesaleSellingRate=qty>0?(Number(wholesaleSellingTotal)||Number(sellingTotal)||0)/qty:0;
    setRawMaterials(prev => prev.map(m => {
      if (m.id === purchaseMaterial) {
        return {
          ...m,
          currentStock: m.currentStock + qty,
          pricePerUnit: sellingRate, retailPrice:sellingRate, wholesalePrice:wholesaleSellingRate,
          purchaseHistory: [
            {
              id: 'PH' + Date.now(),
              date: purchaseDate,
              quantity: qty,
              pricePerUnit: purchaseRate,
              totalPrice: purchaseTotal,
              supplier: purchaseSupplier || 'Unknown', supplierGstin:supplierGstin.trim().toUpperCase(), supplierInvoiceNo:supplierInvoiceNo.trim(), taxableAmount, gstPercent:Number(purchaseGstPercent)||0, gstAmount:purchaseGst, grandTotal:purchaseTotal,
            },
            ...m.purchaseHistory,
          ],
        };
      }
      return m;
    }));
    setShowPurchaseModal(false);
    setPurchaseMaterial(''); setPurchaseQty(''); setPurchasePrice(''); setSellingTotal(''); setWholesaleSellingTotal(''); setPurchaseSupplier(''); setSupplierGstin(''); setSupplierInvoiceNo(''); setPurchaseGstPercent('0');
    toast.success(t('toast.stockUpdated'));
  };

  // Check if material has history
  const hasMaterialHistory = (material: RawMaterial) => {
    return material.purchaseHistory.length > 0 ||
           material.consumptionHistory.length > 0 ||
           material.saleHistory.length > 0;
  };

  const handleRemoveMaterial = (id: string) => {
    const material = rawMaterials.find(m => m.id === id);
    if (!material) return;

    if (hasMaterialHistory(material)) {
      toast.error(t('remove.materialBlocked'));
      setRemoveTarget(null);
      return;
    }

    setRawMaterials(prev => prev.filter(m => m.id !== id));
    setRemoveTarget(null);
    toast.success(t('remove.materialSuccess'));
  };

  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter(m => {
      if (filterType === 'Low Stock Only' && m.currentStock > m.lowStockThreshold) return false;
      if (searchTerm && !m.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [rawMaterials, filterType, searchTerm]);

  const totalMaterials = rawMaterials.length;
  const lowStockCount = rawMaterials.filter(m => m.currentStock <= m.lowStockThreshold).length;
  const totalValue = rawMaterials.reduce((acc, m) => acc + (m.currentStock * m.pricePerUnit), 0);

  const removeMaterial = removeTarget ? rawMaterials.find(m => m.id === removeTarget) : null;
  const removeHasHistory = removeMaterial ? hasMaterialHistory(removeMaterial) : false;

  if (selectedMaterial) {
    return (
      <div>
        <button onClick={() => setSelectedMaterial(null)} className="btn btn-ghost mb-4">
          <ArrowLeft size={16} /> {t('action.back')}
        </button>

        <div className="card mb-4">
          <div className="card-header flex justify-between items-start">
            <div>
              <h2 className="card-title">{selectedMaterial.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedMaterial.category} · {selectedMaterial.unit}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#1B5E20]">{selectedMaterial.currentStock} {selectedMaterial.unit}</p>
              <p className="text-xs text-gray-400">{t('rawMaterials.currentStock')}</p>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title text-sm">{t('rawMaterials.purchaseHistory')}</h3>
          </div>
          <div className="tbl-wrap">
            <div className="tbl-scroll">
              <table className="tbl">
                <thead><tr>
                  <th>{t('table.date')}</th>
                  <th>{t('rawMaterials.supplier')}</th>
                  <th className="td-r">{t('rawMaterials.quantity')}</th>
                  <th className="td-r">{t('rawMaterials.pricePerUnit')}</th>
                  <th className="td-r">{t('table.total')}</th>
                </tr></thead>
                <tbody>
                  {selectedMaterial.purchaseHistory.map(ph => (
                    <tr key={ph.id}>
                      <td>{new Date(ph.date).toLocaleDateString('en-IN')}</td>
                      <td>{ph.supplier}</td>
                      <td className="td-r td-num">{ph.quantity} {selectedMaterial.unit}</td>
                      <td className="td-r td-num">{formatCurrency(ph.pricePerUnit)}</td>
                      <td className="td-r td-bold td-num">{formatCurrency(ph.totalPrice)}</td>
                    </tr>
                  ))}
                  {selectedMaterial.purchaseHistory.length === 0 && (
                    <tr className="tbl-empty"><td colSpan={5}>{t('table.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Consumption History */}
        <div className="card mb-4">
          <div className="card-header">
            <h3 className="card-title text-sm">{t('rawMaterials.consumptionHistory')}</h3>
          </div>
          <div className="tbl-wrap">
            <div className="tbl-scroll">
              <table className="tbl">
                <thead><tr>
                  <th>{t('table.date')}</th>
                  <th>{t('production.batchNumber')}</th>
                  <th>{t('sales.product')}</th>
                  <th className="td-r">{t('rawMaterials.quantity')}</th>
                </tr></thead>
                <tbody>
                  {selectedMaterial.consumptionHistory.map(ch => (
                    <tr key={ch.id}>
                      <td>{new Date(ch.date).toLocaleDateString('en-IN')}</td>
                      <td className="td-mono">{ch.batchNumber}</td>
                      <td>{ch.product}</td>
                      <td className="td-r td-num">{ch.quantity} {selectedMaterial.unit}</td>
                    </tr>
                  ))}
                  {selectedMaterial.consumptionHistory.length === 0 && (
                    <tr className="tbl-empty"><td colSpan={4}>{t('table.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Direct Sale History */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title text-sm">{t('rawMaterials.saleHistory')}</h3>
          </div>
          <div className="tbl-wrap">
            <div className="tbl-scroll">
              <table className="tbl">
                <thead><tr>
                  <th>{t('table.date')}</th>
                  <th>{t('sales.customer')}</th>
                  <th>{t('sales.invoiceNo')}</th>
                  <th className="td-r">{t('rawMaterials.quantity')}</th>
                  <th className="td-r">{t('rawMaterials.pricePerUnit')}</th>
                </tr></thead>
                <tbody>
                  {selectedMaterial.saleHistory.map(sh => (
                    <tr key={sh.id}>
                      <td>{new Date(sh.date).toLocaleDateString('en-IN')}</td>
                      <td>{sh.customer}</td>
                      <td className="td-mono">{sh.invoiceNo}</td>
                      <td className="td-r td-num">{sh.quantity} {selectedMaterial.unit}</td>
                      <td className="td-r td-num">{formatCurrency(sh.pricePerUnit)}</td>
                    </tr>
                  ))}
                  {selectedMaterial.saleHistory.length === 0 && (
                    <tr className="tbl-empty"><td colSpan={5}>{t('table.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1 className="page-hd-title">{t('rawMaterials.title')}</h1>
          <p className="page-hd-sub">{t('rawMaterials.subtitle')}</p>
        </div>
        <div className="page-hd-actions">
          <button onClick={() => setShowPurchaseModal(true)} className="btn btn-secondary">
            <ShoppingBag size={16} /> {t('rawMaterials.purchaseEntry')}
          </button>
          <button onClick={() => openAddMaterial()} className="btn btn-primary">
            <Plus size={16} /> {t('rawMaterials.addMaterial')}
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon-wrap"></div>
          <div className="stat-label">{t('rawMaterials.totalMaterials')}</div>
          <div className="stat-value">{totalMaterials}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"></div>
          <div className="stat-label">{t('dashboard.lowStock')}</div>
          <div className={`stat-value ${lowStockCount > 0 ? 'text-red-600' : ''}`}>{lowStockCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"></div>
          <div className="stat-label">{t('rawMaterials.stockValue')}</div>
          <div className="stat-value">{formatCurrency(totalValue)}</div>
        </div>
      </div>

      <div className="toolbar mb-4 flex items-center justify-between">
        <div className="flex gap-3">
          <div className="search-box relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('action.search') + '...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input select w-auto">
            <option value="All">{t('expenses.allCategories')}</option>
            <option value="Low Stock Only">{t('dashboard.lowStock')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('table.id')}</th>
                <th>{t('rawMaterials.name')}</th>
                <th>{t('rawMaterials.category')}</th>
                <th className="td-r">{t('rawMaterials.currentStock')}</th>
                <th>{t('rawMaterials.unit')}</th>
                <th className="td-r">{t('rawMaterials.threshold')}</th>
                <th className="td-r">{t('rawMaterials.pricePerUnit')}</th>
                <th className="td-c">{t('table.status')}</th>
                <th className="td-c">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(m => {
                const isLow = m.currentStock <= m.lowStockThreshold;
                const badgeVar = m.category === 'Seeds' ? 'green' : m.category === 'Powder' ? 'blue' : m.category === 'Whole Spice' ? 'orange' : 'gray';
                return (
                  <tr
                    key={m.id}
                    className="tbl-row-clickable"
                    style={isLow ? { background: '#FFF5F5' } : undefined}
                  >
                    <td className="td-mono td-dim">{m.id}</td>
                    <td className="td-bold" onClick={() => setSelectedMaterial(m)} style={{ cursor: 'pointer' }}>{m.name}</td>
                    <td>
                      <Badge text={m.category} variant={badgeVar as any} />
                    </td>
                    <td className={`td-r td-num ${isLow ? 'text-red-600 font-bold' : ''}`}>
                      {m.currentStock}
                    </td>
                    <td>{m.unit}</td>
                    <td className="td-r td-num td-dim">{m.lowStockThreshold}</td>
                    <td className="td-r td-num">{formatCurrency(m.pricePerUnit)}</td>
                    <td className="td-c">
                      {isLow ? <Badge text={t('status.lowStock')} variant="red" /> : <Badge text={t('status.ok')} variant="green" />}
                    </td>
                    <td className="td-c">
                      <button onClick={(e)=>{e.stopPropagation();openEditMaterial(m.id)}} className="btn btn-ghost btn-icon btn-sm" title="Edit"><Pencil size={15}/></button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRemoveTarget(m.id); }}
                        className="btn btn-ghost btn-icon btn-sm"
                        title={t('remove.material')}
                        aria-label={t('remove.material')}
                      >
                        <Trash2 size={15} style={{ color: '#DC2626' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr className="tbl-empty"><td colSpan={9}>{t('table.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Material Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingId ? 'Edit Raw Material' : t('rawMaterials.addMaterial')}
        footer={
          <>
            <button onClick={() => setShowAddModal(false)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button onClick={handleAddMaterial} className="btn btn-primary">{editingId ? 'Update' : t('action.save')}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="field">
            <label className="label">{t('rawMaterials.name')}</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Ajwain" className="input" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">{t('rawMaterials.category')}</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="input select">
                <option>Seeds</option><option>Powder</option><option>Whole Spice</option><option>Other</option>
              </select>
            </div>
            <div className="field">
              <label className="label">{t('rawMaterials.unit')}</label>
              <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="input select">
                <option>kg</option><option>g</option><option>quintal</option><option>ton</option><option>litre</option><option>ml</option><option>piece</option><option>packet</option><option>box</option><option>bag</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">{t('rawMaterials.openingStock')}</label>
              <input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} placeholder="0" className="input" />
            </div>
            <div className="field">
              <label className="label">Retail Selling Price / Unit incl. GST (₹)</label><input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0" className="input" /></div><div className="field"><label className="label">Wholesale Selling Price / Unit incl. GST (₹)</label><input type="number" value={newWholesalePrice} onChange={e=>setNewWholesalePrice(e.target.value)} className="input"/></div><div className="field"><label className="label">Selling GST %</label><input type="number" min="0" max="100" value={newGstPercent} onChange={e=>setNewGstPercent(e.target.value)} className="input"/>
            </div><div className="field"><label className="label">{t('rawMaterials.threshold')}</label>
              <input type="number" value={newThreshold} onChange={e => setNewThreshold(e.target.value)} placeholder="10" className="input" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Purchase Entry Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title={t('rawMaterials.purchaseEntry')}
        footer={
          <>
            <button onClick={() => setShowPurchaseModal(false)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button onClick={handlePurchase} className="btn btn-primary">{t('action.save')}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="field">
            <label className="label">{t('production.rawMaterialLabel')}</label>
            <select value={purchaseMaterial} onChange={e => {setPurchaseMaterial(e.target.value); const m=rawMaterials.find(x=>x.id===e.target.value); if(m)setPurchaseUnit(m.unit);}} className="input select">
              <option value="">{t('production.selectRawMaterial')}</option>
              {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">{t('rawMaterials.quantity')}</label>
              <div style={{display:'flex',gap:8}}><input type="number" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} placeholder="e.g. 25" className="input" /><select className="input" value={purchaseUnit} onChange={e=>setPurchaseUnit(e.target.value)}>{compatibleUnits(rawMaterials.find(m=>m.id===purchaseMaterial)?.unit||purchaseUnit).map(u=><option key={u}>{u}</option>)}</select></div>
            </div>
            <div className="field">
              <label className="label">Supplier Invoice Amount incl. GST (₹)</label>
              <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="e.g. 1000" className="input" />
            </div>
          </div>
          <div className="grid-2"><div className="field"><label className="label">Retail Selling Amount incl. GST (₹)</label><input type="number" value={sellingTotal} onChange={e=>setSellingTotal(e.target.value)} className="input"/></div><div className="field"><label className="label">Wholesale Selling Amount incl. GST (₹)</label><input type="number" value={wholesaleSellingTotal} onChange={e=>setWholesaleSellingTotal(e.target.value)} className="input"/></div></div><div className="field">
            {Number(purchaseQty) > 0 && (
              <p className="text-xs text-gray-500 mt-1">Purchase rate: {formatCurrency((Number(purchasePrice) || 0) / Number(purchaseQty))}/{rawMaterials.find(m => m.id === purchaseMaterial)?.unit || 'unit'} · Selling rate: {formatCurrency((Number(sellingTotal) || 0) / Number(purchaseQty))}/{rawMaterials.find(m => m.id === purchaseMaterial)?.unit || 'unit'}</p>
            )}
          </div>
          <div className="field">
            <label className="label">{t('rawMaterials.supplier')}</label>
            <input value={purchaseSupplier} onChange={e => setPurchaseSupplier(e.target.value)} placeholder="e.g. Gujarat Masala Mart" className="input" />
          </div><div className="grid-2"><div className="field"><label className="label">Supplier GSTIN</label><input value={supplierGstin} onChange={e=>setSupplierGstin(e.target.value)} className="input" placeholder="27ABCDE1234F1Z5"/></div><div className="field"><label className="label">Supplier Invoice No.</label><input value={supplierInvoiceNo} onChange={e=>setSupplierInvoiceNo(e.target.value)} className="input"/></div></div><div className="field"><label className="label">Purchase GST %</label><input type="number" min="0" max="100" value={purchaseGstPercent} onChange={e=>setPurchaseGstPercent(e.target.value)} className="input"/><p className="text-xs text-gray-500 mt-1">Input GST included: {formatCurrency((Number(purchasePrice)||0)-((Number(purchaseGstPercent)||0)>0?(Number(purchasePrice)||0)/(1+(Number(purchaseGstPercent)||0)/100):(Number(purchasePrice)||0)))} · Taxable value: {formatCurrency((Number(purchaseGstPercent)||0)>0?(Number(purchasePrice)||0)/(1+(Number(purchaseGstPercent)||0)/100):(Number(purchasePrice)||0))}</p></div>
          <div className="field">
            <label className="label">{t('table.date')}</label>
            <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="input" />
          </div>
        </div>
      </Modal>

      {/* Remove Material Confirmation */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={t('remove.materialConfirm')}
        footer={
          <>
            <button onClick={() => setRemoveTarget(null)} className="btn btn-ghost">{t('action.cancel')}</button>
            {!removeHasHistory && (
              <button
                onClick={() => removeTarget && handleRemoveMaterial(removeTarget)}
                className="btn"
                style={{ background: '#DC2626', color: '#fff' }}
              >
                {t('remove.confirmBtn')}
              </button>
            )}
          </>
        }
      >
        {removeMaterial && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{t('remove.materialMessage')}</p>
            {removeHasHistory && (
              <div className="info-banner-warn">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                  <p className="text-sm text-amber-800">{t('remove.materialBlocked')}</p>
                </div>
              </div>
            )}
            <div className="p-3 rounded-md" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <p className="text-sm"><strong>{t('rawMaterials.name')}:</strong> {removeMaterial.name}</p>
              <p className="text-sm"><strong>{t('rawMaterials.category')}:</strong> {removeMaterial.category}</p>
              <p className="text-sm"><strong>{t('rawMaterials.currentStock')}:</strong> {removeMaterial.currentStock} {removeMaterial.unit}</p>
              <p className="text-sm"><strong>{t('rawMaterials.purchaseHistory')}:</strong> {removeMaterial.purchaseHistory.length} {t('expenses.entries')}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
