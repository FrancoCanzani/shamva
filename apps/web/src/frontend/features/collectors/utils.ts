export function generateCollectorToken(): string {
  return `shamva_${crypto.randomUUID().replace(/-/g, "")}`;
}
