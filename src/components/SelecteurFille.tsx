import { FILLES, filleStyles } from '../lib/constants';
import type { Fille } from '../types';

type Props = {
  value: Fille;
  onChange: (fille: Fille) => void;
};

export function SelecteurFille({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Prénom">
      {FILLES.map((fille) => {
        const selected = value === fille;
        return (
          <button
            key={fille}
            type="button"
            onClick={() => onChange(fille)}
            className={`rounded-2xl border bg-gradient-to-br p-4 text-left shadow-sm transition ${filleStyles[fille].panel} ${
              selected ? `ring-2 ${filleStyles[fille].ring}` : 'ring-0'
            }`}
          >
            <span className={`text-xl font-black ${filleStyles[fille].text}`}>{fille}</span>
          </button>
        );
      })}
    </div>
  );
}
