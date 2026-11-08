/** @param {string} text @param {string[]} [exactSecrets] — mirror scripts/supabase-backup.ps1 Redact-SensitiveLogText */
export function redactSensitiveLogText(text, exactSecrets = []) {
  if (!text) return text;
  let out = text;
  for (const secret of exactSecrets) {
    if (secret) out = out.split(secret).join('<redacted-connection>');
  }
  out = out.replace(/(postgres(ql)?:\/\/)([^:/\s]+):([^@\s]+)@/gi, '$1$3:<redacted>@');
  out = out.replace(/([?&;])(password|pwd)=([^&\s'"]+)/gi, '$1$2=<redacted>');
  out = out.replace(/\b(password|pwd)\s*=\s*'[^']*'/gi, '$1=<redacted>');
  out = out.replace(/\b(password|pwd)\s*=\s*[^\s]+/gi, '$1=<redacted>');
  return out;
}
