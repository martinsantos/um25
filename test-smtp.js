import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'santosma@gmail.com',
    pass: 'pwrxasnjzdipbrml'
  }
});

console.log('Probando conexión SMTP con santosma@gmail.com...');

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Error de conexión:', error);
  } else {
    console.log('✅ Servidor listo para enviar mensajes');
    
    // Intentar enviar
    transporter.sendMail({
      from: 'santosma@gmail.com',
      to: 'santosma@gmail.com',
      subject: 'Test SMTP Directo',
      text: 'Si lees esto, las credenciales funcionan.'
    }, (err, info) => {
      if (err) console.log('❌ Error enviando:', err);
      else console.log('✅ Mensaje enviado:', info.messageId);
    });
  }
});
