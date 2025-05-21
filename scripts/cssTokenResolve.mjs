import fse from 'fs-extra';
import { loadAndParseCSS, exportToCss } from './cssParser.mjs';

// metadata of files to be processed
const files = [
  {
    name: 'base',
    path: 'css/base/base.css',
    selector: ':root',
  },
  {
    name: 'components',
    path: 'css/component/component.css',
    selector: ':root',
  },
  {
    name: 'smcColors',
    path: 'css/smc/smc-colors.css',
    selector: ':root',
  },
  {
    name: 'smcLayout',
    path: 'css/smc/smc-layout.css',
    selector: ':root',
  },
  {
    name: 'smcReference',
    path: 'css/smc/smc-reference.css',
    selector: ':root',
  },
];

let resolvedFilesPath = 'css-resolved';

export async function cssTokenResolve(path) {
  if (path) {
    resolvedFilesPath = path;
  }

  const dictionary = files.reduce((list, dict) => {
    return {
      ...list,
      ...loadAndParseCSS(dict.path, dict.selector),
    };
  }, {});

  for (const file of files) {
    const parsedFile = loadAndParseCSS(file.path, file.selector);
    const processedFile = replaceVariables(parsedFile, dictionary);
    await exportToCss(processedFile, file.selector, getResolvedFilePath(file.path));
  }

  // export all the above in a `tokens.css` file
  await fse.outputFile(
    `${resolvedFilesPath}/tokens.css`,
    `
    @import url('base/base.css');
    @import url('smc/smc-colors.css');
    @import url('smc/smc-layout.css');
    @import url('smc/smc-reference.css');
    @import url('component/component.css');    
    `,
    'utf-8'
  );
}

// utility function for replacing CSS variables with their values
function replaceVariables(variables, dictionary) {
  const replaced = {};
  Object.entries(variables).forEach(([key, value]) => {
    let resolvedValue = resolve(value, dictionary);
    replaced[key] = resolvedValue;
  });
  return replaced;
}

// recursive function for resolving CSS variables: replaces the `var(--var-name)` with the value of the `var(--var-name)` from the dictionary
function resolve(value, dictionary) {
  let resolvedValue = value;
  const regex = /var\(\s*(--[^)]+)\s*\)/g;
  const match = [...value.matchAll(regex)];

  if (match.length) {
    match.forEach((m) => {
      resolvedValue = resolvedValue.replace(m[0], dictionary[m[1]]);
      if (regex.test(resolvedValue)) {
        resolvedValue = resolve(resolvedValue, dictionary);
      }
    });
  }
  return resolvedValue;
}

// utility function for generating path for the the resolved file
function getResolvedFilePath(filePath) {
  return filePath.replace('css', resolvedFilesPath);
}
