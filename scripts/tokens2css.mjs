import { readFileSync, writeFile } from 'fs';

import { compareAlphaNumericStrings } from '../utils/compare-alphanumeric-strings.mjs';
import { fixUnit, getValueRefPath, isValueRef, hasModeExtensions } from '../utils/shared.mjs';

const tokenPrefix = '--ids';

const themes = {
  light: [],
  dark: [],
};
const root = [];

function valueRefToCssVar(value) {
  let valueRefPath = [tokenPrefix, ...getValueRefPath(value)];
  return `var(${valueRefPath.join('-').toLowerCase()})`;
}

function pushNewVariable(path, value, tokenArray = root) {
  tokenArray.push(`  ${path.join('-').toLowerCase()}: ${String(value)};`);
}

function flattenObject(obj, path = []) {
  if (!obj.hasOwnProperty('value')) {
    // obj is not a token definition object, continue parsing its object props
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === 'object' && value !== null) {
        flattenObject(value, [...path, key]);
      }
    }
    return;
  }

  if (!isValueRef(obj.value)) {
    // The value is not a token reference, push plain value to CSS
    pushNewVariable(path, obj.value);
    return;
  }

  if (hasModeExtensions(obj)) {
    const modeExtensions = obj.$extensions.mode;
    const modes = Object.keys(modeExtensions);
    const isThemeModes = new Set([...modes, ...Object.keys(themes)]).size === modes.length;

    if (isThemeModes) {
      // push the default value to :root
      pushNewVariable(path, valueRefToCssVar(obj.value));
    }

    modes.forEach((mode) => {
      if (isThemeModes) {
        pushNewVariable(path, valueRefToCssVar(modeExtensions[mode]), themes[mode]);
      } else {
        pushNewVariable([...path, mode], valueRefToCssVar(modeExtensions[mode]));
      }
    });
    return;
  }

  pushNewVariable(path, valueRefToCssVar(obj.value));
}

function replaceCollectionNames(data) {
  return data.map((item) => item.replaceAll('comp-size', 'comp').replaceAll('comp-color', 'comp'));
}

function convertTokens2css() {
  if (process.argv.length !== 4) {
    throw new Error('Usage: node tokens2css.mjs /path/to/tokens.json /path/to/tokens.css');
  }

  const sourceJson = process.argv[2];
  const cssOutput = process.argv[3];

  console.info('Reading source JSON...');
  const tokensRaw = JSON.parse(readFileSync(sourceJson, 'utf-8'));

  console.info('Generating CSS from JSON...');

  // JSON contains some values with incorrect unit.
  fixUnit(tokensRaw.base.percentage, '%');
  fixUnit(tokensRaw.base.typography.weight, '');
  fixUnit(tokensRaw.base.em, 'em', (val) => val / 100);

  flattenObject(tokensRaw, [tokenPrefix]);

  const data = [
    ':root {',
    ...replaceCollectionNames(root).sort(compareAlphaNumericStrings),
    '}',
    '',
    ...Object.entries(themes)
      .map(([name, values]) => [`.ids-theme-${name} {`, ...values.sort(compareAlphaNumericStrings), '}'])
      .flat(),
  ].join('\n');

  writeFile(cssOutput, data, (error) => {
    if (error) {
      throw new Error(error);
    } else {
      console.info('CSS generation was completed successfully.');
      console.info('\x1b[30;102m CSS generation was completed successfully. \x1b[0;0m');
    }
  });
}

convertTokens2css();
