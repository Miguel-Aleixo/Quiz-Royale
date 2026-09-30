import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  
  async enviarVerificacaoEmail(
    email: string,
    nome: string,
    token: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL;

    const link = `${frontendUrl}/verificar-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"Quiz Royale" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verifique seu e-mail - Quiz Royale',
        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 30px;
            background: #111827;
            color: white;
            border-radius: 16px;
          ">
            <h1 style="color: #a855f7;">
              Quiz Royale
            </h1>

            <p>
              Olá, <strong>${nome}</strong>!
            </p>

            <p>
              Para poder jogar no Quiz Royale,
              você precisa verificar seu endereço de e-mail.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a
                href="${link}"
                style="
                  display: inline-block;
                  padding: 14px 24px;
                  background: #9333ea;
                  color: white;
                  text-decoration: none;
                  border-radius: 10px;
                  font-weight: bold;
                "
              >
                Verificar meu e-mail
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 13px;">
              Este link expira em 30 minutos.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);

      throw new InternalServerErrorException(
        'Não foi possível enviar o e-mail de verificação.',
      );
    }
  }
}