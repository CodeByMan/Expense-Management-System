// ── Carry-forward Button ──────────────────────────────────────────────────────

import api from "@/service/axios";
import { Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type CarryForwardButtonProps = {
  fromMonth: number;
  fromYear: number;
  hasbudgets: boolean;
  onSuccess?: () => void;
};

export default function CarryForwardButton({ fromMonth, fromYear,hasbudgets, onSuccess }: CarryForwardButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const toMonth = fromMonth === 12 ? 1 : fromMonth + 1;
  const toYear  = fromMonth === 12 ? fromYear + 1 : fromYear;

  const MONTH_NAMES = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];

  const handleCarryForward = async () => {
    if (!hasbudgets) {  
      toast.error(`No budgets in ${MONTH_NAMES[fromMonth - 1]} to copy forward.`);
      return;
    }
    setLoading(true);
    try {
      await api.post(
        `/categorybudgets/carry-forward?fromMonth=${fromMonth}&fromYear=${fromYear}`
      );
      setDone(true);
      toast.success(`Budgets copied to ${MONTH_NAMES[toMonth - 1]} ${toYear}!`);
      onSuccess?.();
      setTimeout(() => setDone(false), 3000);
    } catch {
      toast.error('Failed to carry forward budgets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCarryForward}
      disabled={loading || done}
      title={`Copy ${MONTH_NAMES[fromMonth - 1]} budgets → ${MONTH_NAMES[toMonth - 1]} ${toYear}`}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
    >
      {done ? (
        <>
          <Check size={15} className="text-green-500" />
          Copied!
        </>
      ) : loading ? (
        <>
          <RefreshCw size={15} className="animate-spin text-blue-500" />
          Copying...
        </>
      ) : (
        <>
          <RefreshCw size={15} className="text-gray-500" />
          Copy to {MONTH_NAMES[toMonth - 1]}
        </>
      )}
    </button>
  );
}