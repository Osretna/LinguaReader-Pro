import React, { useState } from 'react';
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Trash2,
  Printer
} from 'lucide-react';

interface Invoice {
  id: string;
  customerName: string;
  service: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
}

export const DemoApp: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'INV-1049', customerName: 'شركة النور للمقاولات', service: 'توريد أجهزة إلكترونية', amount: 8400, status: 'paid', date: '2026-09-02' },
    { id: 'INV-1050', customerName: 'مؤسسة الأمل التجارية', service: 'صيانة دورية وترقية نظام', amount: 3200, status: 'pending', date: '2026-09-02' },
    { id: 'INV-1051', customerName: 'مكتب المهندس أحمد شاكر', service: 'اشتراك سنوي في المنظومة', amount: 12500, status: 'paid', date: '2026-09-01' },
    { id: 'INV-1052', customerName: 'مستودع البركة', service: 'شحنة قطع غيار مستوردة', amount: 4600, status: 'pending', date: '2026-08-31' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newService, setNewService] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer || !newAmount) return;

    const newInv: Invoice = {
      id: `INV-${Math.floor(1053 + Math.random() * 900)}`,
      customerName: newCustomer,
      service: newService || 'خدمات استشارية وتقنية',
      amount: parseFloat(newAmount),
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };

    setInvoices([newInv, ...invoices]);
    setNewCustomer('');
    setNewService('');
    setNewAmount('');
    setShowNewModal(false);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== id));
  };

  const toggleInvoiceStatus = (id: string) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === id ? { ...inv, status: inv.status === 'paid' ? 'pending' : 'paid' } : inv
      )
    );
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.customerName.includes(searchTerm) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.service.includes(searchTerm)
  );

  const totalRevenue = invoices.reduce((acc, curr) => acc + (curr.status === 'paid' ? curr.amount : 0), 0);

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col" dir="rtl">
      {/* Top Application Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-bold text-lg">
              ERP
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                نظام إدارة المبيعات والفواتير
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  التطبيق المحمي بالصلاحية
                </span>
              </h1>
              <p className="text-xs text-slate-400">لوحة العمليات اليومية وإصدار الفواتير ومتابعة التحصيل</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="new-invoice-trigger-btn"
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار فاتورة جديدة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">إجمالي المبيعات المحصلة</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {totalRevenue.toLocaleString()} ج.م
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">الفواتير المعلقة</span>
              <span className="text-2xl font-bold text-amber-400 font-mono">
                {invoices.filter((i) => i.status === 'pending').length} فواتير
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">العملاء النشطين</span>
              <span className="text-2xl font-bold text-sky-400 font-mono">
                48 عميل
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">نسبة النمو الشهري</span>
              <span className="text-2xl font-bold text-purple-400 font-mono">
                +18.4%
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Invoices List Section */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                سجل الفواتير والعمليات
              </h2>
              <span className="text-xs text-slate-400">إدارة ومتابعة التحصيل لكل عميل</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث باسم العميل أو رقم الفاتورة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder:text-slate-500 w-64 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">رقم الفاتورة</th>
                  <th className="px-6 py-3 font-semibold">العميل</th>
                  <th className="px-6 py-3 font-semibold">البيان / الخدمة</th>
                  <th className="px-6 py-3 font-semibold">المبلغ</th>
                  <th className="px-6 py-3 font-semibold">حالة الدفع</th>
                  <th className="px-6 py-3 font-semibold">التاريخ</th>
                  <th className="px-6 py-3 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-300">{inv.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{inv.customerName}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{inv.service}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                      {inv.amount.toLocaleString()} ج.م
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggleInvoiceStatus(inv.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        }`}
                      >
                        {inv.status === 'paid' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تم التحصيل
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            معلق للدفع
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{inv.date}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          title="طباعة الفاتورة"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id)}
                          title="حذف"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* New Invoice Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl text-right">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              إصدار فاتورة جديدة
            </h3>
            
            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم العميل / الشركة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النيل للبرمجيات"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">البيان أو الخدمة:</label>
                <input
                  type="text"
                  placeholder="مثال: توريد واستشارات تقنية"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">المبلغ الإجمالي (جنيه):</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="مثال: 5000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition"
                >
                  حفظ وإصدار الفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
