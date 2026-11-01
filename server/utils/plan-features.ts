export function parsePlanFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((feature) => String(feature).trim()).filter(Boolean);
  }
  if (typeof value !== "string" || !value.trim()) return [];

  const source = value.trim();
  try {
    const parsed: unknown = JSON.parse(source);
    if (Array.isArray(parsed)) return parsed.map((feature) => String(feature).trim()).filter(Boolean);
  } catch {
    // Existing PostgreSQL text-array values use {"feature one","feature two"}.
  }

  const body = source.startsWith("{") && source.endsWith("}")
    ? source.slice(1, -1)
    : source;
  const features: string[] = [];
  let current = "";
  let quoted = false;
  let escaped = false;

  for (const character of body) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      if (current.trim()) features.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) features.push(current.trim());
  return features.filter((feature) => feature.toLowerCase() !== "null");
}

export function serializePlanFeatures(value: unknown): string | null | undefined {
  if (Array.isArray(value)) return JSON.stringify(value.map((feature) => String(feature)));
  if (value === null || value === undefined || typeof value === "string") return value;
  return undefined;
}
