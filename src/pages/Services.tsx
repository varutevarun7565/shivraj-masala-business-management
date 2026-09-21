import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function Services() {
  const { services, setServices } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [wholesalePrice,setWholesalePrice]=useState('');
  const [gstPercent,setGstPercent]=useState('0');
  const [unit, setUnit] = useState('per kg');

  const resetForm = () => { setName(''); setPrice(''); setWholesalePrice(''); setGstPercent('0'); setUnit('per kg'); setEditingId(null); };

  const openEdit = (id: string) => {
    const s = services.find(s => s.id === id);
    if (!s) return;
    setName(s.name);
    setPrice(String(s.retailPrice ?? s.price)); setWholesalePrice(String(s.wholesalePrice ?? s.price)); setGstPercent(String(s.gstPercent ?? 0));
    setUnit(s.unit);
    setEditingId(id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name || !price) { toast.error('Please fill all fields'); return; }

    if (editingId) {
      setServices(prev => prev.map(s => s.id === editingId ? { ...s, name, price: Number(price), retailPrice:Number(price), wholesalePrice:Number(wholesalePrice||price), gstPercent:Number(gstPercent)||0, unit } : s));
      toast.success(`"${name}" updated`);
    } else {
      const id = 'S' + String(services.length + 1).padStart(3, '0');
      setServices(prev => [...prev, { id, name, price: Number(price), retailPrice:Number(price), wholesalePrice:Number(wholesalePrice||price), gstPercent:Number(gstPercent)||0, unit }]);
      toast.success(`"${name}" added to services`);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const s = services.find(s => s.id === id);
    setServices(prev => prev.filter(s => s.id !== id));
    toast.success(`"${s?.name}" removed`);
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1 className="page-hd-title">Services</h1>
          <p className="page-hd-sub">Manage grinding, packing and other services</p>
        </div>
        <div className="page-hd-actions">
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
            + Add Service
          </button>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Service Name</th>
                <th className="td-r">Price</th>
                <th>Unit</th>
                <th className="td-c">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td className="td-mono td-dim">{s.id}</td>
                  <td className="td-bold">{s.name}</td>
                  <td className="td-r" style={{ color: '#166534' }}>{formatCurrency(s.price)}</td>
                  <td className="td-dim">{s.unit}</td>
                  <td className="td-c">
                    <button onClick={() => openEdit(s.id)} className="btn-icon btn-ghost btn-sm" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="btn-icon btn-ghost btn-sm" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={5} className="tbl-empty">No services added yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Service' : 'Add Service'}>
        <div className="modal-body">
          <div className="field">
            <label className="label">Service Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Roasting" className="input" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">Retail Selling Price incl. GST (₹)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 40" className="input" />
            </div><div className="field"><label className="label">Wholesale Selling Price incl. GST (₹)</label><input type="number" value={wholesalePrice} onChange={e=>setWholesalePrice(e.target.value)} className="input"/></div><div className="field"><label className="label">GST %</label><input type="number" min="0" max="100" value={gstPercent} onChange={e=>setGstPercent(e.target.value)} className="input"/>
            </div>
            <div className="field">
              <label className="label">Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className="input">
                <option>per kg</option><option>per g</option><option>per quintal</option><option>per ton</option><option>per litre</option><option>per ml</option><option>per piece</option><option>per packet</option><option>per box</option><option>per bag</option><option>per dozen</option><option>per batch</option><option>per hour</option><option>per minute</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary">
            {editingId ? 'Update Service' : 'Save Service'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
