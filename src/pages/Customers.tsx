import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer } from '../data/mockData';

const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function Customers() {
  const { customers, setCustomers } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');

  // Add form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCustomerType, setNewCustomerType] = useState<'Retail'|'Wholesale'>('Retail');
  const [newGstin, setNewGstin] = useState('');

  const handleAdd = () => {
    if (!newName) { toast.error('Please enter customer name'); return; }
    const id = 'C' + String(customers.length + 1).padStart(3, '0');
    const newCustomer: Customer = {
      id,
      name: newName,
      phone: newPhone,
      address: newAddress,
      customerType: newCustomerType,
      gstin: newGstin.trim().toUpperCase(),
      totalPurchases: 0,
      pendingAmount: 0,
      lastPurchaseDate: '-',
      purchaseHistory: [],
      invoices: [],
    };
    setCustomers(prev => [...prev, newCustomer]);
    setShowModal(false);
    setNewName(''); setNewPhone(''); setNewAddress(''); setNewCustomerType('Retail'); setNewGstin('');
    toast.success(`"${newName}" added to customers`);
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  // ── Detail View ──
  if (selectedCustomer) {
    const live = customers.find(c => c.id === selectedCustomer.id) || selectedCustomer;
    return (
      <div>
        <button onClick={() => setSelectedCustomer(null)} className="btn btn-ghost" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Customers
        </button>

        {/* Customer Header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '4px' }}>{live.name}</h2>
              <p className="td-dim">{live.phone || 'No phone'} · {live.address || 'No address'}</p><p className="text-xs mt-1"><b>{live.customerType || 'Retail'}</b>{live.gstin ? ` · GSTIN: ${live.gstin}` : ''}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="td-dim" style={{ marginBottom: '4px' }}>Total Purchases</p>
              <p className="td-bold" style={{ fontSize: '24px', color: 'var(--clr-primary)' }}>{formatCurrency(live.totalPurchases)}</p>
              {live.pendingAmount > 0 && (
                <p className="td-bold" style={{ color: '#DC2626', marginTop: '4px' }}>Pending: {formatCurrency(live.pendingAmount)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Purchase History</h3>
          </div>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Items</th>
                  <th className="td-r">Amount</th>
                  <th className="td-c">Payment</th>
                </tr>
              </thead>
              <tbody>
                {live.purchaseHistory.map(ph => (
                  <tr key={ph.id}>
                    <td>{new Date(ph.date).toLocaleDateString('en-IN')}</td>
                    <td className="td-dim">{ph.items}</td>
                    <td className="td-r td-bold">{formatCurrency(ph.amount)}</td>
                    <td className="td-c">
                      <Badge text={ph.paymentStatus} variant={ph.paymentStatus === 'Paid' ? 'green' : ph.paymentStatus === 'Partial' ? 'orange' : 'red'} />
                    </td>
                  </tr>
                ))}
                {live.purchaseHistory.length === 0 && (
                  <tr className="tbl-empty"><td colSpan={4}>No purchase history yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Invoices</h3>
          </div>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th className="td-r">Amount</th>
                  <th className="td-c">Status</th>
                </tr>
              </thead>
              <tbody>
                {live.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="td-mono td-dim">{inv.invoiceNo}</td>
                    <td>{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                    <td className="td-r td-bold">{formatCurrency(inv.amount)}</td>
                    <td className="td-c">
                      <Badge text={inv.status} variant={inv.status === 'Paid' ? 'green' : inv.status === 'Partial' ? 'orange' : 'red'} />
                    </td>
                  </tr>
                ))}
                {live.invoices.length === 0 && (
                  <tr className="tbl-empty"><td colSpan={4}>No invoices yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div>
      <div className="page-hd">
        <div>
          <h1 className="page-hd-title">Customers</h1>
          <p className="page-hd-sub">Manage customer accounts and outstanding payments</p>
        </div>
        <div className="page-hd-actions">
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
          />
        </div>
        <div style={{ color: 'var(--clr-text-2)', fontSize: '13px' }}>
          {filtered.length} customers
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Address</th>
                <th className="td-r">Total Purchases</th>
                <th className="td-r">Outstanding</th>
                <th>Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="tbl-row-clickable">
                  <td>
                    <div className="td-bold">{c.name}</div>
                    <div className="td-dim">{c.phone || '-'}</div>
                  </td>
                  <td>{c.address || '-'}</td>
                  <td className="td-r td-bold" style={{ color: 'var(--clr-primary)' }}>{formatCurrency(c.totalPurchases)}</td>
                  <td className="td-r">
                    {c.pendingAmount > 0 ? (
                      <span className="td-bold" style={{ color: '#DC2626' }}>{formatCurrency(c.pendingAmount)}</span>
                    ) : (
                      <span className="td-dim">—</span>
                    )}
                  </td>
                  <td>{c.lastPurchaseDate === '-' ? '-' : new Date(c.lastPurchaseDate).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr className="tbl-empty"><td colSpan={5}>No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Add Customer"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleAdd} className="btn btn-primary">Save Customer</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label className="label">Customer Name *</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Rahul Sharma" className="input" />
          </div>
          <div className="field">
            <label className="label">Phone Number</label>
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="e.g. 9876543210" className="input" />
          </div>
          <div className="field">
            <label className="label">Address</label>
            <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="e.g. Shop 5, Main Market, Sangli" className="input" />
          </div>
          <div className="grid-2"><div className="field"><label className="label">Customer Type *</label><select value={newCustomerType} onChange={e=>setNewCustomerType(e.target.value as 'Retail'|'Wholesale')} className="input"><option>Retail</option><option>Wholesale</option></select></div><div className="field"><label className="label">GSTIN (optional)</label><input value={newGstin} onChange={e=>setNewGstin(e.target.value)} placeholder="e.g. 27ABCDE1234F1Z5" className="input" /></div></div>
        </div>
      </Modal>
    </div>
  );
}
