export const CLI_ANTECEDENTES_FIELDS = 'id,Titulo,Nombre,Descripcion,Cliente,Fecha,slug';
export const CLI_SERVICIOS_FIELDS = 'id,Titulo,Descripcion,slug';
export const PUBLIC_SITE_URL = 'https://www.ultimamilla.com.ar';

export type CliAntecedente = {
  id: number;
  Titulo?: string;
  Nombre?: string;
  Descripcion?: string;
  Cliente?: string;
  Fecha?: string;
  slug?: string;
  title?: string;
  content?: string;
  client?: string;
};

export type CliServicio = {
  id: number;
  Titulo?: string;
  Descripcion?: string;
  slug?: string;
  title?: string;
  description?: string;
};

export type CliQueryParseResult =
  | {
      ok: true;
      query: string;
    }
  | {
      ok: false;
      response: Response;
    };

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getCliDirectusRuntime() {
  const { getDirectusInternalUrl, getDirectusToken } = await import('../config/runtime');
  return {
    directusUrl: getDirectusInternalUrl().replace(/\/$/, ''),
    token: getDirectusToken(),
  };
}

export function getCliDirectusHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function readCliSearchQuery(request: Request): Promise<CliQueryParseResult> {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: jsonResponse(
        {
          error: true,
          message: 'JSON inválido.',
          fallback_commands: ['help', 'servicios', 'antecedentes', 'contacto'],
        },
        400,
      ),
    };
  }

  const rawQuery = body.query;
  if (typeof rawQuery !== 'string') {
    return {
      ok: false,
      response: jsonResponse(
        {
          error: true,
          message: 'Query requerida.',
          fallback_commands: ['help', 'servicios', 'antecedentes', 'contacto'],
        },
        400,
      ),
    };
  }

  const query = rawQuery.trim();
  if (query.length < 2) {
    return {
      ok: false,
      response: jsonResponse(
        {
          error: true,
          message: 'Query muy corta. Mínimo 2 caracteres.',
          fallback_commands: ['help', 'servicios', 'antecedentes', 'contacto'],
        },
        400,
      ),
    };
  }

  if (query.length > 120) {
    return {
      ok: false,
      response: jsonResponse(
        {
          error: true,
          message: 'Query demasiado larga. Máximo 120 caracteres.',
          fallback_commands: ['help', 'servicios', 'antecedentes', 'contacto'],
        },
        400,
      ),
    };
  }

  return { ok: true, query };
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function excerpt(value: string, fallback: string, length: number): string {
  const text = cleanText(value) || fallback;
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function absolutePath(path: string): string {
  return `${PUBLIC_SITE_URL}${path}`;
}

export function antecedenteTitle(item: CliAntecedente): string {
  return cleanText(item.Titulo) || cleanText(item.Nombre) || cleanText(item.title) || `Antecedente ${item.id}`;
}

export function antecedenteDescription(item: CliAntecedente, length = 280): string {
  return excerpt(
    cleanText(item.Descripcion) || cleanText(item.content),
    'Información disponible en el sitio web',
    length,
  );
}

export function antecedenteClient(item: CliAntecedente): string | null {
  return cleanText(item.Cliente) || cleanText(item.client) || null;
}

export function antecedenteUrl(item: CliAntecedente): string {
  const slug = cleanText(item.slug);
  return slug ? absolutePath(`/antecedentes/${slug}`) : absolutePath('/antecedentes');
}

export function servicioTitle(item: CliServicio): string {
  return cleanText(item.Titulo) || cleanText(item.title) || `Servicio ${item.id}`;
}

export function servicioDescription(item: CliServicio, length = 280): string {
  return excerpt(
    cleanText(item.Descripcion) || cleanText(item.description),
    'Servicio profesional disponible',
    length,
  );
}

export function servicioUrl(item: CliServicio): string {
  const slug = cleanText(item.slug);
  return slug ? absolutePath(`/servicios/${item.id}/${slug}`) : absolutePath('/servicios');
}
