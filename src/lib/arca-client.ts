/**
 * ARCA Client - Cliente HTTP TypeScript para la API de generación de comprobantes AFIP
 *
 * Proporciona métodos para:
 * - Generar PDFs de comprobantes (facturas, notas de crédito, etc.)
 * - Enviar comprobantes por email
 * - Obtener CAE (Código de Autorización Electrónica) de AFIP
 *
 * Uso:
 * ```typescript
 * import arcaClient, { type GeneratePDFRequest } from '@/lib/arca-client';
 *
 * const response = await arcaClient.generatePDF({
 *   cuit: "20123456789",
 *   razon_social: "Mi Empresa",
 *   // ... resto de datos
 * });
 *
 * if (response.ok) {
 *   console.log("PDF generated:", response.pdf_url);
 * } else {
 *   console.error("Error:", response.error);
 * }
 * ```
 */

/**
 * Solicitud para generar un PDF de comprobante
 */
export interface GeneratePDFRequest {
  cuit: string;
  razon_social: string;
  domicilio: string;
  condicion_iva: string;
  tipo_comprobante: string;
  fecha_emision: string;
  descripcion: string;
  importe_total: number;
  logo_url?: string;
}

/**
 * Respuesta de la solicitud de generación de PDF
 */
export interface GeneratePDFResponse {
  ok: boolean;
  pdf_url?: string;
  cae?: string;
  vencimiento_cae?: string;
  error?: string;
}

/**
 * Solicitud para enviar un comprobante por email
 */
export interface SendEmailRequest {
  email_destino: string;
  pdf_path: string;
  empresa: string;
}

/**
 * Respuesta de la solicitud de envío de email
 */
export interface SendEmailResponse {
  ok: boolean;
  mensaje?: string;
  error?: string;
}

/**
 * Solicitud para obtener CAE de AFIP
 */
export interface GetCAERequest {
  cuit: string;
  importe: number;
  tipo_comprobante: string;
  ambiente: 'homologacion' | 'produccion';
}

/**
 * Respuesta de la solicitud de CAE
 */
export interface GetCAEResponse {
  ok: boolean;
  cae?: string;
  vencimiento?: string;
  numero_comprobante?: string;
  error?: string;
}

/**
 * Cliente HTTP para la API ARCA
 *
 * Proporciona métodos para interactuar con los endpoints:
 * - POST /api/arca/generate-pdf
 * - POST /api/arca/send-email
 * - POST /api/arca/get-cae
 *
 * Todas las respuestas se retornan como objetos con ok: boolean
 * Nunca lanzan excepciones, los errores se retornan en la respuesta
 */
class ArcaClient {
  private baseUrl: string;
  private timeout: number = 30000; // 30 segundos por defecto

  /**
   * Constructor
   * @param baseUrl - URL base para los endpoints (default: '/api/arca')
   * @param timeout - Timeout en ms para las solicitudes (default: 30000)
   */
  constructor(baseUrl: string = '/api/arca', timeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Realiza un fetch con timeout
   * @param url - URL a la que hacer la solicitud
   * @param options - Opciones de fetch
   * @returns Promesa con la respuesta
   * @throws Error si hay timeout o error de red
   */
  private async _fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Realiza un fetch JSON con manejo de errores unificado
   * @param url - URL a la que hacer la solicitud
   * @param data - Datos a enviar
   * @returns Promesa con el JSON parseado
   * @throws Error si hay problema de conexión o timeout
   */
  private async _fetchJSON<T>(url: string, data: unknown): Promise<T> {
    const response = await this._fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP ${response.status}: ${
          (errorData as any).error || response.statusText
        }`
      );
    }

    return response.json();
  }

  /**
   * Genera un PDF de comprobante AFIP
   *
   * @param data - Datos del comprobante a generar
   * @returns Promesa con la respuesta (ok: true si tiene pdf_url, ok: false si hay error)
   */
  async generatePDF(
    data: GeneratePDFRequest
  ): Promise<GeneratePDFResponse> {
    try {
      const result = await this._fetchJSON<GeneratePDFResponse>(
        `${this.baseUrl}/generate-pdf`,
        data
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Envía un comprobante por email
   *
   * @param data - Datos para enviar el comprobante
   * @returns Promesa con la respuesta (ok: true si se envió, ok: false si hay error)
   */
  async sendEmail(data: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const result = await this._fetchJSON<SendEmailResponse>(
        `${this.baseUrl}/send-email`,
        data
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Obtiene el CAE (Código de Autorización Electrónica) de AFIP
   *
   * @param data - Datos para obtener el CAE (incluye ambiente: homologacion o produccion)
   * @returns Promesa con la respuesta (ok: true si tiene CAE, ok: false si hay error)
   */
  async getCAE(data: GetCAERequest): Promise<GetCAEResponse> {
    try {
      const result = await this._fetchJSON<GetCAEResponse>(
        `${this.baseUrl}/get-cae`,
        data
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: errorMessage,
      };
    }
  }
}

/**
 * Instancia singleton de ArcaClient
 * Se exporta por defecto para usar en toda la aplicación
 */
const arcaClient = new ArcaClient();

export default arcaClient;
export { ArcaClient };
