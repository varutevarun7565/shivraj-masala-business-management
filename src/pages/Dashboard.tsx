import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  ShoppingCart, Wrench, TrendingDown, Clock, AlertTriangle,
  Plus, Factory, Users, FileText, ArrowRight, Search, Download, Eye,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
const PAGE_SIZE = 10;

export default function Dashboard() {
  const { rawMaterials, invoices, customers, expenses, services, userName } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Invoice search & pagination
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);
  const [viewInvoice, setViewInvoice] = useState<typeof invoices[0] | null>(null);

  const lowStockItems = rawMaterials.filter(m => m.currentStock <= m.lowStockThreshold);
  const today = new Date().toISOString().slice(0, 10);
  const dashboardStats = useMemo(() => {
    const todayInvoices = invoices.filter(i => i.date === today);
    const serviceNames = new Set(services.map(x => x.name));
    return {
      todaySales: todayInvoices.reduce((s,i)=>s+i.total,0),
      todayServiceIncome: todayInvoices.reduce((sum,inv)=>sum+inv.items.filter(it=>Array.from(serviceNames).some(n=>it.name.startsWith(n))).reduce((x,it)=>x+(it.qty*it.price)-(it.discount*it.qty),0),0),
      todayExpenses: expenses.filter(e=>e.date===today).reduce((s,e)=>s+e.amount,0),
      pendingPayments: customers.reduce((s,c)=>s+c.pendingAmount,0),
    };
  }, [invoices, expenses, customers, services, today]);
  const monthlySalesExpenses = useMemo(() => {
    const months: {month:string;sales:number;expenses:number}[] = [];
    for(let offset=5; offset>=0; offset--){ const d=new Date(); d.setMonth(d.getMonth()-offset); const y=d.getFullYear(), m=d.getMonth(); const label=d.toLocaleString('en-IN',{month:'short'}); months.push({month:label,sales:invoices.filter(i=>{const x=new Date(i.date);return x.getFullYear()===y&&x.getMonth()===m}).reduce((a,i)=>a+i.total,0),expenses:expenses.filter(e=>{const x=new Date(e.date);return x.getFullYear()===y&&x.getMonth()===m}).reduce((a,e)=>a+e.amount,0)}); }
    return months;
  }, [invoices, expenses]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t('dashboard.greeting') :
    hour < 17 ? t('misc.goodAfternoon') : t('misc.goodEvening');

  // Filter invoices by search
  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return invoices;
    const q = invoiceSearch.toLowerCase().trim();
    return invoices.filter(inv => {
      if (inv.invoiceNo.toLowerCase().includes(q)) return true;
      if (inv.customer.toLowerCase().includes(q)) return true;
      if (new Date(inv.date).toLocaleDateString('en-IN').includes(q)) return true;
      // Search by customer phone
      const cust = customers.find(c => c.name === inv.customer);
      if (cust && cust.phone.includes(q)) return true;
      return false;
    });
  }, [invoices, invoiceSearch, customers]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const currentPage = Math.min(invoicePage, totalPages);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDownloadPDF = (inv: typeof invoices[0]) => {
    generateInvoicePDF(inv, customers.find(c => c.name === inv.customer)?.phone || '');
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-hd">
        <div className="page-hd-left">
          <h1 className="page-hd-title">{greeting}, {userName.split(' ')[0]}</h1>
          <p className="page-hd-sub">
            {t('dashboard.overview')} &middot;{' '}
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="page-hd-actions">
          <button onClick={() => navigate('/sales')} className="btn btn-primary btn-sm">
            <Plus size={14} /> {t('dashboard.newSale')}
          </button>
          <button onClick={() => navigate('/raw-materials')} className="btn btn-secondary btn-sm">
            <ShoppingCart size={13} /> {t('dashboard.purchase')}
          </button>
          <button onClick={() => navigate('/production')} className="btn btn-secondary btn-sm">
            <Factory size={13} /> {t('dashboard.production')}
          </button>
          <button onClick={() => navigate('/customers')} className="btn btn-secondary btn-sm">
            <Users size={13} /> {t('dashboard.customer')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <StatCard
          label={t('dashboard.todaySales')}
          value={fmt(dashboardStats.todaySales)}
          icon={ShoppingCart}
          color="#166534"
          iconBg="#DCFCE7"
          trend="+12.4% vs yesterday"
          trendUp
        />
        <StatCard
          label={t('dashboard.serviceIncome')}
          value={fmt(dashboardStats.todayServiceIncome)}
          icon={Wrench}
          color="#1D4ED8"
          iconBg="#DBEAFE"
        />
        <StatCard
          label={t('dashboard.todayExpenses')}
          value={fmt(dashboardStats.todayExpenses)}
          icon={TrendingDown}
          color="#DC2626"
          iconBg="#FEE2E2"
        />
        <StatCard
          label={t('dashboard.pendingPayments')}
          value={fmt(dashboardStats.pendingPayments)}
          icon={Clock}
          color="#B45309"
          iconBg="#FEF3C7"
        />
        <StatCard
          label={t('dashboard.lowStock')}
          value={`${lowStockItems.length} ${t('dashboard.items')}`}
          icon={AlertTriangle}
          color="#DC2626"
          iconBg="#FEE2E2"
        />
        <StatCard
          label={t('dashboard.invoices')}
          value={String(invoices.length)}
          icon={FileText}
          color="#6B7280"
          iconBg="#F3F4F6"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* Sales vs Expenses chart */}
        <div className="card card-body">
          <p className="card-title mb-4">{t('dashboard.monthlySalesExpenses')}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlySalesExpenses} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `₹${v / 1000}k`}
                width={48}
              />
              <Tooltip
                formatter={(value) => fmt(Number(value || 0))}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="sales" name={t('misc.sales')} fill="#166534" radius={[3,3,0,0]} maxBarSize={24} />
              <Bar dataKey="expenses" name={t('expenses.title')} fill="#B45309" radius={[3,3,0,0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock alerts */}
        <div className="card card-body">
          <div className="flex items-center justify-between mb-3">
            <p className="card-title">{t('dashboard.lowStockAlerts')}</p>
            {lowStockItems.length > 0 && (
              <button
                onClick={() => navigate('/raw-materials')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '11px' }}
              >
                View all <ArrowRight size={11} />
              </button>
            )}
          </div>
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div style={{ color: '#D1D5DB' }}>
                <AlertTriangle size={28} />
              </div>
              <p className="text-[12px]" style={{ color: '#9CA3AF' }}>{t('misc.allStocked')}</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '220px' }}>
              {lowStockItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md"
                  style={{ background: '#FEF2F2', border: '1px solid #FEE2E2' }}
                >
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium truncate" style={{ color: '#111827' }}>
                      {item.name}
                    </p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                      Min: {item.lowStockThreshold} {item.unit}
                    </p>
                  </div>
                  <span className="badge badge-red badge-sm ml-2 shrink-0">
                    {item.currentStock} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Invoices Section */}
      <div className="card">
        <div className="card-header">
          <p className="card-title">{t('invoice.allInvoices')}</p>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="search-box relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={e => { setInvoiceSearch(e.target.value); setInvoicePage(1); }}
                placeholder={t('invoice.searchPlaceholder')}
                className="input pl-9"
                style={{ minWidth: '260px' }}
              />
            </div>
            <span className="text-[12px]" style={{ color: '#9CA3AF' }}>
              {filteredInvoices.length} {t('dashboard.invoices').toLowerCase()}
            </span>
          </div>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('sales.invoiceNo')}</th>
                <th>{t('sales.date')}</th>
                <th>{t('sales.customer')}</th>
                <th className="td-r">{t('table.amount')}</th>
                <th className="td-r">{t('status.paid')}</th>
                <th className="td-r">{t('status.pending')}</th>
                <th className="td-c">{t('table.status')}</th>
                <th className="td-c">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="td-mono">{inv.invoiceNo}</td>
                  <td className="td-dim">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                  <td className="td-bold">{inv.customer}</td>
                  <td className="td-r td-num">{fmt(inv.total)}</td>
                  <td className="td-r td-num" style={{ color: '#16A34A' }}>{fmt(inv.paidAmount)}</td>
                  <td className="td-r td-num">
                    {inv.pendingAmount > 0
                      ? <span style={{ color: '#DC2626' }}>{fmt(inv.pendingAmount)}</span>
                      : <span style={{ color: '#9CA3AF' }}>—</span>
                    }
                  </td>
                  <td className="td-c">
                    <Badge
                      text={inv.status}
                      variant={inv.status === 'Paid' ? 'green' : inv.status === 'Partial' ? 'orange' : 'red'}
                    />
                  </td>
                  <td className="td-c">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setViewInvoice(inv)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title={t('invoice.view')}
                        aria-label={t('invoice.view')}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(inv)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title={t('invoice.download')}
                        aria-label={t('invoice.download')}
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedInvoices.length === 0 && (
                <tr className="tbl-empty"><td colSpan={8}>{t('table.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--clr-border)' }}>
            <span className="text-[12px]" style={{ color: '#9CA3AF' }}>
              {t('misc.showing')} {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredInvoices.length)} {t('misc.of')} {filteredInvoices.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="btn btn-ghost btn-icon btn-sm"
                aria-label={t('misc.previous')}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                    <button
                      onClick={() => setInvoicePage(p)}
                      className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ minWidth: '32px', padding: '4px 8px' }}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setInvoicePage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="btn btn-ghost btn-icon btn-sm"
                aria-label={t('misc.next')}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title={viewInvoice ? `${t('invoice.details')}: ${viewInvoice.invoiceNo}` : ''}
        width="max-w-2xl"
        footer={
          viewInvoice ? (
            <>
              <button onClick={() => setViewInvoice(null)} className="btn btn-ghost">{t('action.close')}</button>
              <button onClick={() => { handleDownloadPDF(viewInvoice); }} className="btn btn-primary">
                <Download size={14} /> {t('invoice.download')}
              </button>
            </>
          ) : undefined
        }
      >
        {viewInvoice && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid-2">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{t('sales.customer')}</p>
                <p className="text-[13px] font-semibold" style={{ color: '#111827' }}>{viewInvoice.customer}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{t('sales.date')}</p>
                <p className="text-[13px] font-medium">{new Date(viewInvoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('sales.item')}</th>
                    <th className="td-r">{t('sales.qty')}</th>
                    <th className="td-r">{t('sales.price')}</th>
                    <th className="td-r">{t('sales.discount')}</th>
                    <th className="td-r">{t('sales.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="td-dim">{idx + 1}</td>
                      <td className="td-bold">{item.name}</td>
                      <td className="td-r">{item.qty}</td>
                      <td className="td-r">{fmt(item.price)}</td>
                      <td className="td-r td-dim">{item.discount > 0 ? fmt(item.discount * item.qty) : '—'}</td>
                      <td className="td-r td-bold">{fmt((item.price * item.qty) - (item.discount * item.qty))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '6px' }}>
              <div className="flex justify-between mb-1">
                <span className="td-dim">{t('sales.subtotal')}</span>
                <span className="td-bold">{fmt(viewInvoice.subtotal)}</span>
              </div>
              {viewInvoice.discount > 0 && (
                <div className="flex justify-between mb-1">
                  <span className="td-dim">{t('sales.discount')}</span>
                  <span style={{ color: '#DC2626' }}>-{fmt(viewInvoice.discount)}</span>
                </div>
              )}
              <div className="divider my-2"></div>
              <div className="flex justify-between text-[15px] font-bold">
                <span>{t('sales.grandTotal')}</span>
                <span style={{ color: 'var(--clr-primary)' }}>{fmt(viewInvoice.total)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="td-dim">{t('sales.amountPaid')}</span>
                <span style={{ color: '#16A34A' }}>{fmt(viewInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="td-dim">{t('status.pending')}</span>
                <span style={{ color: viewInvoice.pendingAmount > 0 ? '#DC2626' : '#9CA3AF' }}>
                  {fmt(viewInvoice.pendingAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="td-dim">{t('sales.method')}</span>
                <Badge text={viewInvoice.paymentMethod} variant="blue" />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="td-dim">{t('table.status')}</span>
                <Badge text={viewInvoice.status} variant={viewInvoice.status === 'Paid' ? 'green' : viewInvoice.status === 'Partial' ? 'orange' : 'red'} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
