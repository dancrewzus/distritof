// import { Injectable } from '@nestjs/common'
// import OpenAI from 'openai';

// import { Utils, HandleErrors } from '../utils/utils';
// import { DayJSAdapter } from './dayjs.adapter';

// @Injectable()
// export class OpenAiAdapter {

//   constructor(
//     private readonly errors: HandleErrors,
//     private readonly dayjs: DayJSAdapter,
//     private readonly utils: Utils,
//   ) {}

//   private openai: OpenAI = null

//   /**
//    * Retrieves an instance of OpenAI. If not already instantiated, it creates a new instance.
//    * @returns The OpenAI instance.
//    */
//   public getEntity = (): OpenAI => {
//     try {
//       if (!this.openai) {
//         this.openai = new OpenAI();
//         console.info('OpenAI instance created');
//       }
//       return this.openai;
//     } catch (error) {
//       this.errors.handleError(`Failed to get OpenAI entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   public generateCompletion = async (openai: OpenAI, context: string) => {
//     const completion = await openai.chat.completions.create({
//       messages: [
//         {
//           role: 'system',
//           content: `Eres un experto en generación de correos. Debes crear el título y contenido del correo basado en la información de un webinar que te enviaré.
//           Hay cuatro tipos de correos: inscripción al webinar, cancelación de inscripción, recordatorio 30 minutos antes del webinar y cancelación del webinar. 
//           Te proporcionaré los datos del usuario, tipo de correo y datos del webinar. El nombre de la aplicación es "Webinar Wizard". La respuesta debe ser en español, 
//           en formato JSON con dos atributos: title y message. El contenido de message debe estar en formato HTML dentro de un div, sin estilos para inyectar en un mail predefinido, 
//           y puede incluir humor basado en el webinar.`,
//         },
//         {
//           role: 'user',
//           content: `Genera un correo para la siguiente información: ${ context }`
//         },
//       ],
//       model: "gpt-3.5-turbo-0125",
//       response_format: { type: "json_object" },
//     });
//     console.log("🚀 ~ OpenAiAdapter ~ publicgenerateCompletion ~ completion:", completion)
//     return JSON.parse(completion.choices[0].message.content)
//   }
// }