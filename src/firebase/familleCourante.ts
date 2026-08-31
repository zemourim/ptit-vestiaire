let currentFamilyId: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('ptitvestiaire.familleId') : null;

export function definirFamilleCourante(familleId: string | null) {
  currentFamilyId = familleId;
  if (typeof window === 'undefined') return;
  if (familleId) sessionStorage.setItem('ptitvestiaire.familleId', familleId);
  else sessionStorage.removeItem('ptitvestiaire.familleId');
}

export function familleIdCourante() {
  return currentFamilyId;
}
