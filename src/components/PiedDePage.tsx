const links = [
  ['a-propos', 'Qui sommes-nous ?'],
  ['faq', 'FAQ'],
  ['cgu', 'Conditions d’utilisation'],
  ['cgv', 'Conditions de vente'],
  ['confidentialite', 'Confidentialité'],
  ['cookies', 'Cookies'],
  ['mentions-legales', 'Mentions légales']
] as const;

export function PiedDePage() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 px-4 py-7 text-slate-600">
      <nav aria-label="Informations et pages légales" className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-5 gap-y-2 text-center text-sm font-bold">
        {links.map(([slug, label]) => <a key={slug} href={`#${slug}`} className="hover:text-slate-950">{label}</a>)}
      </nav>
      <p className="mx-auto mt-4 max-w-6xl text-center text-xs font-bold text-slate-400">© {new Date().getFullYear()} PtitVestiaire</p>
    </footer>
  );
}
