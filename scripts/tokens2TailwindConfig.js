// parseTokens.js

import fs from 'fs';

if (process.argv.length !== 3) {
  console.log('Usage: node tokens2TailwindConfig.js /path/to/tokens.json');
  process.exit(1);
}

// Read the JSON file
const jsonData = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));

// Function to generate Tailwind CSS tokens for colors from JSON data
function generateColorTokens(jsonData) {
  const colorTokens = {};

  // Iterate through the JSON data for colors
  if (jsonData["smc-colors"]) {
    for (const group in jsonData["smc-colors"]) {
      const groupData = jsonData["smc-colors"][group];
      colorTokens[group] = {};

      // Check if the group has subgroups
      if (typeof groupData === 'object') {
        // Iterate through subgroups
        for (const subgroup in groupData) {
          const colors = groupData[subgroup];
          colorTokens[group][subgroup] = {};

          // Iterate through colors in subgroup
          for (const colorKey in colors) {
            const color = colors[colorKey];
            if (color.value !== undefined) {
              colorTokens[group][subgroup][colorKey] = `var(--ids-smc-colors-${group}-${subgroup}-${colorKey})`;
            }
          }
        }
      }

      // Check if the group itself has any colors
      if (Object.keys(groupData).length > 0) {
        for (const colorKey in groupData) {
          const color = groupData[colorKey];
          if (color.value !== undefined) {
            colorTokens[group][colorKey] = `var(--ids-smc-colors-${group}-${colorKey})`;
          }
        }
      }
    }
  }

  return colorTokens;
}

// Function to generate Tailwind CSS tokens for spacing from JSON data
function generateSpacingTokens(jsonData) {
  const spacingTokens = {};

  // Check if smc-reference is present in the JSON data
  if (jsonData["smc-reference"] && jsonData["smc-reference"]["container"]) {
    const containerSizes = jsonData["smc-reference"]["container"]["size"]["width"];

    // Iterate through the container sizes
    for (const sizeKey in containerSizes) {
      spacingTokens[`ids-${sizeKey}`] = `var(--ids-smc-reference-container-size-width-${sizeKey})`;
    }
  }

  return spacingTokens;
}

// Function to generate Tailwind CSS tokens for border radius from JSON data
function generateBorderRadiusTokens(jsonData) {
  const borderRadiusTokens = {};

  // Check if smc-reference is present in the JSON data
  if (jsonData["smc-reference"] && jsonData["smc-reference"]["container"]["border-radius"]) {
    const borderRadiusValues = jsonData["smc-reference"]["container"]["border-radius"];

    // Iterate through the border radius values
    for (const valueKey in borderRadiusValues) {
      borderRadiusTokens[valueKey] = `var(--ids-smc-reference-container-border-radius-${valueKey})`;
    }
  }

  return borderRadiusTokens;
}

// Generate Tailwind CSS tokens for colors, spacing, and border radius
const colorTokens = generateColorTokens(jsonData);
const spacingTokens = generateSpacingTokens(jsonData);
const borderRadiusTokens = generateBorderRadiusTokens(jsonData);

// Combine tokens into a single object
const tailwindTokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  borderRadius: borderRadiusTokens,
};

// Write the generated tokens to a file
fs.writeFileSync('tailwind-tokens.js', `module.exports = ${JSON.stringify(tailwindTokens, null, 2)};`);

console.log("Tailwind tokens generated successfully.");
