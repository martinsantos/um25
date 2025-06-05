import nodemailer from 'nodemailer';
export { renderers } from '../../renderers.mjs';

const transporter = nodemailer.createTransport({
  host: undefined                         ,
  port: parseInt(undefined                         ),
  secure: true,
  auth: {
    user: undefined                         ,
    pass: undefined                         
  }
});
const post = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({
        message: "Todos los campos son requeridos"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: undefined                             ,
      subject: `Nuevo contacto: ${subject}`,
      html: `
        <h1>Nuevo mensaje de contacto</h1>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message}</p>
      `
    };
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({
      message: "Mensaje enviado exitosamente"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    return new Response(JSON.stringify({
      message: "Error al enviar el mensaje"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  post
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
