import fse from 'fs-extra';
import { loadAndParseCSS, exportToCss } from './cssParser.mjs';

// metadata of files to be processed
const files = [
  {
    name: 'base',
    path: 'css/base/base.css',
  },
  {
    name: 'components',
    path: 'css/component/component.css',
  },
  {
    name: 'smcColors',
    path: 'css/smc/smc-colors.css',
    transformLightDark: true,
  },
  {
    name: 'smcLayout',
    path: 'css/smc/smc-layout.css',
  },
  {
    name: 'smcReference',
    path: 'css/smc/smc-reference.css',
  },
];

export async function cssTokenResolve(path) {
  if (!path) {
    console.error('❌ No path provided for resolved files!');
    return;
  }

  const parsedFiles = files.map((file) => {
    return {
      ...file,
      content: file.transformLightDark ? transformLightDark(file.path) : loadAndParseCSS(file.path, ':root'),
    };
  });

  const dictionary = parsedFiles.reduce((list, dict) => ({ ...list, ...dict.content }), {});

  for (const file of parsedFiles) {
    const processedFile = replaceVariables(file.content, dictionary);
    await exportToCss(processedFile, ':root', file.path.replace('css', path));
  }

  // export all the above in a barrel file (`tokens.css`)
  await fse.outputFile(
    `${path}/tokens.css`,
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
  return Object.entries(variables).reduce((collection, [key, value]) => {
    return {
      ...collection,
      [key]: resolve(value, dictionary),
    };
  }, {});
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

// utility function for generating light-dark tokens based on separate light and dark theme classes
function transformLightDark(path) {
  const light = loadAndParseCSS(path, '.ids-theme-light');
  const dark = loadAndParseCSS(path, '.ids-theme-dark');
  return Object.keys(light).reduce((collection, key) => {
    return {
      ...collection,
      [key]: `light-dark(${light[key]}, ${dark[key]})`,
    };
  }, {});
}

// utility function for generating path for the the resolved file
function getResolvedFilePath(filePath) {
  return filePath.replace('css', resolvedFilesPath);
}
