import fse from 'fs-extra';
import postcss from 'postcss';
import safeParser from 'postcss-safe-parser';

// utility function for loading and parsing CSS data to JS object
const loadAndParseCSS = (path, selector) => {
  const cssData = fse.readFileSync(path, 'utf-8');
  const parsedData = {};
  const root = postcss.parse(cssData, { parser: safeParser });
  root.walkRules(selector, (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        parsedData[decl.prop] = decl.value;
      }
    });
  });
  return parsedData;
};

// utility function for writing CSS data (JS object) to CSS file
const exportToCss = async (data, selector, targetPath) => {
  const rule = postcss.rule({ selector: selector });

  for (const [prop, value] of Object.entries(data)) {
    rule.append({ prop, value });
  }

  const root = postcss.root();
  const cssData = root.append(rule).toString();
  await fse.outputFile(targetPath, cssData, 'utf-8');
};

export { loadAndParseCSS, exportToCss };
