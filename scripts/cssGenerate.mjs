import { readFileSync, writeFile } from 'fs';
import nodePath from 'path';
import { brand } from './tokenProcessor.mjs';
import { CSS_MAX_DECIMAL_PRECISION, roundDecimals } from '../utils/shared.mjs';
import { compareAlphaNumericStrings } from '../utils/compare-alphanumeric-strings.mjs';

function isProperty(object) {
  const propertyIdentifyKeys = ['value', 'type'];
  const propertyKeys = Object.getOwnPropertyNames(object);
  return propertyIdentifyKeys.every((key) => propertyKeys.includes(key));
}

function getTokenObject(readSource) {
  return JSON.parse(readFileSync(readSource, 'utf-8'));
}

function getBaseValue(value, type, propName) {
  if (type === 'text' && value.includes(' ')) {
    return `"${value}"`;
  }

  if (type === 'number') {
    if (propName === 'dimension') {
      return normalizeValue(value, 'px');
    }
    if (propName === 'percentage') {
      return normalizeValue(value, '%');
    }
    if (propName === 'em') {
      return normalizeValue(value, 'em', (val) => val / 100);
    }
  }

  return `${value}`;
}

function getReferenceValue(value) {
  const formattedValue = String(value).slice(1, -1).replaceAll('.', '-');
  return `var(--${brand}-${formattedValue})`;
}

function normalizeValue(value, unit, transformValue = (val) => val) {
  const transformedValue = transformValue(parseFloat(value));
  const normalizedValue = roundDecimals(transformedValue, CSS_MAX_DECIMAL_PRECISION);
  return `${normalizedValue}${unit}`;
}

function flattenObject(object, tokens, path = [], isBaseValue = false, suffix = null) {
  if (!isProperty(object)) {
    for (const key in object) {
      const value = object[key];
      flattenObject(value, tokens, [...path, key], isBaseValue, suffix);
    }
    return;
  }
  const { value, type } = object;
  const tokenKey = (suffix ? [...path, suffix] : path).join('-').toLowerCase();
  const propName = path.at(-2);
  tokens[tokenKey] = isBaseValue ? getBaseValue(value, type, propName) : getReferenceValue(value);
}

function getSortedTokens(tokens) {
  return Object.fromEntries(Object.entries(tokens).sort((a, b) => compareAlphaNumericStrings(a[0], b[0])));
}

function getTokenFileDataToWrite(tokensArray = [{}]) {
  return tokensArray
    .map((item) => {
      const flattenedPrefixedTokens = Object.entries(item.tokensObject).map(([key, value]) => `  --${brand}-${key}: ${value};`);
      return [`${item.selector} {`, ...flattenedPrefixedTokens, '}'].join('\n');
    })
    .join('\n\n');
}

function writeCss(destination, tokensArray = [{}]) {
  const path = nodePath.join('tokens', destination);
  const data = getTokenFileDataToWrite(tokensArray);
  writeFile(path, data, (error) => {
    if (error) {
      throw new Error(error);
    }
  });
}

function processNormal(readSource, destination, isBaseValue = false) {
  const tokenObject = getTokenObject(readSource);
  const tokens = {};
  flattenObject(tokenObject, tokens, [], isBaseValue);
  const sortedTokensObject = getSortedTokens(tokens);
  writeCss(destination, [{ selector: ':root', tokensObject: sortedTokensObject }]);
}

function processThemes(basePath, destination) {
  const themes = ['dark', 'light'];
  const themeData = [];
  themes.forEach((theme) => {
    const readSource = nodePath.join(basePath, `${theme}.json`);
    const tokenObject = getTokenObject(readSource);
    const tokens = {};
    flattenObject(tokenObject, tokens, []);
    const sortedTokensObject = getSortedTokens(tokens);
    themeData.push({ selector: `.${brand}-theme-${theme}`, tokensObject: sortedTokensObject });
  });
  writeCss(destination, themeData);
}

function processMulti(basePath, destination, fileNames) {
  const multiData = {};
  fileNames.forEach((fileName) => {
    const readSource = nodePath.join(basePath, `${fileName}.json`);
    const tokenObject = getTokenObject(readSource);
    const tokens = {};
    const suffix = fileName; // E.g. small, medium, large (without file extension!)
    flattenObject(tokenObject, tokens, [], false, suffix);

    Object.assign(multiData, tokens);
  });

  const sortedMultiData = getSortedTokens(multiData);
  writeCss(destination, [{ selector: ':root', tokensObject: sortedMultiData }]);
}

function processFoundation(readBasePath) {
  processNormal(nodePath.join(readBasePath, 'base', 'base.json'), nodePath.join('base', 'base.css'), true);
  processThemes(nodePath.join(readBasePath, 'smc-colors'), nodePath.join('smc', 'smc-colors.css'));
  processMulti(nodePath.join(readBasePath, 'smc-layout'), nodePath.join('smc', 'smc-layout.css'), ['small', 'medium', 'large', 'xlarge']);
  processNormal(nodePath.join(readBasePath, 'smc-reference', 'smc-reference.json'), nodePath.join('smc', 'smc-reference.css'));
}

function processWeb(basePath) {
  processNormal(basePath, 'comp-color', 'component');
  processMulti(basePath, 'comp-size', ['dense', 'compact', 'comfortable', 'spacious']);
}

export function generateCSS(targetDir, repositories) {
  processFoundation(nodePath.join(targetDir, 'temp', repositories.foundation.name, 'foundation', 'tokens'));
  // processWeb(nodePath.join(targetDir, 'temp', repositories.web.name, 'foundation', 'tokens'));
}
