import { Crown } from 'lucide-react';

export function UpgradeNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-violet-200 bg-violet-50 p-3 text-sm font-bold text-violet-800">
      <Crown size={16} className="mr-2 inline" /> {children}{' '}
      <a href="#reglages" className="font-black underline">Passer à la formule payante</a>
    </p>
  );
}
