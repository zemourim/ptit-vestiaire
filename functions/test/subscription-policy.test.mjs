import test from 'node:test';
import assert from 'node:assert/strict';
import { delaiGraceEcoule, rappelApplicable } from '../lib/subscriptionPolicy.js';

test('rappels annuels à 21 puis 7 jours', () => {
  assert.equal(rappelApplicable('annuel', 22), null);
  assert.equal(rappelApplicable('annuel', 21), 'annuel-21');
  assert.equal(rappelApplicable('annuel', 7), 'annuel-7');
});

test('rappel mensuel à 3 jours', () => {
  assert.equal(rappelApplicable('mensuel', 4), null);
  assert.equal(rappelApplicable('mensuel', 3), 'mensuel-3');
});

test('délais de grâce mensuel et annuel', () => {
  const day = 86_400_000;
  assert.equal(delaiGraceEcoule('mensuel', 0, 3 * day - 1), false);
  assert.equal(delaiGraceEcoule('mensuel', 0, 3 * day), true);
  assert.equal(delaiGraceEcoule('annuel', 0, 7 * day - 1), false);
  assert.equal(delaiGraceEcoule('annuel', 0, 7 * day), true);
});
