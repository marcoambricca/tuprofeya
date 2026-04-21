const { transporter } = require('../config/email');

const sendVerificationEmail = async (email, name, code) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verificá tu cuenta en SuperProfe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">SuperProfe</h1>
        </div>
        <h2 style="color: #1f2937;">Hola ${name}!</h2>
        <p style="color: #4b5563; font-size: 16px;">
          Gracias por registrarte en SuperProfe. Para verificar tu cuenta, usá el siguiente código:
        </p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
          <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #2563eb;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Este código expira en 15 minutos. Si no creaste una cuenta en SuperProfe, ignorá este email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          SuperProfe — Encontrá tu profe ideal
        </p>
      </div>
    `,
  });
};

const sendRequestNotification = async (teacherEmail, teacherName, studentName, subject, message) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: teacherEmail,
    subject: `Nueva solicitud de clase — ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">SuperProfe</h1>
        <h2>Hola ${teacherName}!</h2>
        <p>Tenés una nueva solicitud de chat de <strong>${studentName}</strong> para clases de <strong>${subject}</strong>.</p>
        ${message ? `
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Mensaje del alumno</p>
          <p style="margin: 0; color: #374151; font-style: italic;">"${message}"</p>
        </div>
        ` : ''}
        <p>Ingresá a tu panel para aceptar o rechazar la solicitud.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Ver solicitud
        </a>
      </div>
    `,
  });
};

const sendRequestAccepted = async (studentEmail, studentName, teacherName) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: studentEmail,
    subject: `${teacherName} aceptó tu solicitud`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">SuperProfe</h1>
        <h2>Buenas noticias, ${studentName}!</h2>
        <p><strong>${teacherName}</strong> aceptó tu solicitud. Ya podés empezar a chatear.</p>
        <a href="${process.env.CLIENT_URL}/chats" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Ir al chat
        </a>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendRequestNotification, sendRequestAccepted };
