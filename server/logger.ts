// server/logger.ts
export function log(message: string, level: 'info' | 'error' = 'info'): void {
  const time = new Date().toLocaleTimeString('fr-FR');
  const prefix = level === 'error' ? '❌ [error]' : '✅ [express]';
  console.log(`${time} ${prefix} ${message}`);
}
