import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// Rate limiting (en memoria - para producción usar Redis)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS_PER_WINDOW = 3; // 3 envíos máximo por IP en 15 minutos

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST || '127.0.0.1',  // Usar IPv4 explícitamente
  port: parseInt(import.meta.env.SMTP_PORT) || 25,
  secure: false,  // false para puerto 25/587, true solo para 465
  // Sin autenticación para postfix local
  auth: import.meta.env.SMTP_USER ? {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS,
  } : undefined,
  // Deshabilitar TLS completamente para postfix local
  ignoreTLS: true,
  requireTLS: false,
  // Configuraciones adicionales para postfix local
  connectionTimeout: 5000, // 5 segundos de timeout
  greetingTimeout: 3000,
  socketTimeout: 10000
});

// Función para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para detectar spam básico
function isSpam(data: any): boolean {
  const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations', 'urgent', 'act now', 'free money', 'click here'];
  const message = (data.message || '').toLowerCase();
  const name = (data.name || '').toLowerCase();
  
  // Detectar spam por keywords
  for (const keyword of spamKeywords) {
    if (message.includes(keyword) || name.includes(keyword)) {
      return true;
    }
  }
  
  // Detectar mensajes muy cortos o sospechosos
  if (message.length < 10) {
    return true;
  }
  
  // Detectar nombres sospechosos (solo números o caracteres especiales)
  if (/^[0-9@#$%^&*()]+$/.test(name)) {
    return true;
  }
  
  // Detectar emails sospechosos
  if (data.email && typeof data.email === 'string' && (
    data.email.includes('temp') || 
    data.email.includes('disposable') || 
    data.email.includes('10minute')
  )) {
    return true;
  }
  
  return false;
}

// Función para verificar rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // Filtrar requests dentro del window
  const recentRequests = userRequests.filter((timestamp: number) => 
    now - timestamp < RATE_LIMIT_WINDOW
  );
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  // Actualizar lista de requests
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return true;
}

// Función para agregar honeypot (campo oculto para detectar bots)
function hasHoneypot(data: any): boolean {
  // Si el campo 'website' (honeypot) está lleno, es un bot
  return data.website && data.website.length > 0;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Obtener IP para rate limiting
    const clientIP = clientAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Verificar rate limiting
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.'
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    let data: any;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      // Manejar FormData (desde formularios HTML)
      const formData = await request.formData();
      data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
    }
    
    // Verificar honeypot
    if (hasHoneypot(data)) {
      console.log('Bot detectado por honeypot:', clientIP);
      return new Response(JSON.stringify({
        success: true, // Responder como si fuera exitoso para confundir bots
        message: 'Mensaje enviado exitosamente'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const { name, email, company, phone, projectType, budget, timeline, message } = data;

    // Validación básica
    if (!name || !email || !message) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Nombre, email y mensaje son campos requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validar email
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'El formato del email no es válido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Detectar spam
    if (isSpam(data)) {
      console.log('Spam detectado:', { ip: clientIP, email, name });
      return new Response(JSON.stringify({
        success: false,
        message: 'Mensaje marcado como spam. Revisa el contenido e intenta nuevamente.'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Sanitizar datos
    const sanitizedData = {
      name: String(name).trim().slice(0, 100),
      email: String(email).trim().toLowerCase().slice(0, 100),
      company: String(company || '').trim().slice(0, 100),
      phone: String(phone || '').trim().slice(0, 20),
      projectType: Array.isArray(projectType) ? projectType.slice(0, 5) : [],
      budget: String(budget || '').trim(),
      timeline: String(timeline || '').trim(),
      message: String(message).trim().slice(0, 2000),
      timestamp: new Date().toISOString(),
      ip: clientIP
    };

    // Preparar tipos de proyecto para mostrar
    const projectTypesText = sanitizedData.projectType.length > 0 
      ? sanitizedData.projectType.join(', ') 
      : 'No especificado';

    // Configuración del correo
    const mailOptions = {
      from: '"Ultima Milla web" <martin@ultimamilla.com.ar>',
      to: 'martin@ultimamilla.com.ar',
      replyTo: sanitizedData.email,
      subject: `Nuevo contacto desde web: ${sanitizedData.name} - ${projectTypesText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Nuevo mensaje de contacto</h1>
          
          <h2 style="color: #374151; margin-top: 30px;">Información del cliente:</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; font-weight: bold; background-color: #f3f4f6; border: 1px solid #d1d5db;">Nombre:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${sanitizedData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background-color: #f3f4f6; border: 1px solid #d1d5db;">Email:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;"><a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></td>
            </tr>
            ${sanitizedData.company ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; background-color: #f3f4f6; border: 1px solid #d1d5db;">Empresa:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${sanitizedData.company}</td>
            </tr>
            ` : ''}
            ${sanitizedData.phone ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; background-color: #f3f4f6; border: 1px solid #d1d5db;">Teléfono:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${sanitizedData.phone}</td>
            </tr>
            ` : ''}
          </table>
          
          <h2 style="color: #374151; margin-top: 30px;">Detalles del proyecto:</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; font-weight: bold; background-color: #f3f4f6; border: 1px solid #d1d5db;">Tipo de proyecto:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${projectTypesText}</td>
            </tr>
            ${sanitizedData.budget ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; background-color: #f3f4f6; border: 1px solid #d1d5db;">Presupuesto:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${sanitizedData.budget}</td>
            </tr>
            ` : ''}
            ${sanitizedData.timeline ? `
            <tr>
              <td style="padding: 8px; font-weight: bold; background-color: #f3f4f6; border: 1px solid #d1d5db;">Timeline:</td>
              <td style="padding: 8px; border: 1px solid #d1d5db;">${sanitizedData.timeline}</td>
            </tr>
            ` : ''}
          </table>
          
          <h2 style="color: #374151; margin-top: 30px;">Mensaje:</h2>
          <div style="background-color: #f9fafb; border: 1px solid #d1d5db; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${sanitizedData.message}</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            <strong>Información técnica:</strong><br>
            Fecha: ${sanitizedData.timestamp}<br>
            IP: ${sanitizedData.ip}<br>
            Formulario: Página de contacto web
          </p>
        </div>
      `,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensaje enviado exitosamente. Te contactaremos pronto.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error interno del servidor. Intenta nuevamente o contacta por email.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Mantener compatibilidad con método POST en minúsculas
export const post = POST;
