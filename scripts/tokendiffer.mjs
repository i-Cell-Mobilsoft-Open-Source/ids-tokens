import { readFileSync, writeFileSync } from 'fs';

const ruleStartRegex = /^(\S+) \{$/;
const ruleEndRegex = /^(\s+)\}$/;
const keyValueRegex = /^\s+([^:]+): ([^;]+);$/;

function cssToObject(rawCss) {
  const rows = rawCss.split('\n');
  const result = {};
  let propName = null;

  rows.forEach((row) => {
    if (ruleStartRegex.test(row)) {
      propName = ruleStartRegex.exec(row).at(1);
      result[propName] = {};
    }
    if (keyValueRegex.test(row)) {
      const keyValue = keyValueRegex.exec(row);
      result[propName][keyValue.at(1)] = keyValue.at(2);
    }
    if (ruleEndRegex.test(row)) {
      propName = null;
    }
  });

  return result;
}

function arraySubtract(minuend, subtrahend) {
  const toRemove = new Set(subtrahend);
  return minuend.filter((item) => !toRemove.has(item));
}

if (process.argv.length === 4) {
  const oldCss = cssToObject(readFileSync(process.argv[2], 'utf-8'));
  const newCss = cssToObject(readFileSync(process.argv[3], 'utf-8'));
  const diffArray = [];

  Object.keys(oldCss).forEach((section) => {
    const oldKeys = Object.keys(oldCss[section]);
    const newKeys = Object.keys(newCss[section]);

    const keysRemoved = arraySubtract(oldKeys, newKeys);
    const keysAdded = arraySubtract(newKeys, oldKeys);
    const keysChanged = arraySubtract(oldKeys, keysRemoved).filter(
      (sharedKey) => oldCss[section][sharedKey] !== newCss[section][sharedKey]
    );

    if (keysRemoved.length || keysAdded.length || keysChanged.length) {
      diffArray.push(`------- [${section}] section differences -------\n`);
    }

    if (keysRemoved.length) {
      diffArray.push(`Keys removed:`);
      keysRemoved.forEach((key) => diffArray.push(key));
      diffArray.push('\n');
    }
    if (keysAdded.length) {
      diffArray.push(`Keys added:`);
      keysAdded.forEach((key) => diffArray.push(key));
      diffArray.push('\n');
    }
    if (keysChanged.length) {
      diffArray.push(`Keys changed:`);
      keysChanged.forEach((key) => diffArray.push(`${key}: "${oldCss[section][key]}" => "${newCss[section][key]}"`));
      diffArray.push('\n');
    }
    if (keysRemoved.length || keysAdded.length || keysChanged.length) {
      diffArray.push(`\n`);
    }
  });

  writeFileSync('tokens-diff.txt', diffArray.join('\n'));
} else {
  console.log('Usage: node tokendiffer.mjs /path/to/old.css /path/to/new.css');
}
