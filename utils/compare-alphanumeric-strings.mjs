// Function to extract numeric part from the string
function extractNumber(str) {
  const match = str.match(/\d+/); // Extract the first occurrence of a number
  return match
    ? { original: match[0], parsed: parseInt(match[0], 10) }
    : { original: "0", parsed: 0 }; // Convert the extracted number to an integer
}

// Function to extract non-numeric part from the string
function extractNonNumeric(str) {
  const match = str.match(/^\D+/); // Extract the leading non-digit characters
  return match ? match[0] : ""; // Return the matched non-numeric part or an empty string
}

// Custom comparison function for sorting by non-numeric and numeric parts
export function compareAlphaNumericStrings(a, b) {
  const nonNumericA = extractNonNumeric(a);
  const nonNumericB = extractNonNumeric(b);

  // Compare the non-numeric parts
  if (nonNumericA !== nonNumericB) {
    return nonNumericA.localeCompare(nonNumericB);
  }

  // Non-numeric parts are the same, compare the numeric parts
  const numA = extractNumber(a);
  const numB = extractNumber(b);

  // Numeric value
  if (numA.parsed !== numB.parsed) {
    return Math.sign(numA.parsed - numB.parsed);
  }

  // Numeric converted values are the same, original string should be comared
  if (numA.original !== numB.original) {
    return numA.original.localeCompare(numB.original);
  }

  // Same
  return 0;
}
