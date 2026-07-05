export default () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "",
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY ?? "",
    clientId: process.env.MERCADO_PAGO_CLIENT_ID ?? "",
    clientSecret: process.env.MERCADO_PAGO_CLIENT_SECRET ?? "",
    webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "",
    // URL pública do backend que recebe o redirect do OAuth (deve ser cadastrada no painel do app Mercado Pago).
    oauthRedirectUri: process.env.MERCADO_PAGO_OAUTH_REDIRECT_URI ?? "http://localhost:3000/drivers/mercadopago/callback",
  },
  ride: {
    baseFare: 4.5,
    perKm: 1.75,
    perMin: 0.35,
    matchRadiusKm: 3,
    matchOfferTimeoutSec: 15,
    // Percentual repassado ao motorista via split Pix; o restante fica com a plataforma.
    driverShare: 0.8,
    commissionRate: 0.2,
  },
});
