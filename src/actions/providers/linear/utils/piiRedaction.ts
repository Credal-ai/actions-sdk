const PII_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: "email" },
  // SSNs: 123-45-6789
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: "ssn" },
  // Credit card numbers: 16 digits, optionally grouped by spaces or hyphens
  { pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g, label: "cc" },
  // US phone numbers: (123) 456-7890 | 123-456-7890 | 123.456.7890 | +1 123 456 7890
  {
    pattern: /(\+1[\s-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}/g,
    label: "phone",
  },
];

export function redactPII(text: string): string {
  let redacted = text;
  for (const { pattern } of PII_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}
