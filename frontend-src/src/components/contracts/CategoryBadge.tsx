import { CATEGORY_COLORS } from '@/lib/contractUtils';

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const cls = CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${cls}`}>
      {category}
    </span>
  );
}
