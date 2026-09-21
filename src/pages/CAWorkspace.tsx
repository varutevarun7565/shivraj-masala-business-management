import { useMemo, useState } from 'react';
import {
  AlertTriangle, Calculator, CheckCircle2, Download, FileSpreadsheet,
  Landmark, ReceiptText, Search, TrendingUp, WalletCards
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const money=(n:number)=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
function downloadCsv(name:string, headers:string[], rows:(string|number)[][]){
  const csv=[headers,...rows].map(r=>r.map(esc).join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}
function parseDate(v:string){
  if(!v) return new Date(0);
  if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v+'T00:00:00');
  const p=v.split('/').map(Number); if(p.length===3) return new Date(p[2],p[1]-1,p[0]);
  return new Date(v);
}
function inPeriod(date:string, period:string){
  if(period==='all') return true;
  const d=parseDate(date), now=new Date();
  if(period==='month') return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  const fyStart=now.getMonth()>=3?new Date(now.getFullYear(),3,1):new Date(now.getFullYear()-1,3,1);
  const fyEnd=new Date(fyStart.getFullYear()+1,2,31,23,59,59);
  return d>=fyStart&&d<=fyEnd;
}

export default function CAWorkspace(){
  const {invoices,rawMaterials,customers}=useApp();
  const [tab,setTab]=useState<'dashboard'|'sales'|'purchases'|'outstanding'|'calculator'>('dashboard');
  const [q,setQ]=useState(''); const [period,setPeriod]=useState('fy');
  const [calcAmount,setCalcAmount]=useState('1000'); const [calcRate,setCalcRate]=useState('5'); const [calcMode,setCalcMode]=useState<'inclusive'|'exclusive'>('inclusive');

  const allPurchases=useMemo(()=>rawMaterials.flatMap(m=>m.purchaseHistory.map(p=>({...p,material:m.name}))).sort((a,b)=>parseDate(b.date).getTime()-parseDate(a.date).getTime()),[rawMaterials]);
  const periodInvoices=useMemo(()=>invoices.filter(i=>inPeriod(i.date,period)),[invoices,period]);
  const periodPurchases=useMemo(()=>allPurchases.filter(p=>inPeriod(p.date,period)),[allPurchases,period]);
  const sales=useMemo(()=>periodInvoices.filter(i=>`${i.invoiceNo} ${i.customer} ${i.customerGstin||''}`.toLowerCase().includes(q.toLowerCase())),[periodInvoices,q]);
  const purchases=useMemo(()=>periodPurchases.filter(p=>`${p.supplierInvoiceNo||''} ${p.supplier||''} ${p.supplierGstin||''} ${p.material}`.toLowerCase().includes(q.toLowerCase())),[periodPurchases,q]);

  const outputGst=periodInvoices.reduce((s,i)=>s+(i.tax||0),0);
  const inputGst=periodPurchases.reduce((s,p)=>s+(p.gstAmount||0),0);
  const taxableSales=periodInvoices.reduce((s,i)=>s+i.items.reduce((x,it)=>x+(it.taxableAmount??0),0),0);
  const taxablePurchases=periodPurchases.reduce((s,p)=>s+(p.taxableAmount??0),0);
  const grossSales=periodInvoices.reduce((s,i)=>s+(i.total||0),0);
  const pending=invoices.reduce((s,i)=>s+(i.pendingAmount||0),0);
  const gstDifference=outputGst-inputGst;
  const missingCustomerGstin=customers.filter(c=>c.customerType==='Wholesale'&&!c.gstin).length;
  const missingSupplierGstin=allPurchases.filter(p=>p.gstPercent&&p.gstPercent>0&&!p.supplierGstin).length;
  const missingSupplierInvoice=allPurchases.filter(p=>p.gstPercent&&p.gstPercent>0&&!p.supplierInvoiceNo).length;
  const outstandingCustomers=customers.filter(c=>c.pendingAmount>0).sort((a,b)=>b.pendingAmount-a.pendingAmount);

  const exportSales=()=>downloadCsv('CA-Sales-Register.csv',['Invoice','Date','Customer','Type','GSTIN','Taxable Value','Output GST','Invoice Total','Paid','Pending','Status'],periodInvoices.map(i=>[i.invoiceNo,i.date,i.customer,i.customerType||'Retail',i.customerGstin||'',i.items.reduce((s,x)=>s+(x.taxableAmount||0),0),i.tax||0,i.total,i.paidAmount,i.pendingAmount,i.status]));
  const exportPurchases=()=>downloadCsv('CA-Purchase-Register.csv',['Supplier Invoice','Date','Supplier','GSTIN','Material','Taxable Value','Input GST','Invoice Total'],periodPurchases.map(p=>[p.supplierInvoiceNo||'',p.date,p.supplier,p.supplierGstin||'',p.material,p.taxableAmount??0,p.gstAmount??0,p.grandTotal??p.totalPrice]));
  const exportOutstanding=()=>downloadCsv('CA-Outstanding-Receivables.csv',['Customer','Phone','Type','GSTIN','Pending Amount','Last Purchase'],outstandingCustomers.map(c=>[c.name,c.phone,c.customerType||'Retail',c.gstin||'',c.pendingAmount,c.lastPurchaseDate]));

  const ca=useMemo(()=>{
    const amount=Math.max(0,Number(calcAmount)||0), rate=Math.max(0,Number(calcRate)||0);
    if(calcMode==='inclusive'){
      const taxable=rate?amount/(1+rate/100):amount; return {taxable,gst:amount-taxable,total:amount};
    }
    const gst=amount*rate/100; return {taxable:amount,gst,total:amount+gst};
  },[calcAmount,calcRate,calcMode]);

  const tabs=[
    ['dashboard','Overview'],['sales','Sales Register'],['purchases','Purchase Register'],['outstanding','Outstanding'],['calculator','GST Calculator']
  ] as const;
  const periodLabel=period==='month'?'This Month':period==='fy'?'Current Financial Year':'All Records';

  return <div className="ca-workspace space-y-5">
    <div className="page-hd">
      <div><h1 className="page-hd-title">CA & Accounts Workspace</h1><p className="page-hd-sub">One place for GST working, sales, purchases, receivables and accountant-ready exports.</p></div>
      <div className="flex items-center gap-2"><select className="input" value={period} onChange={e=>setPeriod(e.target.value)}><option value="month">This Month</option><option value="fy">Current Financial Year</option><option value="all">All Records</option></select><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700"><Landmark size={21}/></div></div>
    </div>

    <div className="card p-2 flex gap-1 flex-wrap">{tabs.map(([id,label])=><button key={id} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab===id?'bg-[#6b1f1b] text-white shadow-sm':'hover:bg-gray-100 text-gray-600'}`} onClick={()=>setTab(id)}>{label}</button>)}</div>

    {tab==='dashboard'&&<>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric icon={<TrendingUp size={19}/>} label="Gross Sales" value={money(grossSales)} sub={periodLabel}/>
        <Metric icon={<ReceiptText size={19}/>} label="Output GST" value={money(outputGst)} sub={`Taxable: ${money(taxableSales)}`}/>
        <Metric icon={<FileSpreadsheet size={19}/>} label="Input GST" value={money(inputGst)} sub={`Purchases: ${money(taxablePurchases)}`}/>
        <Metric icon={<WalletCards size={19}/>} label="Receivables" value={money(pending)} sub={`${outstandingCustomers.length} customers pending`}/>
      </div>
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4"><div><h2 className="font-bold text-lg">GST Working</h2><p className="text-xs text-gray-500">Indicative figures for CA review</p></div><span className={`px-3 py-1 rounded-full text-xs font-bold ${gstDifference>=0?'bg-amber-50 text-amber-700':'bg-green-50 text-green-700'}`}>{gstDifference>=0?'Indicative payable':'Indicative credit'}</span></div>
          <div className="space-y-3">
            <Row label="Taxable outward supplies" value={money(taxableSales)}/><Row label="Output GST collected" value={money(outputGst)}/><Row label="Taxable inward purchases" value={money(taxablePurchases)}/><Row label="Input GST recorded" value={money(inputGst)}/>
            <div className="border-t pt-3 flex justify-between items-center"><span className="font-bold">GST Difference</span><span className="text-xl font-extrabold text-[#6b1f1b]">{money(Math.abs(gstDifference))}</span></div>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-1">Record Health</h2><p className="text-xs text-gray-500 mb-4">Items CA may need you to complete</p>
          <Health label="Wholesale customers without GSTIN" count={missingCustomerGstin}/><Health label="GST purchases without supplier GSTIN" count={missingSupplierGstin}/><Health label="GST purchases without bill number" count={missingSupplierInvoice}/>
          <div className="mt-4 p-3 rounded-xl bg-green-50 text-green-800 text-xs flex gap-2"><CheckCircle2 size={16} className="shrink-0"/><span>Sales and purchase registers are ready for CSV export and CA reconciliation.</span></div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <button className="card p-4 text-left hover:shadow-md transition" onClick={()=>{setTab('sales');setQ('')}}><Download size={18} className="mb-2"/><b>Sales Register</b><p className="text-xs text-gray-500 mt-1">Review and export invoice-wise outward sales.</p></button>
        <button className="card p-4 text-left hover:shadow-md transition" onClick={()=>{setTab('purchases');setQ('')}}><Download size={18} className="mb-2"/><b>Purchase Register</b><p className="text-xs text-gray-500 mt-1">Review supplier bills and input GST records.</p></button>
        <button className="card p-4 text-left hover:shadow-md transition" onClick={()=>setTab('calculator')}><Calculator size={18} className="mb-2"/><b>GST Calculator</b><p className="text-xs text-gray-500 mt-1">Split inclusive prices or add GST to taxable value.</p></button>
      </div>
    </>}

    {(tab==='sales'||tab==='purchases')&&<>
      <div className="flex justify-between gap-3 flex-wrap"><div className="search-box max-w-md"><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={tab==='sales'?'Invoice, customer or GSTIN':'Supplier, bill, material or GSTIN'}/></div><button className="btn btn-secondary" onClick={tab==='sales'?exportSales:exportPurchases}><Download size={15}/>Export CSV</button></div>
      <div className="tbl-wrap"><table className="tbl"><thead>{tab==='sales'?<tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Type</th><th>GSTIN</th><th>Taxable</th><th>GST</th><th>Total</th><th>Pending</th></tr>:<tr><th>Supplier Bill</th><th>Date</th><th>Supplier</th><th>GSTIN</th><th>Material</th><th>Taxable</th><th>Input GST</th><th>Total</th></tr>}</thead><tbody>{tab==='sales'?sales.map(i=><tr key={i.id}><td className="td-bold">{i.invoiceNo}</td><td>{i.date}</td><td>{i.customer}</td><td>{i.customerType||'Retail'}</td><td>{i.customerGstin||'-'}</td><td>{money(i.items.reduce((s,x)=>s+(x.taxableAmount||0),0))}</td><td>{money(i.tax||0)}</td><td className="td-bold">{money(i.total)}</td><td>{money(i.pendingAmount)}</td></tr>):purchases.map((p,idx)=><tr key={`${p.id}-${idx}`}><td className="td-bold">{p.supplierInvoiceNo||'-'}</td><td>{p.date}</td><td>{p.supplier}</td><td>{p.supplierGstin||'-'}</td><td>{p.material}</td><td>{money(p.taxableAmount??0)}</td><td>{money(p.gstAmount??0)}</td><td className="td-bold">{money(p.grandTotal??p.totalPrice)}</td></tr>)}</tbody></table></div>
    </>}

    {tab==='outstanding'&&<div className="card overflow-hidden"><div className="p-4 flex justify-between items-center"><div><h2 className="font-bold">Customer Outstanding</h2><p className="text-xs text-gray-500">Receivables requiring follow-up</p></div><button className="btn btn-secondary" onClick={exportOutstanding}><Download size={15}/>Export CSV</button></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Customer</th><th>Phone</th><th>Type</th><th>GSTIN</th><th>Last Purchase</th><th>Pending</th></tr></thead><tbody>{outstandingCustomers.map(c=><tr key={c.id}><td className="td-bold">{c.name}</td><td>{c.phone||'-'}</td><td>{c.customerType||'Retail'}</td><td>{c.gstin||'-'}</td><td>{c.lastPurchaseDate}</td><td className="td-bold text-red-700">{money(c.pendingAmount)}</td></tr>)}{!outstandingCustomers.length&&<tr><td colSpan={6} className="text-center py-8 text-gray-500">No customer outstanding.</td></tr>}</tbody></table></div></div>}

    {tab==='calculator'&&<div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-6"><div className="flex items-center gap-3 mb-5"><div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><Calculator size={22}/></div><div><h2 className="font-bold text-lg">GST Calculator</h2><p className="text-xs text-gray-500">Useful for checking supplier bills and selling prices.</p></div></div>
        <div className="grid grid-cols-2 gap-2 mb-4"><button className={`btn ${calcMode==='inclusive'?'btn-primary':'btn-secondary'}`} onClick={()=>setCalcMode('inclusive')}>GST Included</button><button className={`btn ${calcMode==='exclusive'?'btn-primary':'btn-secondary'}`} onClick={()=>setCalcMode('exclusive')}>Add GST</button></div>
        <label className="label">{calcMode==='inclusive'?'Final price including GST':'Taxable / base amount'}</label><input className="input w-full mb-4" type="number" min="0" value={calcAmount} onChange={e=>setCalcAmount(e.target.value)} placeholder="Enter amount"/>
        <label className="label">GST Rate</label><div className="grid grid-cols-5 gap-2 mb-3">{[0,5,12,18,28].map(r=><button key={r} className={`py-2 rounded-lg border text-sm font-semibold ${Number(calcRate)===r?'bg-[#6b1f1b] text-white border-[#6b1f1b]':'bg-white hover:bg-gray-50'}`} onClick={()=>setCalcRate(String(r))}>{r}%</button>)}</div><input className="input w-full" type="number" min="0" value={calcRate} onChange={e=>setCalcRate(e.target.value)} placeholder="Custom GST %"/>
      </div>
      <div className="card p-6 bg-gradient-to-br from-white to-amber-50"><p className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-4">Calculation Result</p><div className="space-y-4"><CalcResult label="Taxable Value" value={money(ca.taxable)}/><CalcResult label={`GST @ ${Number(calcRate)||0}%`} value={money(ca.gst)}/><div className="border-t pt-4"><CalcResult label="Final Amount" value={money(ca.total)} strong/></div></div><div className="mt-6 p-3 rounded-xl bg-white border text-xs text-gray-600">{calcMode==='inclusive'?`The entered final price already contains GST. The calculator separates the taxable value and GST component without increasing the customer's price.`:`GST is calculated on the entered taxable value and added to get the final amount.`}</div></div>
    </div>}

    <p className="text-xs text-gray-500 pb-2">CA Workspace is a management and reconciliation aid. GST return filing, ITC eligibility, HSN/SAC treatment and statutory adjustments should be reviewed by the business Chartered Accountant.</p>
  </div>;
}

function Metric({icon,label,value,sub}:{icon:React.ReactNode,label:string,value:string,sub:string}){return <div className="card p-4"><div className="flex justify-between items-start"><div><div className="text-xs font-semibold text-gray-500">{label}</div><div className="text-xl font-extrabold mt-1">{value}</div></div><div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">{icon}</div></div><div className="text-[11px] text-gray-500 mt-2">{sub}</div></div>}
function Row({label,value}:{label:string,value:string}){return <div className="flex justify-between gap-3 text-sm"><span className="text-gray-600">{label}</span><b>{value}</b></div>}
function Health({label,count}:{label:string,count:number}){return <div className="flex items-center justify-between py-2.5 border-b last:border-0"><div className="flex items-center gap-2 text-sm">{count?<AlertTriangle size={15} className="text-amber-600"/>:<CheckCircle2 size={15} className="text-green-600"/>}<span>{label}</span></div><b className={count?'text-amber-700':'text-green-700'}>{count}</b></div>}
function CalcResult({label,value,strong=false}:{label:string,value:string,strong?:boolean}){return <div className="flex justify-between items-center"><span className={strong?'font-bold':'text-gray-600'}>{label}</span><span className={strong?'text-2xl font-extrabold text-[#6b1f1b]':'text-lg font-bold'}>{value}</span></div>}
