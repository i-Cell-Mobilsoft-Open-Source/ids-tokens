import { loadAndParseCSS, exportToCss } from './cssParser.mjs';

export function splitComponentTokens(path) {
  const componentTokens = loadAndParseCSS(`${path}/component.css`, ':root');
  const tokensByType = splitByType(componentTokens);

  Object.entries(tokensByType).forEach(async ([key, value]) => {
    const filePath = `${path}/${key}.css`;
    await exportToCss(value, ':root', filePath);
  });
}

// utility function for splitting component tokens by type
function splitByType(tokens) {
  const componentTokens = {};
  Object.entries(tokens).forEach(([key, value]) => {
    const match = key.match(/--ids-comp-(.*?)-/)[1];
    if (match) {
      componentTokens[`ids-${match}`] = {
        ...componentTokens[`ids-${match}`],
        [key]: value,
      };
    }
  });
  return componentTokens;
}
