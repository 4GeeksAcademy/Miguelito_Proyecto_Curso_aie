/**
 * Sistema de Gestión de Colecciones - HealthCore
 * Funciones genéricas para filtrar, ordenar, agrupar y buscar en arrays
 */

/**
 * 1. Filtrar elementos de un array según un predicado.
 */
export function filterBy<T>(array: T[], predicate: (item: T) => boolean): T[] {
  return array.filter((item: T): boolean => predicate(item));
}

/**
 * 2. Ordenar elementos de un array por una propiedad o función extractora de clave.
 */
export function sortBy<T>(
  array: T[],
  keyOrSelector: keyof T | ((item: T) => any),
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const selector: (item: T) => any = typeof keyOrSelector === 'function'
    ? keyOrSelector
    : (item: T): any => item[keyOrSelector];

  return [...array].sort((a: T, b: T): number => {
    const valA = selector(a);
    const valB = selector(b);

    if (valA === valB) return 0;

    let comparison = 0;
    if (valA === undefined || valA === null) comparison = -1;
    else if (valB === undefined || valB === null) comparison = 1;
    else if (typeof valA === 'string' && typeof valB === 'string') {
      comparison = valA.localeCompare(valB);
    } else {
      comparison = valA < valB ? -1 : 1;
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * 3. Agrupar elementos por una clave generada a partir de un selector.
 */
export function groupBy<T, K extends PropertyKey>(
  array: T[],
  keySelector: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc: Record<K, T[]>, item: T): Record<K, T[]> => {
    const key: K = keySelector(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * 4. Búsqueda Lineal (Linear Search) para arrays desordenados.
 */
export function linearSearch<T>(
  array: T[],
  predicate: (item: T) => boolean
): T | undefined {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
  return undefined;
}

/**
 * 5. Búsqueda Binaria (Binary Search) para arrays ordenados.
 */
export function binarySearch<T, V>(
  sortedArray: T[],
  targetValue: V,
  keySelector: (item: T) => V,
  compareFn?: (a: V, b: V) => number
): T | undefined {
  let left = 0;
  let right = sortedArray.length - 1;

  const defaultCompare = (a: V, b: V): number => {
    if (a === b) return 0;
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }
    return a < b ? -1 : 1;
  };

  const compare: (a: V, b: V) => number = compareFn || defaultCompare;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = keySelector(sortedArray[mid]);
    const cmp = compare(midValue, targetValue);

    if (cmp === 0) {
      return sortedArray[mid];
    } else if (cmp < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return undefined;
}
