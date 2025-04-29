/**
 * Token parser designed for interpret design tokens for `tailwind.config.js` to be able to extend default configurations
 */

import fs from 'fs';
import postcss from 'postcss';
import safeParser from 'postcss-safe-parser';

// read file from path and extract data as JS object
const cssData = fs.readFileSync('css/smc/smc-reference.css', 'utf-8');
const data = extract(cssData);

// process tokens
const tailwindTokens = {
  colors: {},
  spacing: {},
  borderRadius: {},
};

Object.keys(data).forEach((key) => {
  if (key.includes('border-radius')) {
    tailwindTokens.borderRadius[`ids-${key.replace(/--ids-smc-reference-|border-radius-/g, '')}`] = `var(${key})`;
  }
  if (key.includes('color')) {
    tailwindTokens.colors[`ids-${key.replace(/--ids-smc-reference-|color-/g, '')}`] = `var(${key})`;
  }
  if (
    key.includes('border-width') ||
    key.includes('gap') ||
    key.includes('padding') ||
    key.includes('size-height') ||
    key.includes('size-width') ||
    key.includes('size-spacing') ||
    key.includes('effects-shadow-blur') ||
    key.includes('effects-shadow-horizontal') ||
    key.includes('effects-shadow-vertical') ||
    key.includes('effects-shadow-spread')
  ) {
    tailwindTokens.spacing[`ids-${key.replace(/--ids-smc-reference-/g, '')}`] = `var(${key})`;
  }
});

// Write the generated tokens to a file
fs.writeFileSync('tailwind/smc-reference.mjs', `module.exports = ${JSON.stringify(tailwindTokens, null, 2)};`);
console.info(`
|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|
|> Tailwind 3.x token classes are generated successfully. <|
|__________________________________________________________|
`);

// utility function for extracting CSS data to a form of JS object
function extract(cssData) {
  const rootVars = {};
  const root = postcss.parse(cssData, { parser: safeParser });
  root.walkRules(':root', (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        rootVars[decl.prop] = decl.value;
      }
    });
  });
  return rootVars;
}