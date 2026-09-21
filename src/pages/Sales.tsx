import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, Trash2, FileText, Download, Eye, CheckCircle2, Copy, FolderOpen, MessageCircle, CalendarDays, UserRound, Phone, IndianRupee, Pencil, Share2, ChevronDown, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateInvoicePDF, generateInvoicePDFBase64 } from '../utils/pdfGenerator';
import { compatibleUnits, convertToBase, unitLabel } from '../utils/units';
import { validateIndianPhone, buildWhatsAppMessage } from '../utils/phoneUtils';

const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

interface LineItem {
  type: 'product' | 'rawMaterial' | 'service';
  itemId: string;
  name: string;
  qty: number | '';
  price: number;
  discount: number | ''; // percentage; blank is allowed while typing
  unit: string;
  baseUnit: string;
  gstPercent: number;
  hsnSac?: string;
}

export default function Sales() {
  const { customers, products, rawMaterials, services, invoices, setInvoices, setProducts, setRawMaterials, setCustomers } = useApp();
  const { t, language } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<typeof invoices[0] | null>(null);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');

  // Add item state
  const [itemType, setItemType] = useState<'product' | 'rawMaterial' | 'service'>('product');
  const [itemId, setItemId] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemDiscount, setItemDiscount] = useState('0');

  // WhatsApp share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareInvoice, setShareInvoice] = useState<typeof invoices[0] | null>(null);
  const [shareCustomerName, setShareCustomerName] = useState('');
  const [shareCustomerPhone, setShareCustomerPhone] = useState('');
  const [sharePdfPath, setSharePdfPath] = useState('');
  const [shareWhatsAppOpened, setShareWhatsAppOpened] = useState(false);
  const [generating, setGenerating] = useState(false);

  const selectedCustomerRecord = customers.find(c=>c.id===selectedCustomer);
  const priceKind = selectedCustomerRecord?.customerType === 'Wholesale' ? 'Wholesale' : 'Retail';
  const getItemOptions = () => {
    const wholesale=priceKind==='Wholesale';
    if (itemType === 'product') return products.map(p => ({ id:p.id,name:`${p.name} (${p.packageSize})`,price:wholesale?(p.wholesalePrice??p.sellingPrice):(p.retailPrice??p.sellingPrice),gstPercent:p.gstPercent??0,hsnSac:p.hsnSac??'',baseUnit:'packet' }));
    if (itemType === 'rawMaterial') return rawMaterials.map(m => ({ id:m.id,name:m.name,price:wholesale?(m.wholesalePrice??m.pricePerUnit):(m.retailPrice??m.pricePerUnit),gstPercent:m.gstPercent??0,hsnSac:m.hsnSac??'',baseUnit:unitLabel(m.unit) }));
    return services.map(x => ({ id:x.id,name:x.name,price:wholesale?(x.wholesalePrice??x.price):(x.retailPrice??x.price),gstPercent:x.gstPercent??0,hsnSac:x.hsnSac??'',baseUnit:unitLabel(x.unit) }));
  };

  const handleAddItem = (selectedId = itemId) => {
    if (!selectedId) { toast.error(t('toast.addItems')); return; }
    const options = getItemOptions();
    const option = options.find(o => o.id === selectedId);
    if (!option) return;

    setLineItems(prev => [...prev, {
      type: itemType,
      itemId: selectedId,
      name: option.name,
      qty: Number(itemQty) || 1,
      price: option.price,
      discount: Math.min(100, Math.max(0, Number(itemDiscount) || 0)),
      unit: option.baseUnit, baseUnit: option.baseUnit, gstPercent: option.gstPercent || 0, hsnSac: option.hsnSac || '',
    }]);
    setItemId('');
    setItemQty('1');
    setItemDiscount('0');
  };

  const removeItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const numericQty=(item:LineItem)=>item.qty === '' ? 0 : Number(item.qty);
  const numericDiscount=(item:LineItem)=>item.discount === '' ? 0 : Math.min(100, Math.max(0, Number(item.discount)));
  const lineBaseQty=(item:LineItem)=>convertToBase(numericQty(item),item.unit,item.baseUnit);
  const lineGross=(item:LineItem)=>lineBaseQty(item)*item.price;
  const lineDiscount=(item:LineItem)=>lineGross(item)*(numericDiscount(item)/100);
  // Retail/wholesale prices entered by the operator are FINAL GST-INCLUSIVE prices.
  // GST is reverse-calculated from the discounted final amount for accounting.
  const lineFinalAfterDiscount=(item:LineItem)=>lineGross(item)-lineDiscount(item);
  const lineTaxable=(item:LineItem)=>{ const final=lineFinalAfterDiscount(item); const r=item.gstPercent||0; return r>0 ? final/(1+r/100) : final; };
  const lineGst=(item:LineItem)=>lineFinalAfterDiscount(item)-lineTaxable(item);
  const subtotal = lineItems.reduce((sum,item)=>sum+lineGross(item),0);
  const totalDiscount=lineItems.reduce((sum,item)=>sum+lineDiscount(item),0);
  const taxableTotal=lineItems.reduce((sum,item)=>sum+lineTaxable(item),0);
  const totalGst=lineItems.reduce((sum,item)=>sum+lineGst(item),0);
  const total=lineItems.reduce((sum,item)=>sum+lineFinalAfterDiscount(item),0);
  const paid = Number(paidAmount) || 0;
  const pending = Math.max(0, total - paid);
  const status = pending === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';

  const handleGenerateInvoice = async () => {
    if (generating) return; // Prevent double-click
    if (!selectedCustomer) { toast.error(t('toast.fillRequired')); return; }
    if (lineItems.length === 0) { toast.error(t('toast.addItems')); return; }

    const invoiceNo = `INV-2026-${String(invoices.length + 91).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const customer = customers.find(c => c.id === selectedCustomer);
    const customerName = customer?.name || '';
    const customerPhone = customer?.phone || '';
    for (const li of lineItems) {
      if (li.type === 'product') { const p = products.find(x => x.id === li.itemId); if (!p || lineBaseQty(li) > p.currentStock) { toast.error(`Insufficient stock for ${li.name}`); return; } }
      if (li.type === 'rawMaterial') { const m = rawMaterials.find(x => x.id === li.itemId); if (!m || lineBaseQty(li) > m.currentStock) { toast.error(`Insufficient stock for ${li.name}`); return; } }
    }

    setGenerating(true);

    // Create invoice
    const newInvoice = {
      id: 'INV' + Date.now(),
      invoiceNo,
      date: today,
      customer: customerName,
      items: lineItems.map(li => { const bq=lineBaseQty(li); const q=numericQty(li); const d=numericDiscount(li); const rate=q>0?(bq*li.price/q):li.price; const gross=rate*q; const disc=gross*d/100; const final=gross-disc; const taxable=li.gstPercent>0?final/(1+li.gstPercent/100):final; const gst=final-taxable; return {name:`${li.name} (${li.unit})`,qty:q,price:rate,discount:q>0?disc/q:0,discountPercent:d,unit:li.unit,baseQty:bq,gstPercent:li.gstPercent,gstAmount:gst,taxableAmount:taxable,hsnSac:li.hsnSac}; }),
      customerType: selectedCustomerRecord?.customerType || 'Retail', customerGstin:selectedCustomerRecord?.gstin || '',
      subtotal, discount: totalDiscount, tax: totalGst,
      total,
      paymentMethod: status === 'Pending' ? 'Credit' : paymentMethod,
      paidAmount: paid,
      pendingAmount: pending,
      status: status as 'Paid' | 'Partial' | 'Pending',
      pdfPath: undefined as string | undefined,
    };

    // Generate and save PDF locally via Electron IPC
    let savedPdfPath = '';
    try {
      const base64 = await generateInvoicePDFBase64(newInvoice, customerPhone);
      if (window.desktopAPI) {
        const filename = `Invoice_${invoiceNo}.pdf`;
        const result = await window.desktopAPI.saveInvoicePDF(filename, base64);
        if (result.ok && result.path) {
          savedPdfPath = result.path;
          newInvoice.pdfPath = savedPdfPath;
        } else {
          toast.error(`${t('whatsapp.pdfSaveError')}: ${result.error || ''}`);
        }
      }
    } catch (err) {
      toast.error(t('whatsapp.pdfSaveError'));
      console.error('PDF save error:', err);
    }

    setInvoices(prev => [newInvoice, ...prev]);

    // Deduct product stock
    lineItems.filter(li => li.type === 'product').forEach(li => {
      setProducts(prev => prev.map(p =>
        p.id === li.itemId ? { ...p, currentStock: Math.max(0, p.currentStock - lineBaseQty(li)) } : p
      ));
    });

    // Deduct directly sold raw material stock and preserve sale history
    lineItems.filter(li => li.type === 'rawMaterial').forEach(li => {
      setRawMaterials(prev => prev.map(m => m.id === li.itemId ? {
        ...m,
        currentStock: m.currentStock - lineBaseQty(li),
        saleHistory: [{ id: 'SH' + Date.now() + li.itemId, date: today, quantity: lineBaseQty(li), pricePerUnit: li.price, customer: customerName, invoiceNo }, ...m.saleHistory],
      } : m));
    });

    // Update customer
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomer) {
        return {
          ...c,
          totalPurchases: c.totalPurchases + total,
          pendingAmount: c.pendingAmount + pending,
          lastPurchaseDate: today,
          purchaseHistory: [
            { id: 'CP' + Date.now(), date: today, items: lineItems.map(li => `${li.name} x${numericQty(li)}`).join(', '), amount: total, paymentStatus: status as 'Paid' | 'Partial' | 'Pending' },
            ...c.purchaseHistory,
          ],
          invoices: [
            { id: 'CI' + Date.now(), invoiceNo, date: today, amount: total, status: status as 'Paid' | 'Partial' | 'Pending' },
            ...c.invoices,
          ],
        };
      }
      return c;
    }));

    // Open WhatsApp share modal (not a demo — real sharing)
    setShareInvoice(newInvoice);
    setShareCustomerName(customerName);
    setShareCustomerPhone(customerPhone);
    setSharePdfPath(savedPdfPath);
    setShareWhatsAppOpened(false);
    setShowShareModal(true);

    // Reset form
    setShowForm(false);
    setSelectedCustomer('');
    setLineItems([]);
    setPaidAmount('');
    setPaymentMethod('Cash');
    setGenerating(false);
    toast.success(`${t('toast.invoiceGenerated')} ${invoiceNo}`);
  };

  const handleDownloadPDF = (inv: typeof invoices[0]) => {
    generateInvoicePDF(inv, customers.find(c=>c.name===inv.customer)?.phone || '');
  };

  // Open the WhatsApp share modal for an existing invoice (from history table or view modal)
  const handleShareInvoice = async (inv: typeof invoices[0]) => {
    const customer = customers.find(c => c.name === inv.customer);
    const phone = customer?.phone || '';
    let pdfPath = inv.pdfPath || '';

    // If PDF path is missing (old invoice), regenerate and save it
    if (!pdfPath && window.desktopAPI) {
      try {
        const base64 = await generateInvoicePDFBase64(inv, phone);
        const filename = `Invoice_${inv.invoiceNo}.pdf`;
        const result = await window.desktopAPI.saveInvoicePDF(filename, base64);
        if (result.ok && result.path) {
          pdfPath = result.path;
          // Update the invoice's pdfPath in state so we don't regenerate next time
          setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, pdfPath } : i));
        }
      } catch { /* PDF will be empty; modal will show missing status */ }
    }

    setShareInvoice(inv);
    setShareCustomerName(inv.customer);
    setShareCustomerPhone(phone);
    setSharePdfPath(pdfPath);
    setShareWhatsAppOpened(false);
    setShowShareModal(true);
  };

  const handleOpenWhatsApp = async () => {
    if (!shareInvoice || !window.desktopAPI) return;
    const phoneResult = validateIndianPhone(shareCustomerPhone);
    if (!phoneResult.valid) {
      toast.error(phoneResult.error || t('whatsapp.invalidPhone'));
      return;
    }
    const message = buildWhatsAppMessage(shareInvoice.invoiceNo, shareCustomerName, shareInvoice.total, language);
    const result = await window.desktopAPI.openWhatsApp(phoneResult.international, message);
    if (result.ok) {
      setShareWhatsAppOpened(true);
      toast.success(t('whatsapp.whatsappOpened'));
    } else {
      toast.error(`${t('whatsapp.openError')}: ${result.error || ''}`);
    }
  };

  const handleOpenPDF = async () => {
    if (!sharePdfPath || !window.desktopAPI) return;
    const result = await window.desktopAPI.openInvoicePDF(sharePdfPath);
    if (!result.ok) toast.error(`${t('whatsapp.pdfOpenError')}: ${result.error || ''}`);
  };

  const handleShowInFolder = async () => {
    if (!sharePdfPath || !window.desktopAPI) return;
    const result = await window.desktopAPI.showInvoiceInFolder(sharePdfPath);
    if (!result.ok) toast.error(result.error || '');
  };

  const handleCopyMessage = () => {
    if (!shareInvoice) return;
    const message = buildWhatsAppMessage(shareInvoice.invoiceNo, shareCustomerName, shareInvoice.total, language);
    navigator.clipboard.writeText(message).then(
      () => toast.success(t('whatsapp.copied')),
      () => toast.error('Could not copy to clipboard')
    );
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1 className="page-hd-title">{t('sales.title')}</h1>
          <p className="page-hd-sub">{t('sales.subtitle')}</p>
        </div>
        <div className="page-hd-actions">
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={16} /> {t('sales.newInvoice')}
          </button>
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('sales.invoiceNo')}</th>
                <th>{t('sales.date')}</th>
                <th>{t('sales.customer')}</th>
                <th>{t('sales.items')}</th>
                <th className="td-r">{t('table.total')}</th>
                <th className="td-r">{t('status.paid')}</th>
                <th className="td-r">{t('status.pending')}</th>
                <th className="td-c">{t('sales.method')}</th>
                <th className="td-c">{t('table.status')}</th>
                <th className="td-c">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="td-mono">{inv.invoiceNo}</td>
                  <td>{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                  <td className="td-bold">{inv.customer}</td>
                  <td className="td-dim" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inv.items.map(i => `${i.name} x${i.qty}`).join(', ')}
                  </td>
                  <td className="td-r td-bold">{formatCurrency(inv.total)}</td>
                  <td className="td-r" style={{ color: 'var(--clr-green-700, #15803d)' }}>{formatCurrency(inv.paidAmount)}</td>
                  <td className="td-r">
                    {inv.pendingAmount > 0 ? (
                      <span style={{ color: 'var(--clr-red-700, #b91c1c)', fontWeight: 500 }}>{formatCurrency(inv.pendingAmount)}</span>
                    ) : (
                      <span className="td-dim">₹0</span>
                    )}
                  </td>
                  <td className="td-c"><Badge text={inv.paymentMethod} variant="blue" /></td>
                  <td className="td-c">
                    <Badge text={inv.status} variant={inv.status === 'Paid' ? 'green' : inv.status === 'Partial' ? 'orange' : 'red'} />
                  </td>
                  <td className="td-c">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewInvoice(inv)} className="btn btn-ghost btn-icon btn-sm" title={t('invoice.view')}>
                        <Eye size={15} />
                      </button>
                      <button onClick={() => handleDownloadPDF(inv)} className="btn btn-ghost btn-icon btn-sm" title={t('invoice.download')}>
                        <Download size={15} />
                      </button>
                      <button onClick={() => handleShareInvoice(inv)} className="btn btn-ghost btn-icon btn-sm" title={t('whatsapp.shareOnWhatsApp')} style={{ color: '#25D366' }}>
                        <MessageCircle size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={10} className="tbl-empty">{t('table.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={t('sales.createInvoice')}
        width="max-w-3xl"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button onClick={handleGenerateInvoice} className="btn btn-primary">
              <FileText size={16} /> {t('sales.generateInvoice')}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="field">
            <label className="label">{t('sales.customer')} *</label>
            <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="input">
              <option value="">{t('misc.selectCustomer')}</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.pendingAmount > 0 ? `(${t('status.pending')}: ${formatCurrency(c.pendingAmount)})` : ''}</option>)}
            </select>
            {selectedCustomerRecord && <p className="text-xs mt-1 font-medium" style={{color:'#7A271A'}}>Price mode: {priceKind} · Product, Raw Material and Service prices use the selected customer type. Entered prices already include GST.</p>}
          </div>

          <div className="card" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="card-body">
              <h4 className="section-title" style={{ marginBottom: '0.75rem' }}>{t('sales.addItem')}</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="field" style={{ flex: '1 1 120px' }}>
                  <label className="label">{t('sales.type')}</label>
                  <select value={itemType} onChange={e => { setItemType(e.target.value as any); setItemId(''); }} className="input">
                    <option value="product">{t('sales.product')}</option>
                    <option value="rawMaterial">{t('rawMaterials.title')}</option>
                    <option value="service">{t('services.title')}</option>
                  </select>
                </div>
                <div className="field" style={{ flex: '2 1 200px' }}>
                  <label className="label">{t('sales.item')}</label>
                  <select value={itemId} onChange={e => { const id=e.target.value; setItemId(id); if(id) setTimeout(() => handleAddItem(id), 0); }} className="input">
                    <option value="">{t('action.select')}...</option>
                    {getItemOptions().map(o => <option key={o.id} value={o.id}>{o.name} — ₹{o.price} ({priceKind})</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {lineItems.length > 0 && (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t('sales.item')}</th>
                    <th className="td-r">{t('sales.price')}</th>
                    <th className="td-r">{t('sales.qty')}</th><th>Unit</th>
                    <th className="td-r">Discount %</th><th className="td-r">GST</th>
                    <th className="td-r">{t('sales.lineTotal')}</th>
                    <th className="td-c"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="td-bold">{li.name}</span>
                          <Badge text={li.type === 'product' ? t('sales.product') : li.type === 'rawMaterial' ? t('rawMaterials.title') : t('services.title')} variant={li.type === 'product' ? 'green' : li.type === 'rawMaterial' ? 'orange' : 'blue'} />
                        </div>
                      </td>
                      <td className="td-r">{formatCurrency(li.price)}</td>
                      <td className="td-r"><input type="number" min="0" step="any" inputMode="decimal" className="input billing-control" style={{width:'90px',marginLeft:'auto'}} value={li.qty} placeholder="Qty" onFocus={e=>e.currentTarget.select()} onChange={e => { const v=e.target.value; setLineItems(prev => prev.map((x,i)=>i===idx?{...x,qty:v === '' ? '' : Math.max(0, Number(v))}:x)); }} /></td>
                      <td><select className="input billing-control" value={li.unit} onChange={e=>setLineItems(prev=>prev.map((x,i)=>i===idx?{...x,unit:e.target.value}:x))}>{compatibleUnits(li.baseUnit).map(u=><option key={u}>{u}</option>)}</select></td>
                      <td className="td-r"><input type="number" min="0" max="100" step="any" inputMode="decimal" className="input billing-control" style={{width:'90px',marginLeft:'auto'}} value={li.discount} placeholder="0" onFocus={e=>e.currentTarget.select()} onChange={e => { const v=e.target.value; setLineItems(prev => prev.map((x,i)=>i===idx?{...x,discount:v === '' ? '' : Math.min(100, Math.max(0, Number(v)))}:x)); }} /></td>
                      <td className="td-r">{li.gstPercent}%<div className="text-xs text-gray-400">incl. {formatCurrency(lineGst(li))}</div></td><td className="td-r td-bold">{formatCurrency(lineFinalAfterDiscount(li))}</td>
                      <td className="td-c">
                        <button onClick={() => removeItem(idx)} className="btn btn-icon btn-danger">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lineItems.length > 0 && (
            <div className="grid-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="field">
                  <label className="label">{t('sales.method')}</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input">
                    <option>{t('misc.cash')}</option>
                    <option>{t('misc.upi')}</option>
                    <option>{t('misc.bankTransfer')}</option>
                    <option>{t('misc.credit')}</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">{t('sales.amountPaid')} (₹)</label>
                  <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder={String(total)} className="input" />
                </div>
              </div>

              <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="td-dim">{priceKind} Price Total (GST inclusive)</span>
                  <span className="td-bold">{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="td-dim">{t('sales.discount')}</span>
                    <span style={{ color: 'var(--clr-red-600, #dc2626)' }}>-{formatCurrency(totalDiscount)}</span>
                  </div>
                )}<div style={{display:'flex',justifyContent:'space-between'}}><span className="td-dim">Taxable Value (derived)</span><span>{formatCurrency(taxableTotal)}</span></div><div style={{display:'flex',justifyContent:'space-between'}}><span className="td-dim">GST included</span><span>{formatCurrency(totalGst)}</span></div>
                <div className="divider" style={{ margin: '0.5rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 'bold' }}>
                  <span>{t('sales.grandTotal')}</span>
                  <span style={{ color: 'var(--clr-primary, #166534)' }}>{formatCurrency(total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="td-dim">{t('status.paid')}</span>
                  <span style={{ color: 'var(--clr-green-700, #15803d)' }}>{formatCurrency(paid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="td-dim">{t('status.pending')}</span>
                  <span style={{ color: pending > 0 ? 'var(--clr-red-700, #b91c1c)' : 'inherit', fontWeight: pending > 0 ? 500 : 'normal' }} className={pending === 0 ? 'td-dim' : ''}>
                    {formatCurrency(pending)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span className="td-dim">{t('table.status')}</span>
                  <Badge text={status} variant={status === 'Paid' ? 'green' : status === 'Partial' ? 'orange' : 'red'} />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={viewInvoice ? `${t('invoice.details')}: ${viewInvoice.invoiceNo}` : ''}
        width="max-w-2xl"
        footer={viewInvoice ? (
          <>
            <button onClick={() => setViewInvoice(null)} className="btn btn-ghost">{t('action.close')}</button>
            <button onClick={() => { setViewInvoice(null); handleShareInvoice(viewInvoice); }} className="btn btn-secondary" style={{ color: '#25D366' }}>
              <MessageCircle size={14} /> {t('whatsapp.shareOnWhatsApp')}
            </button>
            <button onClick={() => handleDownloadPDF(viewInvoice)} className="btn btn-primary">
              <Download size={14} /> {t('invoice.download')}
            </button>
          </>
        ) : undefined}
      >
        {viewInvoice && (
          <div className="space-y-4">
            <div className="grid-2">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{t('sales.customer')}</p>
                <p className="text-[13px] font-semibold">{viewInvoice.customer}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{t('sales.date')}</p>
                <p className="text-[13px] font-medium">{new Date(viewInvoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>#</th><th>{t('sales.item')}</th><th className="td-r">{t('sales.qty')}</th><th className="td-r">{t('sales.price')}</th><th className="td-r">{t('sales.lineTotal')}</th></tr></thead>
                <tbody>
                  {viewInvoice.items.map((item, idx) => (
                    <tr key={idx}><td className="td-dim">{idx + 1}</td><td className="td-bold">{item.name}</td><td className="td-r">{item.qty}</td><td className="td-r">{formatCurrency(item.price)}</td><td className="td-r td-bold">{formatCurrency(item.price * item.qty)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '6px' }}>
              <div className="flex justify-between text-[15px] font-bold">
                <span>{t('sales.grandTotal')}</span>
                <span style={{ color: 'var(--clr-primary)' }}>{formatCurrency(viewInvoice.total)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="td-dim">{t('status.paid')}</span>
                <span style={{ color: '#16A34A' }}>{formatCurrency(viewInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="td-dim">{t('table.status')}</span>
                <Badge text={viewInvoice.status} variant={viewInvoice.status === 'Paid' ? 'green' : viewInvoice.status === 'Partial' ? 'orange' : 'red'} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Final approved Invoice Generated Successfully UI */}
      {showShareModal && shareInvoice && (
        <div className="invoice-success-overlay" role="dialog" aria-modal="true" aria-label="Invoice Generated Successfully">
          <div className="invoice-success-modal">
            <button className="invoice-success-close" onClick={() => setShowShareModal(false)} aria-label="Close"><X size={22} /></button>

            <div className="invoice-success-hero">
              <div className="invoice-success-check"><CheckCircle2 size={58} strokeWidth={2.2} /></div>
              <div className="invoice-success-heading">
                <h2>Invoice Generated Successfully!</h2>
                <p>Your invoice has been created and is ready to share with the customer.</p>
                <span className="invoice-ready-pill"><Sparkles size={14}/> Bill is ready</span>
              </div>
              <div className="invoice-confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            </div>

            <div className="invoice-success-details">
              <div className="invoice-detail-grid">
                <div className="invoice-detail-item"><span className="invoice-detail-icon blue"><FileText size={24}/></span><div><small>Invoice Number</small><strong>{shareInvoice.invoiceNo}</strong></div></div>
                <div className="invoice-detail-item"><span className="invoice-detail-icon blue"><UserRound size={24}/></span><div><small>Customer Name</small><strong>{shareCustomerName}</strong></div></div>
                <div className="invoice-detail-item"><span className="invoice-detail-icon violet"><CalendarDays size={24}/></span><div><small>Invoice Date</small><strong>{new Date(shareInvoice.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</strong></div></div>
                <div className="invoice-detail-item"><span className="invoice-detail-icon green"><Phone size={24}/></span><div><small>Phone Number</small><strong>{shareCustomerPhone || 'Not available'}</strong></div></div>
                <div className="invoice-detail-item"><span className="invoice-detail-icon green"><IndianRupee size={25}/></span><div><small>Total Amount</small><strong className="invoice-total-value">{formatCurrency(shareInvoice.total)}</strong></div></div>
                <div className="invoice-detail-item"><span className="invoice-detail-icon red"><FileText size={24}/></span><div><small>PDF Status</small><span className={sharePdfPath ? 'invoice-pdf-pill ok' : 'invoice-pdf-pill missing'}>{sharePdfPath ? 'Saved locally' : 'Not saved'}</span>{sharePdfPath && <em>{sharePdfPath.split(/[\\/]/).slice(-2).join('\\')}</em>}</div></div>
              </div>

              <button className="invoice-mini-preview" onClick={handleOpenPDF} disabled={!sharePdfPath} title="Open generated invoice PDF">
                <div className="mini-logo">🌿 <b>SHIVRAJ MASALA'S<br/><span>& RICE MILL</span></b></div>
                <h5>INVOICE</h5>
                <div className="mini-lines"><span></span><span></span><span></span><span></span></div>
                <div className="mini-table"><i></i><i></i><i></i><i></i></div>
                <b className="mini-thanks">Thank you for your business!</b>
                <strong>चव आहे, तर नातं आहे!</strong>
              </button>
            </div>

            <div className="invoice-message-card">
              <div className="invoice-whatsapp-bubble"><MessageCircle size={31}/></div>
              <div className="invoice-message-main">
                <div className="invoice-message-title">Message for Customer (Preview) <button className="invoice-edit-chip" type="button"><Pencil size={14}/> Edit</button></div>
                <div className="invoice-message-preview">{buildWhatsAppMessage(shareInvoice.invoiceNo, shareCustomerName, shareInvoice.total, language)}</div>
              </div>
              <button onClick={handleCopyMessage} className="invoice-copy-btn"><Copy size={16}/> Copy Message</button>
            </div>

            <div className="invoice-success-actions">
              <button onClick={handleOpenWhatsApp} disabled={!shareCustomerPhone || !validateIndianPhone(shareCustomerPhone).valid} className="invoice-action whatsapp"><MessageCircle size={27}/><span><b>Send on WhatsApp</b><small>Open WhatsApp with message</small></span></button>
              <button onClick={handleOpenPDF} disabled={!sharePdfPath} className="invoice-action pdf"><FileText size={25}/><span><b>Open Invoice PDF</b><small>View generated invoice</small></span></button>
              <button onClick={handleShowInFolder} disabled={!sharePdfPath} className="invoice-action neutral"><FolderOpen size={25}/><span><b>Show in Folder</b><small>Open file location</small></span></button>
              <button onClick={handleCopyMessage} className="invoice-action neutral"><Share2 size={24}/><span><b>More Options</b><small>Print / Email / Copy</small></span><ChevronDown size={16}/></button>
            </div>

            {shareWhatsAppOpened && <div className="invoice-share-note">WhatsApp opened. Please attach the generated invoice PDF and press Send.</div>}
            {!shareCustomerPhone && <div className="invoice-share-note warning">Customer phone number is not available. Add a phone number to use WhatsApp sharing.</div>}

            <div className="invoice-success-footer"><span></span><b>🌿</b><div>Thanks for choosing Shivraj Masala's & Rice Mill<br/><strong>चव आहे, तर नातं आहे!</strong></div><span></span></div>
          </div>
        </div>
      )}
    </div>
  );
}
