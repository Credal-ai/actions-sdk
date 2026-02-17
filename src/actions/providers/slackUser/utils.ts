export function normalizeChannelOperand(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return;

  // Accept inputs like "C123", "#C123", "<#C123>", "<#C123|name>", "general", or "#general"
  const m = s.match(/<#(C[A-Z0-9]+)(?:\|[^>]+)?>/i);
  if (m?.[1]) return `<#${m[1]}>`;

  const stripped = s.replace(/^#/, "");

  if (/^C[A-Z0-9]+$/i.test(stripped)) return `<#${stripped}>`;
  if (/^[a-z0-9._-]+$/i.test(stripped)) return `#${stripped}`;

  return;
}
