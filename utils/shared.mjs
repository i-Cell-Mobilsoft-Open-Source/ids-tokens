export const valueRefRegExp = /^\{([\w.-]+(?:\.[\w.-]+)+)\}$/;
export const CSS_MAX_DECIMAL_PRECISION = 4;

export function setPropValue(obj, propPath, value) {
  const [propName, ...restPath] = propPath;

  if (restPath.length > 0) {
    setPropValue((obj[propName] = obj[propName] || {}), restPath, value);
  } else {
    obj[propName] = value;
  }

  return obj;
}

export function getPropValue(obj, propPath) {
  return propPath.reduce((acc, propName) => acc?.[propName], obj);
}

export function isValueRef(value) {
  return typeof value === 'string' && valueRefRegExp.test(value);
}

export function getValueRefPath(value) {
  return valueRefRegExp.exec(value)[1].split('.');
}

export function hasModeExtensions(obj) {
  const modes = obj.$extensions.mode;
  return modes != null && typeof modes === 'object' && Object.keys(modes).length > 0;
}

export function roundDecimals(value, decimal) {
  return +parseFloat(value).toFixed(decimal);
}

export function fixUnit(obj, correctUnit, transformValue = (val) => val) {
  Object.keys(obj).forEach((propName) => {
    const tokenObj = obj[propName];
    const modifiedTokenValue = transformValue(parseFloat(tokenObj.value));
    const normalizedTokenValue = roundDecimals(modifiedTokenValue, CSS_MAX_DECIMAL_PRECISION);
    tokenObj.value = `${normalizedTokenValue}${correctUnit}`;
  });
}
