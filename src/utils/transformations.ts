import type { MetricSummaryReport, Selector } from '../types/models';

export function countByCategory<T, K extends PropertyKey>(
  array: T[],
  categorySelector: Selector<T, K>
): Record<K, number> {
  return array.reduce((counts: Record<K, number>, item: T): Record<K, number> => {
    const category: K = categorySelector(item);
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {} as Record<K, number>);
}

export function sumBy<T>(
  array: T[],
  valueSelector: keyof T | Selector<T, number>
): number {
  const selector: Selector<T, number> = getNumberSelector(valueSelector);

  return array.reduce((sum: number, item: T): number => sum + selector(item), 0);
}

export function averageBy<T>(
  array: T[],
  valueSelector: keyof T | Selector<T, number>
): number {
  if (array.length === 0) return 0;

  return sumBy(array, valueSelector) / array.length;
}

export function generateMetricReport<T>(
  array: T[],
  valueSelector: keyof T | Selector<T, number>
): MetricSummaryReport {
  if (array.length === 0) {
    return { totalCount: 0, sum: 0, average: 0, min: 0, max: 0 };
  }

  const selector: Selector<T, number> = getNumberSelector(valueSelector);
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (const item of array) {
    const value: number = selector(item);
    sum += value;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  return {
    totalCount: array.length,
    sum,
    average: sum / array.length,
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max
  };
}

function getNumberSelector<T>(valueSelector: keyof T | Selector<T, number>): Selector<T, number> {
  if (typeof valueSelector === 'function') {
    return valueSelector;
  }

  return (item: T): number => Number(item[valueSelector]) || 0;
}