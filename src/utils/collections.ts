import type { Selector, SortOrder } from '../types/models';

export function filterBy<T>(array: T[], predicate: Selector<T, boolean>): T[] {
  return array.filter((item: T): boolean => predicate(item));
}

export function sortBy<T, V>(
  array: T[],
  keyOrSelector: keyof T | Selector<T, V>,
  order: SortOrder = 'asc'
): T[] {
  const selector: Selector<T, T[keyof T] | V> = typeof keyOrSelector === 'function'
    ? keyOrSelector
    : (item: T): T[keyof T] => item[keyOrSelector];

  return [...array].sort((firstItem: T, secondItem: T): number => {
    const firstValue = selector(firstItem);
    const secondValue = selector(secondItem);

    if (firstValue === secondValue) return 0;

    let comparison = 0;
    if (firstValue === undefined || firstValue === null) comparison = -1;
    else if (secondValue === undefined || secondValue === null) comparison = 1;
    else if (typeof firstValue === 'string' && typeof secondValue === 'string') {
      comparison = firstValue.localeCompare(secondValue);
    } else {
      comparison = firstValue < secondValue ? -1 : 1;
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

export function groupBy<T, K extends PropertyKey>(
  array: T[],
  keySelector: Selector<T, K>
): Record<K, T[]> {
  return array.reduce((groups: Record<K, T[]>, item: T): Record<K, T[]> => {
    const key: K = keySelector(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}