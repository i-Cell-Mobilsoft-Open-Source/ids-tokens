import { readFileSync, writeFileSync } from 'fs';

const tokenPrefix = '--ids';
const valueRefRegExp = /^\{([\w.-]+(?:\.[\w.-]+)+)\}$/;

const themes = {
  light: ['.ids-theme-light {'],
  dark: ['.ids-theme-dark {']
};
const root = [':root {'];

function isValueRef(value) {
  return typeof value === 'string' && valueRefRegExp.test(value);
}

function getValueRefPath(value) {
  return valueRefRegExp.exec(value)[1].split('.');
}

function valueRefToCssVar(value) {
  let valueRefPath = [tokenPrefix, ...getValueRefPath(value)];
  return `var(${valueRefPath.join('-').toLowerCase()})`;
}

function pushNewVariable(path, value, tokenArray = root) {
  tokenArray.push(`  ${path.join('-').toLowerCase()}: ${String(value)};`);
}

function hasModeExtensions(obj) {
  const modes = obj.$extensions.mode;
  return !!modes && modes.constructor === Object && Object.keys(modes).length > 0;
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

    modes.forEach(mode => {
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

function correctPercentageUnits(obj) {
  if (!obj) {
    console.warn('correctPercentageUnits: argument is not an object');
    return;
  }
  Object.keys(obj).forEach((percentageConfigKey) => {
    const percentageConfig = obj[percentageConfigKey];
    obj[percentageConfigKey] = {
      ...percentageConfig,
      value: percentageConfig.value.replace('px', '%')
    }
  });
}

if (process.argv.length === 4) {
  const sourceJson = process.argv[2];
  const cssOutput = process.argv[3];
  const tokensRaw = JSON.parse(readFileSync(sourceJson, 'utf-8'));

  // Figma handles percentage values as numbers between 0 and 100 w/o a specific unit. These values are automatically given "px" units during export.
  correctPercentageUnits(tokensRaw.base.percentage);
  flattenObject(tokensRaw, [tokenPrefix]);
  root.push('}', '');
  themes.light.push('}', '');
  themes.dark.push('}');
  writeFileSync(cssOutput, [...root, ...Object.values(themes).flat()].join('\n').replaceAll('ids-component', 'ids-comp'));
} else {
  console.log('Usage: node tokens2css.mjs /path/to/tokens.json /path/to/tokens.css');
}
