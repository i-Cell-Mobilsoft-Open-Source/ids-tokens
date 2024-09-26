export const CSS_MAX_DECIMAL_PRECISION = 4;

export function roundDecimals(value, decimal) {
  return +parseFloat(value).toFixed(decimal);
}
