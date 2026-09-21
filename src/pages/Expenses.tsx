import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { Receipt, TrendingDown, Filter, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseCategories } from '../data/mockData';
import { generateExpenseReportPDF, getDateRange, isDateInRange } from '../utils/pdfGenerator';

const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function Expenses() {
  const { expenses, setExpenses } = useApp();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  // Form state
  const [category, setCategory] = useState(expenseCategories[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Report state
  const [reportPeriod, setReportPeriod] = useState('month');

  const handleAdd = () => {
    if (!amount || !description) { toast.error(t('toast.fillRequired')); return; }
    const id = 'E' + String(expenses.length + 1).padStart(3, '0');
    setExpenses(prev => [{
      id,
      category,
      amount: Number(amount),
      description,
      date,
    }, ...prev]);
    setShowModal(false);
    setAmount(''); setDescription('');
    toast.success(t('toast.expenseRecorded'));
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 2);

  const filtered = filterCategory === 'All' ? expenses : expenses.filter(e => e.category === filterCategory);

  // Report download
  const handleDownloadReport = () => {
    const { start, end, label } = getDateRange(reportPeriod);
    const periodLabel =
      reportPeriod === 'today' ? t('expense.today') :
      reportPeriod === 'week' ? t('expense.thisWeek') :
      reportPeriod === 'month' ? t('expense.thisMonth') :
      t('expense.thisYear');

    const filteredExpenses = expenses.filter(e => isDateInRange(e.date, start, end));

    generateExpenseReportPDF(filteredExpenses, periodLabel, label);
    setShowReportModal(false);
    toast.success(t('toast.exportPdf'));
  };

  // Preview count for report
  const reportPreview = useMemo(() => {
    const { start, end } = getDateRange(reportPeriod);
    const filteredExpenses = expenses.filter(e => isDateInRange(e.date, start, end));
    return {
      count: filteredExpenses.length,
      total: filteredExpenses.reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses, reportPeriod]);

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1 className="page-hd-title">{t('expenses.title')}</h1>
          <p className="page-hd-sub">{t('expenses.subtitle')}</p>
        </div>
        <div className="page-hd-actions">
          <button onClick={() => setShowReportModal(true)} className="btn btn-secondary">
            <Download size={16} /> {t('expense.downloadReport')}
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + {t('expenses.addExpense')}
          </button>
        </div>
      </div>

      <div className="stats-grid mb-6">
        <StatCard label={t('expenses.totalExpenses')} value={formatCurrency(totalExpenses)} icon={TrendingDown} color="#DC2626" iconBg="#FEE2E2" />
        {topCategories.map(([cat, total]) => (
          <StatCard key={cat} label={cat} value={formatCurrency(total)} icon={Receipt} color="#B45309" iconBg="#FEF3C7" />
        ))}
      </div>

      <div className="toolbar">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input"
          >
            <option value="All">{t('expenses.allCategories')}</option>
            {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-sm text-gray-400">{filtered.length} {t('expenses.entries')}</span>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('table.id')}</th>
                <th>{t('table.date')}</th>
                <th>{t('rawMaterials.category')}</th>
                <th>{t('expenses.description')}</th>
                <th className="td-r">{t('expenses.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td className="td-mono">{e.id}</td>
                  <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <span className="badge badge-gray">
                      {e.category}
                    </span>
                  </td>
                  <td className="td-dim">{e.description}</td>
                  <td className="td-r" style={{ color: '#DC2626' }}>{formatCurrency(e.amount)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="tbl-empty">{t('table.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('expenses.addExpense')}>
        <div className="modal-body">
          <div className="field">
            <label className="label">{t('rawMaterials.category')}</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input">
              {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">{t('expenses.amount')} (₹)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" className="input" />
            </div>
            <div className="field">
              <label className="label">{t('table.date')}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
            </div>
          </div>
          <div className="field">
            <label className="label">{t('expenses.description')}</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Monthly electricity bill" className="input" />
          </div>
        </div>
        <div className="modal-foot">
          <button onClick={() => setShowModal(false)} className="btn btn-ghost">{t('action.cancel')}</button>
          <button onClick={handleAdd} className="btn btn-primary">{t('action.save')}</button>
        </div>
      </Modal>

      {/* Expense Report Download Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={t('expense.reportConfig')}
        subtitle={t('expenses.subtitle')}
        footer={
          <>
            <button onClick={() => setShowReportModal(false)} className="btn btn-ghost">{t('action.cancel')}</button>
            <button onClick={handleDownloadReport} className="btn btn-primary">
              <FileText size={14} /> {t('expense.downloadPdf')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="field">
            <label className="label">{t('expense.period')}</label>
            <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} className="input select">
              <option value="today">{t('expense.today')}</option>
              <option value="week">{t('expense.thisWeek')}</option>
              <option value="month">{t('expense.thisMonth')}</option>
              <option value="year">{t('expense.thisYear')}</option>
            </select>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-md" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-500">{t('expense.entriesFound')}</span>
              <span className="text-sm font-semibold">{reportPreview.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t('expense.totalForPeriod')}</span>
              <span className="text-sm font-bold" style={{ color: '#DC2626' }}>{formatCurrency(reportPreview.total)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
