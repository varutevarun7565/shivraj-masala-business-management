export const UNIT_OPTIONS = ['kg','g','quintal','ton','litre','ml','piece','packet','box','bag','dozen','batch','hour','minute'] as const;

const families: Record<string, Record<string, number>> = {
  weight: { kg: 1, g: 0.001, quintal: 100, ton: 1000 },
  volume: { litre: 1, ml: 0.001 },
  count: { piece: 1, packet: 1, box: 1, bag: 1, dozen: 12 },
  time: { hour: 1, minute: 1 / 60 },
  batch: { batch: 1 },
};

const normalise = (u: string) => u.toLowerCase().replace(/^per\s+/, '').trim();
export function compatibleUnits(baseUnit: string) {
  const base = normalise(baseUnit);
  const family = Object.values(families).find(f => base in f);
  return family ? Object.keys(family) : [base || 'piece'];
}
export function convertToBase(quantity: number, fromUnit: string, baseUnit: string) {
  const from = normalise(fromUnit); const base = normalise(baseUnit);
  if (from === base) return quantity;
  const family = Object.values(families).find(f => from in f && base in f);
  if (!family) return quantity;
  return quantity * family[from] / family[base];
}
export function unitLabel(unit: string) { return normalise(unit); }
