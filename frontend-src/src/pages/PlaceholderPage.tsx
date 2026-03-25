import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  phase: string;
}

export default function PlaceholderPage({ title, phase }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Construction className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
          <p className="text-sm text-gray-500">Module en cours de développement — {phase}</p>
        </CardContent>
      </Card>
    </div>
  );
}
