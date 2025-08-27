import nodemailer from 'nodemailer';

// Email configuration using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'veloz.colombiahosting.com.co',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test email connection
async function testEmailConnection() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Email features will be disabled.');
    return false;
  }
  
  try {
    console.log('Testing email connection to:', process.env.EMAIL_HOST);
    await transporter.verify();
    console.log('Email server connection successful');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    console.error('Host:', process.env.EMAIL_HOST, 'Port:', process.env.EMAIL_PORT);
    console.error('Make sure SMTP server is accessible from Docker containers');
    return false;
  }
}

// Send welcome email
export async function sendWelcomeEmail(to: string, username: string, referralCode: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured, skipping welcome email');
    return false;
  }
  
  try {
    const mailOptions = {
      from: `"¿De dónde eres? Trivia" <${process.env.EMAIL_USER}>`,
      to,
      subject: '¡Bienvenido a ¿De dónde eres? - Tu cuenta está lista! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">¡Bienvenido ${username}! 🎉</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Tu cuenta en ¿De dónde eres? está lista</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">¡Ya puedes comenzar a jugar!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Ahora tienes acceso a más de <strong>3,000 preguntas culturales</strong> auténticas sobre Cuba y Honduras. 
              Pon a prueba tu conocimiento de slang, tradiciones y cultura de estos increíbles países.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">🎁 Tu código de referido:</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; color: #667eea; border: 2px dashed #667eea;">
                ${referralCode}
              </div>
              <p style="margin-bottom: 0; font-size: 14px; color: #6c757d;">
                Comparte este código con amigos. Cuando complete 3 respuestas correctas, ¡tú recibes una ayuda gratis!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://trivia.cubacoin.org" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                🎮 Comenzar a Jugar
              </a>
            </div>
            
            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
              <h4 style="color: #333; margin-bottom: 10px;">Lo que puedes hacer:</h4>
              <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>🇨🇺 Explora preguntas sobre cultura cubana</li>
                <li>🇭🇳 Descubre tradiciones hondureñas</li>
                <li>🏆 Compite en rankings globales y por país</li>
                <li>👥 Invita amigos y gana ayudas extra</li>
                <li>📚 Aprende slang auténtico y expresiones locales</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>¿De dónde eres? - Trivia Cultural</p>
            <p>Este correo fue enviado porque te registraste en nuestra plataforma.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// Send referral bonus notification
export async function sendReferralBonusEmail(to: string, username: string, referredUsername: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured, skipping referral bonus email');
    return false;
  }
  
  try {
    const mailOptions = {
      from: `"¿De dónde eres? Trivia" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🎁 ¡Has ganado una ayuda extra! Tu amigo se unió al juego',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎁 ¡Felicidades ${username}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Has ganado una ayuda extra</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">¡Tu amigo ${referredUsername} completó 3 respuestas!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Tu referido ha comenzado su aventura cultural y como recompensa, 
              <strong>has recibido 1 ayuda extra</strong> para usar en tus próximos juegos.
            </p>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0; color: #155724;">✨ +1 Ayuda Extra Añadida</h3>
              <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">Ya disponible en tu cuenta</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://trivia.cubacoin.org" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                🎮 Usar Mi Ayuda Extra
              </a>
            </div>
            
            <p style="color: #666; text-align: center; font-size: 14px;">
              ¡Sigue invitando amigos para ganar más ayudas!<br>
              Cada amigo que complete 3 respuestas te da otra ayuda extra.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>¿De dónde eres? - Trivia Cultural</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Referral bonus email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Failed to send referral bonus email:', error);
    return false;
  }
}

// Initialize email system
export async function initializeEmailSystem() {
  console.log('Initializing email system...');
  const isConnected = await testEmailConnection();
  return isConnected;
}

export { transporter };