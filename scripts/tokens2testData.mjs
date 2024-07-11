import { existsSync, mkdirSync, readFileSync, writeFile } from "fs";
import { dirname } from "path";

import { fixUnit, getPropValue, getValueRefPath, isValueRef, hasModeExtensions, setPropValue } from '../utils/shared.mjs';

export function resolveValueRef(rawTokens, outputObj, valueRef) {
  const propPath = getValueRefPath(valueRef);

  // Look for already resolved value in the output object
  const cachedValue = getPropValue(outputObj, propPath);

  if (cachedValue != null) {
    return cachedValue;
  }

  // No resolved value in the output, look for it in the raw token def object
  const rawValue = getPropValue(rawTokens, propPath)?.value;

  if (isValueRef(rawValue)) {
    return resolveValueRef(rawTokens, outputObj, rawValue);
  }

  return rawValue;
}

function readTokens(inputObj, rawTokens, propPath = [], outputObj = {}) {
  if (!inputObj.hasOwnProperty('value')) {
    // obj is not a token definition object, continue parsing the object's props
    for (const key in inputObj) {
      const value = inputObj[key];

      if (typeof value === 'object' && value !== null) {
        readTokens(value, rawTokens, [...propPath, key], outputObj);
      }
    }
  } else if (!isValueRef(inputObj.value)) {
    // The value is not a token reference, set plain value
    setPropValue(outputObj, propPath, inputObj.value);
  }
  else if (hasModeExtensions(inputObj)) {
    // The token definition has a mode extension sub-object, which is also added to the output
    const modeExtensions = inputObj.$extensions.mode;
    Object.keys(modeExtensions).forEach((modeKey) => {
      const tokenModeValue = resolveValueRef(rawTokens, outputObj, modeExtensions[modeKey]);
      setPropValue(outputObj, [...propPath, modeKey], tokenModeValue);
    });
  } else {
    // A token definition with a value reference, the referred value is added to the output
    // (reference chains are resolved to the final plain value)
    setPropValue(outputObj, propPath, resolveValueRef(rawTokens, outputObj, inputObj.value));
  }

  return outputObj;
}

function generateTestData() {
  if (process.argv.length !== 4) {
    throw new Error('Usage: node tokens2testData.mjs /path/to/tokens.json /path/to/testData.json');
  }

  const sourceJsonPath = process.argv[2];
  const testDataOutputPath = process.argv[3];

  console.info('Reading source JSON...');
  const tokensRaw = JSON.parse(readFileSync(sourceJsonPath, 'utf-8'));

  console.info('Generating test data from JSON...');

  // JSON contains some values with incorrect unit.
  fixUnit(tokensRaw.base.percentage, '%');
  fixUnit(tokensRaw.base.typography.weight, '');
  const testData = readTokens(tokensRaw, tokensRaw);

  const outputDir = dirname(testDataOutputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFile(testDataOutputPath, JSON.stringify(testData, null, 2), (error) => {
    if (error) {
      throw new Error(error);
    } else {
      console.info("Test data generation was completed successfully.");
    }
  });
}

generateTestData();
