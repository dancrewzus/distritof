import * as Joi from 'joi';

export const JoiValidationSchema = Joi.object({
  STAGE: Joi.required(),
  // MONGODB
  MONGODB_USER: Joi.required(),
  MONGODB_PASSWORD_DEV: Joi.required(),
  MONGODB_CLUSTER_DEV: Joi.required(),
  MONGODB_NAME_TEST: Joi.required(),
  MONGODB_NAME_DEVELOPMENT: Joi.required(),
  // JSON WEB TOKEN
  JWT_SECRET: Joi.required(),
  JWT_EXPIRES_IN: Joi.required(),
  // CLOUDINARY
  CLOUDINARY_CLOUD_NAME: Joi.required(),
  CLOUDINARY_API_SECRET: Joi.required(),
  CLOUDINARY_API_KEY: Joi.required(),
  // GENERAL
  DEFAULT_LIMIT: Joi.number().default(10),
  PORT: Joi.number().default(3001),
  SUP: Joi.required(),
})