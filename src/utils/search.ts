import type { Comparable, Selector } from '../types/models';

export type CompareFunction<V> = (firstValue: V, secondValue: V) => number;

export function linearSearch<T>(
  array: T[],
  predicate: Selector<T, boolean>
): T | undefined {
  for (let index = 0; index < array.length; index += 1) {
    if (predicate(array[index])) {
      return array[index];
    }
  }

  return undefined;
}

export function binarySearch<T, V extends Comparable>(
  sortedArray: T[],
  targetValue: V,
  keySelector: Selector<T, V>,
  compareFn: CompareFunction<V> = defaultCompare
): T | undefined {
  let left = 0;
  let right = sortedArray.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue: V = keySelector(sortedArray[mid]);
    const comparison: number = compareFn(midValue, targetValue);

    if (comparison === 0) {
      return sortedArray[mid];
    }

    if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return undefined;
}

function defaultCompare<V extends Comparable>(firstValue: V, secondValue: V): number {
  if (firstValue === secondValue) return 0;

  if (typeof firstValue === 'string' && typeof secondValue === 'string') {
    return firstValue.localeCompare(secondValue);
  }

  return firstValue < secondValue ? -1 : 1;
}