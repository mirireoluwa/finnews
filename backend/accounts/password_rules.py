"""Match client-side password rules (see client/src/utils/passwordRules.js)."""


def password_meets_all_requirements(password: str) -> bool:
  if not password or len(password) < 8:
    return False
  if not any(c.isupper() for c in password):
    return False
  if not any(c.islower() for c in password):
    return False
  if not any(c.isdigit() for c in password):
    return False
  if all(c.isalnum() for c in password):
    return False
  return True
