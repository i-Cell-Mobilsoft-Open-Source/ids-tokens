import { readFileSync, writeFile } from 'fs';
import nodePath from 'path';
import { brand, branches } from './tokenProcessor.mjs';
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

function renameTokens(tokenObject, replaces) {
  let renamedTokenObject = tokenObject;
  replaces.forEach((item) => {
    renamedTokenObject = Object.fromEntries(
      Object.entries(renamedTokenObject).map(([key, value]) => [key.replace(item.searchValue, item.replaceValue), value]),
    );
  });
  return renamedTokenObject;
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
  const path = nodePath.join('css', destination);
  const data = getTokenFileDataToWrite(tokensArray);
  writeFile(path, data, (error) => {
    if (error) {
      throw new Error(error);
    }
  });
}

function getNormalTokenData(readSource, isBaseValue = false) {
  const tokenObject = getTokenObject(readSource);
  const tokens = {};
  flattenObject(tokenObject, tokens, [], isBaseValue);
  return getSortedTokens(tokens);
}

function processNormal(readSource, destination, isBaseValue = false) {
  const normalTokens = getNormalTokenData(readSource, isBaseValue);
  writeCss(destination, [{ selector: ':root', tokensObject: normalTokens }]);
}

function getThemeTokenData(basePath, themes) {
  const themeData = [];
  themes.forEach((theme) => {
    const readSource = nodePath.join(basePath, `${theme}.json`);
    const tokenObject = getTokenObject(readSource);
    const tokens = {};
    flattenObject(tokenObject, tokens, []);
    const sortedTokensObject = getSortedTokens(tokens);
    themeData.push({ selector: `.${brand}-theme-${theme}`, tokensObject: sortedTokensObject });
  });
  return themeData;
}

function processThemes(basePath, destination) {
  const themes = ['dark', 'light'];
  const themeTokens = getThemeTokenData(basePath, themes);
  writeCss(destination, themeTokens);
}

function getMultiTokenData(basePath, fileNames) {
  const multiData = {};
  fileNames.forEach((fileName) => {
    const readSource = nodePath.join(basePath, `${fileName}.json`);
    const tokenObject = getTokenObject(readSource);
    const tokens = {};
    const suffix = fileName; // E.g. small, medium, large (without file extension!)
    flattenObject(tokenObject, tokens, [], false, suffix);

    Object.assign(multiData, tokens);
  });

  return getSortedTokens(multiData);
}

function processMulti(basePath, destination, fileNames) {
  const multiTokenData = getMultiTokenData(basePath, fileNames);
  writeCss(destination, [{ selector: ':root', tokensObject: multiTokenData }]);
}

function processFoundation(readBasePath) {
  processNormal(nodePath.join(readBasePath, 'base', 'base.json'), nodePath.join('base', 'base.css'), true);
  processThemes(nodePath.join(readBasePath, 'smc-colors'), nodePath.join('smc', 'smc-colors.css'));
  processMulti(nodePath.join(readBasePath, 'smc-layout'), nodePath.join('smc', 'smc-layout.css'), ['small', 'medium', 'large', 'xlarge']);
  processNormal(nodePath.join(readBasePath, 'smc-reference', 'smc-reference.json'), nodePath.join('smc', 'smc-reference.css'));
}

function processComponent(readBasePath) {
  const features = branches.web;
  let componentTokens = {};
  features.forEach((feature) => {
    const componentColorTokens = getNormalTokenData(nodePath.join(readBasePath, feature, 'tokens', 'comp-color', 'component.json'));
    const componentSizeTokens = getMultiTokenData(nodePath.join(readBasePath, feature, 'tokens', 'comp-size'), [
      'dense',
      'compact',
      'comfortable',
      'spacious',
    ]);
    Object.assign(componentTokens, componentColorTokens, componentSizeTokens);
    componentTokens = getSortedTokens(
      renameTokens(componentTokens, [
        { searchValue: 'comp-color-', replaceValue: 'comp-' },
        { searchValue: 'comp-size-', replaceValue: 'comp-' },
      ]),
    );
  });

  const destination = nodePath.join('component', 'component.css');
  writeCss(destination, [{ selector: ':root', tokensObject: componentTokens }]);
}

export function generateCSS(targetDir, repositories) {
  processFoundation(nodePath.join(targetDir, 'temp', repositories.foundation.name, 'foundation', 'tokens'));
  processComponent(nodePath.join(targetDir, 'temp', repositories.web.name));
}
