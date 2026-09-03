export type BillingFrequency = 'mensuel' | 'annuel';

export function rappelApplicable(frequency: BillingFrequency, daysBeforeRenewal: number) {
  if (daysBeforeRenewal < 0) return null;
  if (frequency === 'mensuel') return daysBeforeRenewal <= 3 ? 'mensuel-3' : null;
  if (daysBeforeRenewal <= 7) return 'annuel-7';
  return daysBeforeRenewal <= 21 ? 'annuel-21' : null;
}

export function delaiGraceEcoule(frequency: BillingFrequency, failedAtMs: number, nowMs: number) {
  const days = frequency === 'annuel' ? 7 : 3;
  return nowMs - failedAtMs >= days * 86_400_000;
}
