import { useState } from 'react';
import { FileDown, FileSpreadsheet, ChevronDown } from 'lucide-react';

import toast from 'react-hot-toast';
import api from '@/service/axios';

// ── Export Button (PDF + Excel) ───────────────────────────────────────────────

type ExportButtonProps = {
  month: number;
  year: number;
};

export function ExportButton({ month, year }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null);

  const download = async (type: 'pdf' | 'excel') => {
    setLoading(type);
    setOpen(false);
    try {
      const endpoint = type === 'pdf' ? 'pdf' : 'excel';
      const mime = type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';

      const res = await api.get(
        `/export/${endpoint}?month=${month}&year=${year}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${String(month).padStart(2, '0')}-${year}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} downloaded!`);
    } catch {
      toast.error(`Failed to export ${type.toUpperCase()}.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative flex-1 sm:flex-none">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 sm:py-4"
      >
        <FileDown size={15} className="text-gray-500" />
        {loading ? `Exporting ${loading.toUpperCase()}...` : 'Export'}
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <button
              onClick={() => download('pdf')}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
            >
              <FileDown size={15} className="text-red-500" />
              Download PDF
            </button>
            <div className="h-px bg-gray-100" />
            <button
              onClick={() => download('excel')}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet size={15} className="text-green-600" />
              Download Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
}


