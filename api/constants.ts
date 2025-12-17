/**
 * Bot detection patterns for identifying automated requests
 * These regex patterns are used to detect bots, crawlers, and automated systems
 */
export const botPatterns = [
  // Search engine bots
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,
  /facebot/i,
  /ia_archiver/i,

  // Social media bots
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,

  // Monitoring and health check tools
  /uptimerobot/i,
  /pingdom/i,
  /newrelic/i,
  /datadog/i,
  /sentry/i,
  /monitor/i,
  /healthcheck/i,
  /health-check/i,
  /uptime/i,

  // Common crawlers
  /crawler/i,
  /spider/i,
  /bot/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /go-http-client/i,
  /java/i,
  /node-fetch/i,
  /axios/i,

  // Headless browsers (often used for automation)
  /headless/i,
  /phantomjs/i,
  /selenium/i,
  /webdriver/i,
  /puppeteer/i,
  /playwright/i,
  /chromium/i,

  // API clients
  /postman/i,
  /insomnia/i,
  /httpie/i,
  /rest-client/i,

  // Vercel and deployment tools
  /vercel/i,
  /vercel-bot/i,
  /vercel-lighthouse/i,

  // Other automation tools
  /zapier/i,
  /ifttt/i,
  /integromat/i,
  /n8n/i,
] as const;
