import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, Trash2, AlertTriangle, Archive, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Production() {
  const { products, rawMaterials, productionBatches, setProductionBatches, setRawMaterials, setProducts } = useApp();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [editingId,setEditingId]=useState<string|null>(null);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [batchNumber, setBatchNumber] = useState(`BATCH-2026-${String(productionBatches.length + 45).padStart(4, '0')}`);
  const [prodDate, setProdDate] = useState(new Date().toISOString().split('T')[0]);
  const [qtyProduced, setQtyProduced] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState<{ materialId: string; quantity: string }[]>([
    { materialId: '', quantity: '' },
  ]);

  
  const openNew=()=>{setEditingId(null);
    setSelectedProduct('');setQtyProduced('');setMaterialsUsed([{materialId:'',quantity:''}]);setProdDate(new Date().toISOString().split('T')[0]);setShowForm(true);};
  const openEdit=(id:string)=>{const b=productionBatches.find(x=>x.id===id);if(!b)return;const prod=products.find(p=>p.name===b.product);setEditingId(id);setSelectedProduct(prod?.id||'');setBatchNumber(b.batchNumber);setProdDate(b.productionDate);setQtyProduced(String(b.quantityProduced));setMaterialsUsed(b.materialsConsumed.map(mc=>({materialId:rawMaterials.find(r=>r.name===mc.material)?.id||'',quantity:String(mc.quantity)})));setShowForm(true);};

  const addMaterialRow = () => setMaterialsUsed(prev => [...prev, { materialId: '', quantity: '' }]);
  const removeMaterialRow = (idx: number) => setMaterialsUsed(prev => prev.filter((_, i) => i !== idx));
  const updateMaterialRow = (idx: number, field: 'materialId' | 'quantity', value: string) => {
    setMaterialsUsed(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const getMaterialName = (id: string) => rawMaterials.find(m => m.id === id)?.name || '';
  const getMaterialUnit = (id: string) => rawMaterials.find(m => m.id === id)?.unit || 'kg';

  const handleOpenConfirm = () => {
    if (!selectedProduct || !qtyProduced) { toast.error(t('toast.fillRequired')); return; }
    const hasValidMaterials = materialsUsed.some(m => m.materialId && m.quantity);
    if (!hasValidMaterials) { toast.error(t('toast.addItems')); return; }
    setShowConfirm(true);
  };

  const handleConfirmProduction = () => {
    const productName = products.find(p => p.id === selectedProduct)?.name || '';
    const oldBatch = editingId ? productionBatches.find(b=>b.id===editingId) : undefined;
    if(oldBatch){ setRawMaterials(prev=>prev.map(m=>{const old=oldBatch.materialsConsumed.find(x=>x.material===m.name);return old?{...m,currentStock:m.currentStock+old.quantity}:m;})); const oldProduct=products.find(p=>p.name===oldBatch.product); if(oldProduct)setProducts(prev=>prev.map(p=>p.id===oldProduct.id?{...p,currentStock:Math.max(0,p.currentStock-oldBatch.quantityProduced)}:p)); }

    // Update raw material stocks (deduct)
    setRawMaterials(prev => prev.map(m => {
      const used = materialsUsed.find(mu => mu.materialId === m.id);
      if (used) {
        return { ...m, currentStock: Math.max(0, m.currentStock - Number(used.quantity)) };
      }
      return m;
    }));

    // Update product stock (add)
    setProducts(prev => prev.map(p => {
      if (p.id === selectedProduct) {
        return { ...p, currentStock: p.currentStock + Number(qtyProduced) };
      }
      return p;
    }));

    // Add batch to history
    const batchData={batchNumber,product:productName,productionDate:prodDate,quantityProduced:Number(qtyProduced),materialsConsumed:materialsUsed.filter(m=>m.materialId&&m.quantity).map(m=>({material:getMaterialName(m.materialId),quantity:Number(m.quantity),unit:getMaterialUnit(m.materialId)})),status:'Completed' as const};
    if(editingId) setProductionBatches(prev=>prev.map(b=>b.id===editingId?{...b,...batchData}:b)); else setProductionBatches(prev=>[{id:'PB'+Date.now(),...batchData},...prev]);

    setShowConfirm(false);
    setShowForm(false);
    setEditingId(null);
    setSelectedProduct('');
    setQtyProduced('');
    setMaterialsUsed([{ materialId: '', quantity: '' }]);
    setBatchNumber(`BATCH-2026-${String(productionBatches.length + 46).padStart(4, '0')}`);
    toast.success(t('toast.productionCompleted'));
  };

  // Remove/Archive batch
  const handleRemoveBatch = (batchId: string) => {
    const batch = productionBatches.find(b => b.id === batchId);
    if (!batch) return;
    // Archive: filter out from visible list
    setProductionBatches(prev => prev.filter(b => b.id !== batchId));
    setShowRemoveConfirm(null);
    toast.success(t('remove.batchSuccess'));
  };

  const removeBatch = showRemoveConfirm ? productionBatches.find(b => b.id === showRemoveConfirm) : null;

  // Filter out archived batches (if we add an archived flag later)
  const visibleBatches = productionBatches;

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1 className="page-hd-title">{t('production.title')}</h1>
          <p className="page-hd-sub">{t('production.subtitle')}</p>
        </div>
        <div className="page-hd-actions">
          <button onClick={openNew} className="btn btn-primary">
            <Plus size={16} /> {t('production.newBatch')}
          </button>
        </div>
      </div>

      {/* Production Batch History */}
      <div className="tbl-wrap">
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('production.batchNumber')}</th>
                <th>{t('sales.product')}</th>
                <th>{t('table.date')}</th>
                <th className="td-r">{t('production.qtyProduced')}</th>
                <th>{t('production.materialsUsed')}</th>
                <th className="td-c">{t('table.status')}</th>
                <th className="td-c">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleBatches.map(batch => (
                <tr key={batch.id}>
                  <td className="td-mono">{batch.batchNumber}</td>
                  <td className="td-bold">{batch.product}</td>
                  <td>{new Date(batch.productionDate).toLocaleDateString('en-IN')}</td>
                  <td className="td-r td-num td-bold">{batch.quantityProduced} pkt</td>
                  <td>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {batch.materialsConsumed.map(mc => `${mc.material}: ${mc.quantity} ${mc.unit}`).join(', ')}
                    </div>
                  </td>
                  <td className="td-c">
                    <Badge text={batch.status} variant={batch.status === 'Completed' ? 'green' : 'orange'} />
                  </td>
                  <td className="td-c">
                    <button onClick={()=>openEdit(batch.id)} className="btn btn-ghost btn-icon btn-sm" title="Edit"><Pencil size={15}/></button>
                    <button
                      onClick={() => setShowRemoveConfirm(batch.id)}
                      className="btn btn-ghost btn-icon btn-sm"
                      title={t('remove.batch')}
                      aria-label={t('remove.batch')}
                    >
                      <Trash2 size={15} style={{ color: '#DC2626' }} />
                    </button>
                  </td>
                </tr>
              ))}
              {visibleBatches.length === 0 && (
                <tr className="tbl-empty"><td colSpan={7}>{t('table.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Production Batch Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Production Batch' : t('production.newBatch')}
        width="max-w-2xl"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button onClick={handleOpenConfirm} className="btn btn-primary">{t('production.confirmProduction')}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid-2">
            <div className="field">
              <label className="label">{t('sales.product')}</label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="input select">
                <option value="">{t('misc.selectProduct')}</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.packageSize})</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">{t('production.batchNumber')}</label>
              <input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">{t('production.productionDate')}</label>
              <input type="date" value={prodDate} onChange={e => setProdDate(e.target.value)} className="input" />
            </div>
            <div className="field">
              <label className="label">{t('production.qtyProduced')} (packets)</label>
              <input type="number" value={qtyProduced} onChange={e => setQtyProduced(e.target.value)} placeholder="e.g. 100" className="input" />
            </div>
          </div>

          {/* Raw Materials Consumed — IMPROVED DROPDOWN */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">{t('production.materialsConsumed')}</label>
              <button onClick={addMaterialRow} className="btn btn-ghost btn-sm">+ {t('production.addMaterial')}</button>
            </div>
            <div className="space-y-3">
              {materialsUsed.map((row, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="field flex-1" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '11px' }}>
                      {t('production.rawMaterialLabel')}
                    </label>
                    <select
                      value={row.materialId}
                      onChange={e => updateMaterialRow(idx, 'materialId', e.target.value)}
                      className="input select"
                    >
                      <option value="">{t('production.selectRawMaterial')}</option>
                      {rawMaterials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {t('production.stock')}: {m.currentStock} {m.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ marginBottom: 0, width: '100px' }}>
                    <label className="label" style={{ fontSize: '11px' }}>
                      {t('production.quantityLabel')}
                    </label>
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={e => updateMaterialRow(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="input"
                    />
                  </div>
                  <span className="text-xs text-gray-400 pb-2 w-8 shrink-0">
                    {row.materialId ? getMaterialUnit(row.materialId) : ''}
                  </span>
                  {materialsUsed.length > 1 && (
                    <button onClick={() => removeMaterialRow(idx)} className="btn btn-danger btn-icon" style={{ marginBottom: '2px' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={t('production.confirmProduction')}
        footer={
          <>
            <button onClick={() => setShowConfirm(false)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button onClick={handleConfirmProduction} className="btn btn-primary">
              ✓ {t('action.confirm')}
            </button>
          </>
        }
      >
        <div className="info-banner-warn">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-800 text-sm">{t('production.confirmMessage')}</p>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-700 font-medium">{t('production.deducted')}:</p>
                {materialsUsed.filter(m => m.materialId && m.quantity).map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-red-700 ml-4">
                    <span>▸</span> {Number(m.quantity)} {getMaterialUnit(m.materialId)} of <strong>{getMaterialName(m.materialId)}</strong>
                  </div>
                ))}
                <div className="divider my-2"></div>
                <p className="text-sm text-gray-700 font-medium">{t('production.added')}:</p>
                <div className="flex items-center gap-2 text-sm text-green-700 ml-4">
                  <span>▸</span> +{qtyProduced} packets of <strong>{products.find(p => p.id === selectedProduct)?.name}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Remove Batch Confirmation */}
      <Modal
        isOpen={!!showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(null)}
        title={t('remove.batchConfirm')}
        footer={
          <>
            <button onClick={() => setShowRemoveConfirm(null)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button onClick={() => showRemoveConfirm && handleRemoveBatch(showRemoveConfirm)} className="btn btn-primary" style={{ background: '#B45309' }}>
              <Archive size={14} /> {t('remove.archiveBtn')}
            </button>
          </>
        }
      >
        {removeBatch && (
          <div className="space-y-3">
            <div className="info-banner-warn">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-medium text-amber-800 text-sm">{t('remove.batchMessage')}</p>
                  <p className="text-xs text-amber-700 mt-1">{t('remove.affects')}</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-md" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <p className="text-sm"><strong>{t('production.batchNumber')}:</strong> {removeBatch.batchNumber}</p>
              <p className="text-sm"><strong>{t('sales.product')}:</strong> {removeBatch.product}</p>
              <p className="text-sm"><strong>{t('production.qtyProduced')}:</strong> {removeBatch.quantityProduced} pkt</p>
              <p className="text-sm"><strong>{t('table.status')}:</strong> {removeBatch.status}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
