import { AlertTriangle, Clock } from 'lucide-react';
import { Contract } from '@/types/contract';
import { getUrgencyLevel, getDaysUntil } from '@/lib/contractUtils';

export function UrgencyIndicator({ contract }: { contract: Contract }) {
  const level = getUrgencyLevel(contract);
  if (!level || level === 'normal' || !contract.noticeDeadline) return null;

  const days = getDaysUntil(contract.noticeDeadline);

  if (level === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
        <AlertTriangle className="w-3 h-3" />
        {days <= 0 ? 'Dépassé' : `${days}j`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
      <Clock className="w-3 h-3" />
      {days}j
    </span>
  );
}
