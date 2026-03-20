/** Password rules for sign-up (and display on auth forms). */

export const PASSWORD_RULE_DEFS = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter (A–Z)",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "One lowercase letter (a–z)",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "number",
    label: "One number (0–9)",
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: "special",
    label: "One special character (!@#$%^&*…)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export function getPasswordRuleResults(password) {
  return PASSWORD_RULE_DEFS.map((r) => ({
    id: r.id,
    label: r.label,
    met: r.test(password || ""),
  }));
}

export function passwordMeetsAllRequirements(password) {
  return PASSWORD_RULE_DEFS.every((r) => r.test(password || ""));
}
