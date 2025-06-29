import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser'
import helmet from 'helmet'

import { MainModule } from './main.module';

const DEFAULT_PORT = 3000;

/**
 * Initializes and starts a NestJS application with specified configurations. This function sets up the server
 * with CORS enabled, configures global request body parsing limits, and applies a global API prefix. It also
 * establishes a validation pipeline for request data and sets up Swagger for API documentation. The application
 * listens on a port defined by an environment variable or a default port if the environment variable is not set.
 * This setup ensures that the application is ready to handle API requests according to defined specifications
 * and validation rules, with documentation accessible for development and testing.
 *
 * @throws {Error} - Captures and logs any errors that occur during the application initialization and setup.
 */
async function bootstrap() {
  const { PORT } = process.env
  const app = await NestFactory.create(MainModule, { cors: true /* , logger: ['log', 'error', 'warn', 'debug', 'verbose', 'fatal'] */ });

  app.use(helmet({
    contentSecurityPolicy: false,
  }))
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    }
  }));

  const config = new DocumentBuilder()
    .setTitle('PagoSeguro | API')
    .setDescription('PagoSeguro')
    .setVersion('1.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(PORT || DEFAULT_PORT);
}

bootstrap().catch(err => {
  console.error('Error during application bootstrap:', err);
})
