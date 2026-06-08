export default () => ({
  port: parseInt(process.env.BACKEND_PORT ?? '4005', 10),
  adminPinEnabled: process.env.ADMIN_PIN_ENABLED !== 'false',
  jwtSecret: process.env.JWT_SECRET ?? 'dev_secret_change_in_prod',
  defaultPin: process.env.DEFAULT_PIN ?? '1234',
  dbPath: process.env.DB_PATH ?? './data/educmentor.db',
  imagesPath: process.env.IMAGES_PATH ?? './data/images',
  staticPath: process.env.STATIC_PATH ?? './static',
});
