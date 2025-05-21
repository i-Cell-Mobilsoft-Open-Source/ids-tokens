import { cssTokenResolve } from './cssTokenResolve.mjs';
import { generateTailwindTokens } from './tokenToTailwindParser.mjs';
import { splitComponentTokens } from './splitComponentTokens.mjs';

try {
  const resolvedFilesPath = 'css-resolved';
  await cssTokenResolve(resolvedFilesPath);
  splitComponentTokens(`${resolvedFilesPath}/component`);
  generateTailwindTokens(`${resolvedFilesPath}/smc/smc-reference.css`);
} catch (error) {
  console.error('Error in postgenerate script:', error);
}
