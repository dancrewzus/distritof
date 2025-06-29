
import { Injectable } from '@nestjs/common'
import { Resend } from 'resend';

import { User } from 'src/functionalities/users/entities/user.entity'
import { MailsUtil } from '../utils/mails.util'
import envConfig from '../../config/env.config'


@Injectable()
export class MailAdapter {
  
  constructor(
    private readonly mails: MailsUtil,
  ) {
  }

  private initInstance = (): Resend => {
    return new Resend(envConfig().resendApiKey);
  }

  private sendTrack = (error: Error) => {
    // TODO Track in Datadog or Grafana.
    console.log(`🚀 ~ Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return true
  }

  private sendEmail = async (mailOptions: any) => {
    const resend = this.initInstance();
    const { data, error } = await resend.emails.send(mailOptions);
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return data;
  }

  private generateMailOptions = async ({ type, emails, emailResponse }) => {
    const to: string[] = emails
    const listOfEmails = to.map((email: string) => {
      if(email.includes('howarts.magic')) {
        email = 'idepixel@gmail.com'
      }
      return email
    })

    let html = null

    switch (type) {
      case 'user-validation-code':
        html = this.mails.validationCodeEmail({
          ...emailResponse
        })
        break;
      
      case 'recovery-password-code':
        html = this.mails.recoveryCodeEmail({
          ...emailResponse
        })
        break;
      
      case 'password-changed':
        html = this.mails.passwordChanged({
          ...emailResponse
        })
        break;
    
      default: break;
    }

    return {
      from: 'Pago Seguro <contacto@idepixel.cl>',
      subject: emailResponse.title || '',
      html,
      to: listOfEmails,
    };
  }

  public sendValidationCode = async (user: User) => {
    try {
      const { firstName, paternalSurname, email, validationCode } = user
      const mailOptions = await this.generateMailOptions({
        type: 'user-validation-code',
        emails: [ email ],
        emailResponse: {
          title: 'Código de validación de usuario.',
          firstName,
          paternalSurname,
          validationCode,
        }
      })
      await this.sendEmail(mailOptions)
      return
    } catch (error) {
      this.sendTrack(error)
    }
  }
  
  public sendRecoveryPasswordCode = async (user: User) => {
    try {
      const { firstName, paternalSurname, email, recoveryCode } = user
      const mailOptions = await this.generateMailOptions({
        type: 'recovery-password-code',
        emails: [ email ],
        emailResponse: {
          title: 'Código de recuperación de contraseña.',
          firstName,
          paternalSurname,
          recoveryCode,
        }
      })
      await this.sendEmail(mailOptions)
      return
    } catch (error) {
      this.sendTrack(error)
    }
  }
  
  public sendPasswordChanged = async (user: User) => {
    try {
      const { firstName, paternalSurname, email } = user
      const mailOptions = await this.generateMailOptions({
        type: 'password-changed',
        emails: [ email ],
        emailResponse: {
          title: 'La contraseña ha sido modificada exitosamente.',
          firstName,
          paternalSurname,
        }
      })
      await this.sendEmail(mailOptions)
      return
    } catch (error) {
      this.sendTrack(error)
    }
  }
}