// Function to extract numeric part from the string
function extractNumber(str) {
  const match = str.match(/\d+/); // Extract the first occurrence of a number
  return match ? [parseInt(match[0], 10), match[0]] : [0, 0]; // Convert the extracted number to an integer
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
  if (nonNumericA < nonNumericB) {
    return -1;
  }
  if (nonNumericA > nonNumericB) {
    return 1;
  }

  // Non-numeric parts are the same, compare the numeric parts
  const numA = extractNumber(a);
  const numB = extractNumber(b);

  // Numeric value, and A < B
  if (numA[0] < numB[0]) {
    return -1;
  }
  // Numeric value, A > B
  if (numA[0] > numB[0]) {
    return 1;
  }
  // Numeric converted values are the same, original string should be comared, A < B
  if (numA[1] < numB[1]) {
    return -1;
  }
  // Numeric converted values are the same, original string should be comared, A > B
  if (numA[1] > numB[1]) {
    return 1;
  }

  // Same
  return 0;
}
