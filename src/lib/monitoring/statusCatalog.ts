export type StatusProbe =
  | { kind: 'http'; url: string; expected: 'html' | 'json'; timeoutMs: number }
  | { kind: 'tcp'; host: string; port: number; timeoutMs: number };

export type StatusService = {
  id: string;
  name: string;
  group: 'Sitio principal' | 'Aplicaciones' | 'Infraestructura' | 'Correo';
  critical: boolean;
  probe: StatusProbe;
};

// Fixed destinations only. The API never accepts a target URL or hostname from
// the request, preventing the status endpoint from becoming an SSRF proxy.
export const STATUS_SERVICES: StatusService[] = [
  { id: 'astro', name: 'Sitio ULTIMA MILLA', group: 'Sitio principal', critical: true, probe: { kind: 'http', url: 'http://127.0.0.1:4321/', expected: 'html', timeoutMs: 4000 } },
  { id: 'directus', name: 'Directus CMS', group: 'Infraestructura', critical: true, probe: { kind: 'http', url: 'http://127.0.0.1:8055/server/health', expected: 'json', timeoutMs: 4000 } },
  { id: 'postgres', name: 'PostgreSQL', group: 'Infraestructura', critical: true, probe: { kind: 'tcp', host: '127.0.0.1', port: 5432, timeoutMs: 2500 } },
  { id: 'redis', name: 'Redis', group: 'Infraestructura', critical: false, probe: { kind: 'tcp', host: '127.0.0.1', port: 6379, timeoutMs: 2500 } },
  { id: 'nginx', name: 'Nginx', group: 'Infraestructura', critical: true, probe: { kind: 'tcp', host: '127.0.0.1', port: 80, timeoutMs: 2500 } },
  { id: 'sgi-web', name: 'SGI · acceso', group: 'Aplicaciones', critical: true, probe: { kind: 'http', url: 'https://sgi.ultimamilla.com.ar/auth/login', expected: 'html', timeoutMs: 5000 } },
  { id: 'sgi-app', name: 'SGI · aplicación', group: 'Aplicaciones', critical: true, probe: { kind: 'tcp', host: '127.0.0.1', port: 3001, timeoutMs: 2500 } },
  { id: 'sitrep-web', name: 'SITREP · aplicación', group: 'Aplicaciones', critical: true, probe: { kind: 'http', url: 'https://sitrep.ultimamilla.com.ar/app/', expected: 'html', timeoutMs: 5000 } },
  { id: 'sitrep-api', name: 'SITREP · API', group: 'Aplicaciones', critical: true, probe: { kind: 'http', url: 'https://sitrep.ultimamilla.com.ar/api/health', expected: 'json', timeoutMs: 5000 } },
  { id: 'sitrep-app', name: 'SITREP · servicio', group: 'Aplicaciones', critical: true, probe: { kind: 'tcp', host: '127.0.0.1', port: 3002, timeoutMs: 2500 } },
  { id: 'dge-web', name: 'DGE · acceso', group: 'Aplicaciones', critical: true, probe: { kind: 'http', url: 'https://www.ultimamilla.com.ar/dge/login', expected: 'html', timeoutMs: 5000 } },
  { id: 'dge-bridge-login', name: 'DGE · puente de acceso', group: 'Aplicaciones', critical: true, probe: { kind: 'tcp', host: '127.0.0.1', port: 18191, timeoutMs: 2500 } },
  { id: 'dge-bridge-app', name: 'DGE · puente de aplicación', group: 'Aplicaciones', critical: true, probe: { kind: 'tcp', host: '127.0.0.1', port: 18192, timeoutMs: 2500 } },
  { id: 'arca-web', name: 'Plantilla ARCA', group: 'Aplicaciones', critical: false, probe: { kind: 'http', url: 'https://www.ultimamilla.com.ar/plantilla-arca/', expected: 'html', timeoutMs: 5000 } },
  { id: 'aceite-web', name: 'UMBot · Aceite', group: 'Aplicaciones', critical: false, probe: { kind: 'http', url: 'https://www.umbot.com.ar/aceite/', expected: 'html', timeoutMs: 5000 } },
  { id: 'plan-web', name: 'UMBot · Plan', group: 'Aplicaciones', critical: false, probe: { kind: 'http', url: 'https://www.umbot.com.ar/plan/', expected: 'html', timeoutMs: 5000 } },
  { id: 'wiki-web', name: 'Wiki · Alcance', group: 'Aplicaciones', critical: false, probe: { kind: 'http', url: 'https://wiki.ultimamilla.com.ar/wiki/Alcance', expected: 'html', timeoutMs: 5000 } },
  { id: 'vecino-web', name: 'Vecino Rabioso · acceso', group: 'Aplicaciones', critical: false, probe: { kind: 'http', url: 'https://vecinorabioso.com.ar/login', expected: 'html', timeoutMs: 5000 } },
  { id: 'vivero-web', name: 'Vivero · acceso', group: 'Aplicaciones', critical: false, probe: { kind: 'http', url: 'https://viveroloscocos.com.ar/ingre', expected: 'html', timeoutMs: 5000 } },
  { id: 'gestion-web', name: 'Gestión Vivero', group: 'Aplicaciones', critical: false, probe: { kind: 'http', url: 'https://gestion.viveroloscocos.com.ar/', expected: 'html', timeoutMs: 5000 } },
  { id: 'smtp-local', name: 'SMTP local', group: 'Correo', critical: false, probe: { kind: 'tcp', host: '127.0.0.1', port: 25, timeoutMs: 2500 } },
  { id: 'smtp-vivero', name: 'SMTP Vivero', group: 'Correo', critical: false, probe: { kind: 'tcp', host: '68.168.218.28', port: 587, timeoutMs: 3500 } },
];

export const STATUS_GROUPS = ['Sitio principal', 'Aplicaciones', 'Infraestructura', 'Correo'] as const;
