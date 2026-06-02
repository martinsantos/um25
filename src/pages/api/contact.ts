import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const MIN_FORM_SECONDS = 4;
const MESSAGE_MIN_LENGTH = 12;
const MESSAGE_MAX_LENGTH = 2400;
const MAX_LINKS = 2;

function processEnv(name: string): string | undefined {
  return typeof process !== 'undefined' ? process.env[name] : undefined;
}

function envValue(name: string): string {
  return processEnv(name) || import.meta.env?.[name] || '';
}

function createTransporter() {
  const host = envValue('SMTP_HOST');
  const port = Number(envValue('SMTP_PORT'));
  const user = envValue('SMTP_USER');
  const pass = envValue('SMTP_PASS');

  if (!host || !Number.isFinite(port) || !user || !pass) {
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function trimString(value: unknown, maxLength: number): string {
  return String(value || '').trim().slice(0, maxLength);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char] || char));
}

function countLinks(message: string): number {
  return (message.match(/https?:\/\/|www\.|\.com\b|\.ar\b/gi) || []).length;
}

function isTooFast(startedAt: unknown): boolean {
  if (!startedAt) {
    return false;
  }

  const startedAtMs = Number(startedAt);
  if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) {
    return true;
  }

  return Date.now() - startedAtMs < MIN_FORM_SECONDS * 1000;
}

function isSpam(data: Record<string, unknown>): boolean {
  const spamKeywords = [
    'viagra',
    'casino',
    'lottery',
    'winner',
    'congratulations',
    'act now',
    'free money',
    'click here',
    'crypto',
    'seo backlinks'
  ];
  const message = trimString(data.message, MESSAGE_MAX_LENGTH).toLowerCase();
  const name = trimString(data.name, 120).toLowerCase();
  const email = trimString(data.email, 140).toLowerCase();

  if (message.length < MESSAGE_MIN_LENGTH) {
    return true;
  }

  if (countLinks(message) > MAX_LINKS) {
    return true;
  }

  if (/^[0-9@#$%^&*()_+=|\\/:;.,!?-]+$/.test(name)) {
    return true;
  }

  if (email.includes('temp') || email.includes('disposable') || email.includes('10minute')) {
    return true;
  }

  return spamKeywords.some((keyword) => message.includes(keyword) || name.includes(keyword));
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  const recentRequests = userRequests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);

  return true;
}

function hasHoneypot(data: Record<string, unknown>): boolean {
  return trimString(data.website, 500).length > 0;
}

function buildEmailHtml(data: {
  name: string;
  email: string;
  company: string;
  message: string;
  timestamp: string;
  ip: string;
}) {
  const companyRow = data.company
    ? `
      <tr>
        <td style="padding:14px 16px;border-top:1px solid #E5E7EB;color:#6B7280;font-size:16px;">Empresa</td>
        <td style="padding:14px 16px;border-top:1px solid #E5E7EB;color:#111827;font-size:16px;font-weight:700;">${escapeHtml(data.company)}</td>
      </tr>`
    : '';

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#FFFFFF;color:#111827;border:1px solid #E5E7EB;">
      <div style="background:#050505;color:#FFFFFF;padding:28px 30px;border-bottom:4px solid #DC2626;">
        <p style="margin:0 0 10px;color:#A3A3A3;font-size:16px;letter-spacing:.08em;text-transform:uppercase;">ULTIMA MILLA</p>
        <h1 style="margin:0;color:#FFFFFF;font-size:28px;line-height:1.18;font-weight:700;">Nueva consulta desde la web</h1>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:14px 16px;color:#6B7280;font-size:16px;">Nombre</td>
          <td style="padding:14px 16px;color:#111827;font-size:16px;font-weight:700;">${escapeHtml(data.name)}</td>
        </tr>
        <tr>
          <td style="padding:14px 16px;border-top:1px solid #E5E7EB;color:#6B7280;font-size:16px;">Email</td>
          <td style="padding:14px 16px;border-top:1px solid #E5E7EB;color:#111827;font-size:16px;font-weight:700;">
            <a href="mailto:${escapeHtml(data.email)}" style="color:#DC2626;text-decoration:none;">${escapeHtml(data.email)}</a>
          </td>
        </tr>
        ${companyRow}
      </table>

      <div style="padding:24px 30px;border-top:1px solid #E5E7EB;">
        <p style="margin:0 0 10px;color:#6B7280;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Mensaje</p>
        <div style="white-space:pre-wrap;color:#111827;font-size:17px;line-height:1.65;">${escapeHtml(data.message)}</div>
      </div>

      <div style="padding:18px 30px;background:#F8FAFC;border-top:1px solid #E5E7EB;color:#64748B;font-size:16px;line-height:1.55;">
        <strong style="color:#111827;">Datos técnicos</strong><br>
        Fecha: ${escapeHtml(data.timestamp)}<br>
        IP: ${escapeHtml(data.ip)}<br>
        Formulario: contacto simplificado White Dossier
      </div>
    </div>
  `;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const clientIP = clientAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(clientIP)) {
      return jsonResponse({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.'
      }, 429);
    }

    let data: Record<string, unknown>;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    }

    if (hasHoneypot(data)) {
      return jsonResponse({
        success: true,
        message: 'Mensaje enviado exitosamente'
      });
    }

    if (isTooFast(data.startedAt)) {
      return jsonResponse({
        success: false,
        message: 'El formulario fue enviado demasiado rápido. Intenta nuevamente.'
      }, 400);
    }

    const rawMessage = String(data.message || '').trim();
    const name = trimString(data.name, 100);
    const email = trimString(data.email, 120).toLowerCase();
    const company = trimString(data.company, 120);
    const message = rawMessage.slice(0, MESSAGE_MAX_LENGTH);

    if (!name || !email || !message) {
      return jsonResponse({
        success: false,
        message: 'Nombre, email y mensaje son campos requeridos.'
      }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({
        success: false,
        message: 'El formato del email no es válido.'
      }, 400);
    }

    if (rawMessage.length > MESSAGE_MAX_LENGTH) {
      return jsonResponse({
        success: false,
        message: 'El mensaje es demasiado extenso.'
      }, 400);
    }

    if (isSpam({ ...data, name, email, message })) {
      return jsonResponse({
        success: false,
        message: 'El mensaje no pasó el filtro antispam. Revisá el contenido e intenta nuevamente.'
      }, 400);
    }

    const sanitizedData = {
      name,
      email,
      company,
      message,
      timestamp: new Date().toISOString(),
      ip: clientIP
    };

    const fromAddress = envValue('SMTP_FROM') || 'martin@ultimamilla.com.ar';

    await createTransporter().sendMail({
      from: `"ULTIMA MILLA web" <${fromAddress}>`,
      to: 'martin@ultimamilla.com.ar',
      replyTo: sanitizedData.email,
      subject: `Consulta web UMSA: ${sanitizedData.company || sanitizedData.name}`,
      html: buildEmailHtml(sanitizedData),
    });

    return jsonResponse({
      success: true,
      message: 'Mensaje enviado exitosamente. Te contactaremos pronto.'
    });
  } catch (error) {
    console.error('[contact] Failed to send contact email:', error instanceof Error ? error.message : 'unknown error');
    return jsonResponse({
      success: false,
      message: 'Error interno del servidor. Intenta nuevamente o contacta por email.'
    }, 500);
  }
};

export const post = POST;
