import { getFilleStyles } from '../lib/constants';
import type { Fille } from '../types';

type Props = {
  value: Fille;
  onChange: (fille: Fille) => void;
  enfants: string[];
};

export function SelecteurFille({ value, onChange, enfants }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Prénom">
      {enfants.map((fille) => {
        const selected = value === fille;
        const styles = getFilleStyles(fille);
        return (
          <button
            key={fille}
            type="button"
            onClick={() => onChange(fille)}
            className={`rounded-2xl border bg-gradient-to-br p-4 text-left shadow-sm transition ${styles.panel} ${
              selected ? `ring-2 ${styles.ring}` : 'ring-0'
            }`}
          >
            <span className={`text-xl font-black ${styles.text}`}>{fille}</span>
          </button>
        );
      })}
    </div>
  );
}
