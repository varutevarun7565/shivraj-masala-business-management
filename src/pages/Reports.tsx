import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { BarChart3, IndianRupee, Package, Users, Download, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { generateBusinessReportPDF, getDateRange, isDateInRange } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

const PIE_COLORS = ['#166534','#B45309','#1D4ED8','#DC2626'];

export default function Reports() {
  const { rawMaterials, customers, expenses, invoices, products } = useApp();
  const monthlySalesExpenses = useMemo(() => {
    const rows: {month:string;sales:number;expenses:number}[]=[];
    for(let offset=5;offset>=0;offset--){const d=new Date();d.setMonth(d.getMonth()-offset);const y=d.getFullYear(),mo=d.getMonth();rows.push({month:d.toLocaleString('en-IN',{month:'short'}),sales:invoices.filter(i=>{const x=new Date(i.date);return x.getFullYear()===y&&x.getMonth()===mo}).reduce((a,i)=>a+i.total,0),expenses:expenses.filter(e=>{const x=new Date(e.date);return x.getFullYear()===y&&x.getMonth()===mo}).reduce((a,e)=>a+e.amount,0)});} return rows;
  }, [invoices, expenses]);
  const paymentMethodBreakdown = useMemo(() => Object.entries(invoices.reduce<Record<string,number>>((acc,i)=>{acc[i.paymentMethod]=(acc[i.paymentMethod]||0)+i.total;return acc;},{})).map(([method,amount])=>({method,amount})), [invoices]);

  const { t } = useTranslation();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [reportPeriod, setReportPeriod] = useState('month');

  const totalSales = invoices.reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPending = invoices.reduce((s, i) => s + i.pendingAmount, 0);
  const inventoryValue = rawMaterials.reduce((s, m) => s + (m.currentStock * m.pricePerUnit), 0);
  const lowStockCount = rawMaterials.filter(m => m.currentStock <= m.lowStockThreshold).length;

  const topCustomers = [...customers].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 5);

  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  const expenseCategoryData = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Generate PDF report
  const handleGenerateReport = () => {
    const { start, end, label } = getDateRange(reportPeriod);
    const periodLabel =
      reportPeriod === 'today' ? t('reports.daily') :
      reportPeriod === 'week' ? t('reports.weekly') :
      reportPeriod === 'month' ? t('reports.monthly') :
      reportPeriod === 'quarter' ? t('reports.quarterly') :
      t('reports.yearly');

    if (reportType === 'sales') {
      const filtered = invoices.filter(i => isDateInRange(i.date, start, end));
      const totalSales = filtered.reduce((s, i) => s + i.total, 0);
      const totalPaid = filtered.reduce((s, i) => s + i.paidAmount, 0);
      const totalPending = filtered.reduce((s, i) => s + i.pendingAmount, 0);
      generateBusinessReportPDF({
        reportType: t('reports.salesReport'),
        periodLabel,
        dateRangeLabel: label,
        headers: ['#', 'Invoice #', 'Date', 'Customer', 'Total', 'Paid', 'Pending', 'Status'],
        rows: filtered.map((i, idx) => [idx + 1, i.invoiceNo, new Date(i.date).toLocaleDateString('en-IN'), i.customer, i.total, i.paidAmount, i.pendingAmount, i.status]),
        totals: [
          { label: 'Total Sales', value: formatCurrency(totalSales) },
          { label: 'Total Paid', value: formatCurrency(totalPaid) },
          { label: 'Total Pending', value: formatCurrency(totalPending) },
        ],
        summaryCards: [
          { label: 'Invoices', value: String(filtered.length) },
          { label: 'Total Sales', value: formatCurrency(totalSales) },
          { label: 'Paid', value: formatCurrency(totalPaid) },
          { label: 'Pending', value: formatCurrency(totalPending) },
        ],
      });
    } else if (reportType === 'expenses') {
      const filtered = expenses.filter(e => isDateInRange(e.date, start, end));
      const total = filtered.reduce((s, e) => s + e.amount, 0);
      generateBusinessReportPDF({
        reportType: t('reports.expenseReport'),
        periodLabel,
        dateRangeLabel: label,
        headers: ['#', 'Date', 'Category', 'Description', 'Amount'],
        rows: filtered.map((e, idx) => [idx + 1, new Date(e.date).toLocaleDateString('en-IN'), e.category, e.description, e.amount]),
        totals: [{ label: 'Total Expenses', value: formatCurrency(total) }],
      });
    } else if (reportType === 'outstanding') {
      const withPending = customers.filter(c => c.pendingAmount > 0);
      generateBusinessReportPDF({
        reportType: t('reports.outstandingReport'),
        periodLabel,
        dateRangeLabel: label,
        headers: ['#', 'Customer', 'Phone', 'Total Purchases', 'Outstanding', 'Last Purchase'],
        rows: withPending.map((c, idx) => [idx + 1, c.name, c.phone || '-', c.totalPurchases, c.pendingAmount, new Date(c.lastPurchaseDate).toLocaleDateString('en-IN')]),
        totals: [{ label: 'Total Outstanding', value: formatCurrency(withPending.reduce((s, c) => s + c.pendingAmount, 0)) }],
      });
    } else if (reportType === 'products') {
      generateBusinessReportPDF({
        reportType: t('reports.productsReport'),
        periodLabel,
        dateRangeLabel: label,
        headers: ['#', 'Product', 'Category', 'Package', 'Price', 'Stock', 'Status'],
        rows: products.map((p, idx) => [idx + 1, p.name, p.category, p.packageSize, p.sellingPrice, p.currentStock, p.publishStatus ? 'Published' : 'Draft']),
        summaryCards: [
          { label: 'Total Products', value: String(products.length) },
          { label: 'Published', value: String(products.filter(p => p.publishStatus).length) },
        ],
      });
    } else if (reportType === 'materials') {
      generateBusinessReportPDF({
        reportType: t('reports.materialsReport'),
        periodLabel,
        dateRangeLabel: label,
        headers: ['#', 'Material', 'Category', 'Stock', 'Unit', 'Threshold', 'Price/Unit', 'Status'],
        rows: rawMaterials.map((m, idx) => [idx + 1, m.name, m.category, m.currentStock, m.unit, m.lowStockThreshold, m.pricePerUnit, m.currentStock <= m.lowStockThreshold ? 'Low Stock' : 'OK']),
        summaryCards: [
          { label: 'Total Materials', value: String(rawMaterials.length) },
          { label: 'Low Stock', value: String(lowStockCount) },
          { label: 'Inventory Value', value: formatCurrency(inventoryValue) },
        ],
      });
    } else if (reportType === 'gst') {
      const filtered=invoices.filter(i=>isDateInRange(i.date,start,end));
      const outputGst=filtered.reduce((s,i)=>s+(i.tax||0),0);
      const taxable=filtered.reduce((s,i)=>s+i.items.reduce((x,it)=>x+(it.taxableAmount??Math.max(0,(it.qty*it.price)-(it.qty*it.discount))),0),0);
      const purchases=rawMaterials.flatMap(m=>m.purchaseHistory.filter(p=>isDateInRange(p.date,start,end)).map(p=>({...p,material:m.name})));
      const inputGst=purchases.reduce((s,p)=>s+(p.gstAmount||0),0);
      generateBusinessReportPDF({reportType:'GST / CA Summary',periodLabel,dateRangeLabel:label,headers:['Invoice','Date','Customer','Type','GSTIN','Taxable','Output GST','Total'],rows:filtered.map(i=>[i.invoiceNo,new Date(i.date).toLocaleDateString('en-IN'),i.customer,i.customerType||'Retail',i.customerGstin||'-',i.items.reduce((s,it)=>s+(it.taxableAmount??0),0),i.tax||0,i.total]),totals:[{label:'Taxable Sales',value:formatCurrency(taxable)},{label:'Output GST (Sales)',value:formatCurrency(outputGst)},{label:'Input GST (Purchases)',value:formatCurrency(inputGst)},{label:'Indicative Net GST',value:formatCurrency(outputGst-inputGst)}],summaryCards:[{label:'Sales GST',value:formatCurrency(outputGst)},{label:'Purchase GST',value:formatCurrency(inputGst)}]});
    } else if (reportType === 'summary') {
      const netProfit = totalSales - totalExpenses;
      generateBusinessReportPDF({
        reportType: t('reports.summaryReport'),
        periodLabel,
        dateRangeLabel: label,
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Sales', totalSales],
          ['Total Expenses', totalExpenses],
          ['Net Profit', netProfit],
          ['Pending Payments', totalPending],
          ['Inventory Value', inventoryValue],
          ['Total Customers', customers.length],
          ['Total Products', products.length],
          ['Total Raw Materials', rawMaterials.length],
          ['Low Stock Items', lowStockCount],
        ],
        summaryCards: [
          { label: 'Sales', value: formatCurrency(totalSales) },
          { label: 'Expenses', value: formatCurrency(totalExpenses) },
          { label: 'Profit', value: formatCurrency(netProfit) },
          { label: 'Pending', value: formatCurrency(totalPending) },
        ],
      });
    }

    setShowReportModal(false);
    toast.success(t('toast.exportPdf'));
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1 className="page-hd-title">{t('reports.title')}</h1>
          <p className="page-hd-sub">{t('reports.subtitle')}</p>
        </div>
        <div className="page-hd-actions">
          <button onClick={() => setShowReportModal(true)} className="btn btn-primary">
            <Download size={16} /> {t('reports.downloadReport')}
          </button>
        </div>
      </div>

      <div className="stats-grid mb-6">
        <StatCard label={t('reports.totalSales')} value={formatCurrency(totalSales)} icon={IndianRupee} color="#166534" iconBg="#dcfce7" />
        <StatCard label={t('reports.totalExpenses')} value={formatCurrency(totalExpenses)} icon={BarChart3} color="#DC2626" iconBg="#FEE2E2" />
        <StatCard label={t('reports.pendingPayments')} value={formatCurrency(totalPending)} icon={Users} color="#B45309" iconBg="#FEF3C7" />
        <StatCard label={t('reports.inventoryValue')} value={formatCurrency(inventoryValue)} icon={Package} color="#1D4ED8" iconBg="#dbeafe" />
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('reports.monthlySales')}</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlySalesExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                <Legend />
                <Bar dataKey="sales" name={t('misc.sales')} fill="#166534" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name={t('expenses.title')} fill="#B45309" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('reports.paymentMethods')}</h3>
          </div>
          <div className="card-body flex items-center">
            <ResponsiveContainer width="55%" height={260}>
              <PieChart>
                <Pie
                  data={paymentMethodBreakdown}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {paymentMethodBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-[45%] space-y-3">
              {paymentMethodBreakdown.map((pm, idx) => (
                <div key={pm.method} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{pm.method}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(pm.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('reports.topCustomers')}</h3>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('customers.name')}</th>
                  <th className="td-r">{t('customers.totalPurchases')}</th>
                  <th className="td-r">{t('status.pending')}</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="td-dim">{idx + 1}</td>
                    <td className="td-bold">{c.name}</td>
                    <td className="td-r" style={{ color: '#166534' }}>{formatCurrency(c.totalPurchases)}</td>
                    <td className="td-r">
                      {c.pendingAmount > 0 ? (
                        <span style={{ color: '#DC2626' }}>{formatCurrency(c.pendingAmount)}</span>
                      ) : (
                        <span className="td-dim">₹0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('reports.expenseByCategory')}</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={expenseCategoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000)}k`} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                <Bar dataKey="value" name="Amount" fill="#B45309" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t('reports.inventorySummary')}</h3>
        </div>
        <div className="card-body">
          <div className="grid-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">{t('rawMaterials.totalMaterials')}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{rawMaterials.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">{t('reports.inventoryValue')}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(inventoryValue)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">{t('dashboard.lowStock')}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{lowStockCount}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium">{t('rawMaterials.totalMaterials')} (kg)</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {rawMaterials.reduce((s, m) => s + m.currentStock, 0)} kg
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Download Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={t('reports.downloadReport')}
        subtitle={t('reports.subtitle')}
        footer={
          <>
            <button onClick={() => setShowReportModal(false)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button onClick={handleGenerateReport} className="btn btn-primary">
              <FileText size={14} /> {t('reports.generatePdf')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="field">
            <label className="label">{t('reports.reportType')}</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="input select">
              <option value="sales">{t('reports.salesReport')}</option>
              <option value="expenses">{t('reports.expenseReport')}</option>
              <option value="outstanding">{t('reports.outstandingReport')}</option>
              <option value="products">{t('reports.productsReport')}</option>
              <option value="materials">{t('reports.materialsReport')}</option>
              <option value="summary">{t('reports.summaryReport')}</option><option value="gst">GST / CA Summary</option>
            </select>
          </div>
          <div className="field">
            <label className="label">{t('reports.period')}</label>
            <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} className="input select">
              <option value="today">{t('reports.daily')}</option>
              <option value="week">{t('reports.weekly')}</option>
              <option value="month">{t('reports.monthly')}</option>
              <option value="quarter">{t('reports.quarterly')}</option>
              <option value="year">{t('reports.yearly')}</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
