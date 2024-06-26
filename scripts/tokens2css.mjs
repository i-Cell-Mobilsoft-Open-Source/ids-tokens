import { readFileSync, writeFile } from "fs";

import { compareAlphaNumericStrings } from "../utils/compare-alphanumeric-strings.mjs";

const tokenPrefix = "--ids";
const valueRefRegExp = /^\{([\w.-]+(?:\.[\w.-]+)+)\}$/;
const CSS_MAX_DECIMAL_PRECISION = 4;

const themes = {
  light: [],
  dark: [],
};
const root = [];

function isValueRef(value) {
  return typeof value === "string" && valueRefRegExp.test(value);
}

function getValueRefPath(value) {
  return valueRefRegExp.exec(value)[1].split(".");
}

function valueRefToCssVar(value) {
  let valueRefPath = [tokenPrefix, ...getValueRefPath(value)];
  return `var(${valueRefPath.join("-").toLowerCase()})`;
}

function pushNewVariable(path, value, tokenArray = root) {
  tokenArray.push(`  ${path.join("-").toLowerCase()}: ${String(value)};`);
}

function hasModeExtensions(obj) {
  const modes = obj.$extensions.mode;
  return (
    !!modes && modes.constructor === Object && Object.keys(modes).length > 0
  );
}

function flattenObject(obj, path = []) {
  if (!obj.hasOwnProperty("value")) {
    // obj is not a token definition object, continue parsing its object props
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === "object" && value !== null) {
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
    const isThemeModes =
      new Set([...modes, ...Object.keys(themes)]).size === modes.length;

    if (isThemeModes) {
      // push the default value to :root
      pushNewVariable(path, valueRefToCssVar(obj.value));
    }

    modes.forEach((mode) => {
      if (isThemeModes) {
        pushNewVariable(
          path,
          valueRefToCssVar(modeExtensions[mode]),
          themes[mode]
        );
      } else {
        pushNewVariable(
          [...path, mode],
          valueRefToCssVar(modeExtensions[mode])
        );
      }
    });
    return;
  }

  pushNewVariable(path, valueRefToCssVar(obj.value));
}

function roundDecimals(value, decimal) {
  return +parseFloat(value).toFixed(decimal);
}

function fixUnit(obj, correctUnit) {
  if (!obj) {
    throw new Error("fixUnit: argument is not an object");
  }
  if (correctUnit === null || correctUnit === undefined) {
    throw new Error("fixUnit: 'correctUnit' parameter is required");
  }
  Object.keys(obj).forEach((percentageConfigKey) => {
    const percentageConfig = obj[percentageConfigKey];
    obj[percentageConfigKey].value =
      roundDecimals(percentageConfig.value, CSS_MAX_DECIMAL_PRECISION) +
      correctUnit;
  });
}

function convertTokens2css() {
  if (process.argv.length !== 4) {
    throw new Error(
      "Usage: node tokens2css.mjs /path/to/tokens.json /path/to/tokens.css"
    );
  }

  const sourceJson = process.argv[2];
  const cssOutput = process.argv[3];

  console.info("Reading source JSON...");
  const tokensRaw = JSON.parse(readFileSync(sourceJson, "utf-8"));

  console.info("Generating CSS from JSON...");

  // JSON contains some values with incorrect unit.
  fixUnit(tokensRaw.base.percentage, "%");
  fixUnit(tokensRaw.base.typography.weight, "");

  flattenObject(tokensRaw, [tokenPrefix]);

  const data = [
    ":root {",
    ...root.sort(compareAlphaNumericStrings),
    "}",
    "",
    ...Object.entries(themes)
      .map(([name, values]) => [
        `.ids-theme-${name} {`,
        ...values.sort(compareAlphaNumericStrings),
        "}",
      ])
      .flat(),
  ]
    .join("\n")
    .replaceAll("ids-component", "ids-comp");

  writeFile(cssOutput, data, (error) => {
    if (error) {
      throw new Error(error);
    } else {
      console.info("CSS generation was completed successfull.");
    }
  });
}

convertTokens2css();
