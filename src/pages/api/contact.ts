import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST,
  port: parseInt(import.meta.env.SMTP_PORT),
  secure: true,
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS,
  },
});

export const post: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    // Validación básica
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({
        message: 'Todos los campos son requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Configuración del correo
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: import.meta.env.CONTACT_EMAIL,
      subject: `Nuevo contacto: ${subject}`,
      html: `
        <h1>Nuevo mensaje de contacto</h1>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message}</p>
      `,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({
      message: 'Mensaje enviado exitosamente'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    return new Response(JSON.stringify({
      message: 'Error al enviar el mensaje'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
