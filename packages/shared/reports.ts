/**
 * Sistema de Generación de Reportes - HealthCore
 * Funciones genéricas y estrictamente tipeadas para agregación y reporte de datos
 */

/**
 * 1. Contar elementos por categoría (frecuencia por grupo/categoría).
 * @param array Colección de objetos
 * @param categorySelector Función para extraer la categoría o propiedad clave
 */
export function countByCategory<T, K extends PropertyKey>(
  array: T[],
  categorySelector: (item: T) => K
): Record<K, number> {
  return array.reduce((acc: Record<K, number>, item: T): Record<K, number> => {
    const category: K = categorySelector(item);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<K, number>);
}

/**
 * 2. Sumar valores numéricos de una colección de objetos.
 * @param array Colección de objetos
 * @param valueSelector Nombre de la propiedad o función selectora numérica
 */
export function sumBy<T>(
  array: T[],
  valueSelector: keyof T | ((item: T) => number)
): number {
  const selector: (item: T) => number = typeof valueSelector === 'function'
    ? valueSelector
    : (item: T): number => Number(item[valueSelector]) || 0;

  return array.reduce((sum: number, item: T): number => sum + (selector(item) || 0), 0);
}

/**
 * 3. Calcular el promedio de un campo o métrica en una colección de objetos.
 * @param array Colección de objetos
 * @param valueSelector Nombre de la propiedad o función selectora numérica
 */
export function averageBy<T>(
  array: T[],
  valueSelector: keyof T | ((item: T) => number)
): number {
  if (array.length === 0) return 0;
  return sumBy(array, valueSelector) / array.length;
}

/**
 * Estructura de un reporte numérico agregado
 */
export interface MetricSummaryReport {
  totalCount: number;
  sum: number;
  average: number;
  min: number;
  max: number;
}

/**
 * 4. Generar un reporte numérico con métricas agregadas (conteo, suma, promedio, min, max).
 * @param array Colección de objetos
 * @param valueSelector Nombre de la propiedad o función selectora numérica
 */
export function generateMetricReport<T>(
  array: T[],
  valueSelector: keyof T | ((item: T) => number)
): MetricSummaryReport {
  if (array.length === 0) {
    return { totalCount: 0, sum: 0, average: 0, min: 0, max: 0 };
  }

  const selector: (item: T) => number = typeof valueSelector === 'function'
    ? valueSelector
    : (item: T): number => Number(item[valueSelector]) || 0;

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (const item of array) {
    const val: number = selector(item) || 0;
    sum += val;
    if (val < min) min = val;
    if (val > max) max = val;
  }

  return {
    totalCount: array.length,
    sum,
    average: sum / array.length,
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max
  };
}
