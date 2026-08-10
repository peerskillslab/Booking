// Gemeinsame Inline-Styles der drei Auth-Screens (Login, ForgotPassword,
// ResetPassword). Vorher lag inputStyle byte-identisch in allen dreien.

export const inputStyle = {
  width: '100%', height: 40, padding: '0 12px',
  borderRadius: 9, fontSize: 13.5,
  color: 'var(--psl-text, #1d1d1f)',
  background: 'var(--psl-card-bg, #fff)',
  border: '1px solid var(--psl-hairline, rgba(0,0,0,.09))',
  outline: 'none',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  boxSizing: 'border-box',
};

export const linkBtnStyle = {
  border: 'none', background: 'none', cursor: 'pointer',
  fontSize: 12.5, fontWeight: 600,
  color: 'var(--psl-accent, #466E0E)',
  fontFamily: 'inherit',
};

/**
 * Maps known server error codes to German copy. Unknown codes fall back to a
 * generic message — raw server strings (Postgres constraint texts, HTML from
 * an unhandled error) must never reach the user.
 */
export function authErrorMessage(code) {
  const messages = {
    invalid_credentials: 'E-Mail oder Passwort falsch.',
    email_already_registered: 'Diese E-Mail ist bereits registriert.',
    email_taken: 'Diese E-Mail ist bereits vergeben.',
    'invalid email format': 'Bitte gib eine gültige E-Mail-Adresse ein.',
    'password must be at least 8 characters': 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    'email und password erforderlich': 'Bitte fülle alle Felder aus.',
    'token und password erforderlich': 'Bitte fülle alle Felder aus.',
  };
  return messages[code] || 'Etwas ist schiefgelaufen. Bitte versuche es später erneut.';
}
