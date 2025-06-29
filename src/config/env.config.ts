const generateDBUri = (user: string, password: string, cluster: string, database: string): string => {
  return `mongodb+srv://${ user }:${ password }@${ cluster }/${ database }?retryWrites=true&w=majority`;
}

export default () => ({
  // OPENAI
  
  openAIApiKey: process.env.OPENAI_API_KEY,
  openAIOrgKey: process.env.OPENAI_ORG_KEY,
  
  // MONGODB

  mongoConnection: process.env.STAGE === 'test' || process.env.STAGE === 'development'
    ? generateDBUri(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD_DEV, process.env.MONGODB_CLUSTER_DEV, '')
    : generateDBUri(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD, process.env.MONGODB_CLUSTER, ''),
  
  mongoConnectionDevelopment: generateDBUri(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD_DEV, process.env.MONGODB_CLUSTER_DEV, process.env.MONGODB_NAME_DEVELOPMENT),
  mongoConnectionTest: generateDBUri(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD_DEV, process.env.MONGODB_CLUSTER_DEV, process.env.MONGODB_NAME_TEST),
  mongoConnectionProduction: generateDBUri(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD, process.env.MONGODB_CLUSTER, process.env.MONGODB_NAME_PROD),
  mongoConnectionBackup: generateDBUri(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD, process.env.MONGODB_CLUSTER, process.env.MONGODB_NAME_BACKUP),

  mongoDatabase: process.env.STAGE === 'test' ? process.env.MONGODB_NAME_TEST : (process.env.STAGE === 'development' ? process.env.MONGODB_NAME_DEVELOPMENT : process.env.MONGODB_NAME_PROD),

  mongoDatabaseDevelopment: process.env.MONGODB_NAME_DEVELOPMENT,
  mongoDatabaseTest: process.env.MONGODB_NAME_TEST,
  mongoDatabaseProduction: process.env.MONGODB_NAME_PROD,
  mongoDatabaseBackup: process.env.MONGODB_NAME_BACKUP,

  // JWT
  
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRES_IN,
  
  // CLOUDINARY
  
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  
  // MAIL
  
  appEmail: process.env.APP_EMAIL,
  appPassword: process.env.APP_PASSWORD,
  resendApiKey: process.env.RESEND_API_KEY,
  
  // STRIPE
  
  stripeApiKey: process.env.STRIPE_API_KEY,
  
  // GENERAL
  
  environment: process.env.STAGE || 'development',
  defaultLimit: process.env.DEFAULT_LIMIT || 100,
  port: process.env.PORT || 3001,
  sup: process.env.SUP,
})