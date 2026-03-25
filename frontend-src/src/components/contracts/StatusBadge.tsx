import { ContractStatus } from '@/types/contract';
import { STATUS_CONFIG } from '@/lib/contractUtils';

interface StatusBadgeProps {
  status: ContractStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${cfg.badgeBg} ${cfg.className} ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
