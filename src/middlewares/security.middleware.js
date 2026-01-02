import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;

    switch (role) {
      case 'admin':
        limit = 20;
        break;
      case 'user':
        limit = 10;
        break;
      case 'guest':
      default:
        limit = 5;
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: 60, // 60 seconds = 1 minute
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    // Each request consumes 1 unit
    const decision = await client.protect(req, { requested: 1 });

    const userAgent = req.headers['user-agent'] || 'Unknown';

    // --- PRIORITY ORDER ---

    // Bots
    if (decision.reason?.isBot()) {
      logger.warn('Bot detected', { ip: req.ip, userAgent });
      // allow but log
    }

    // Shield block (WAF etc.)
    if (decision.reason?.isShield()) {
      logger.warn('Shield blocked request', { ip: req.ip, userAgent });
      return res.status(403).json({
        message: 'Shield blocked request',
      });
    }

    // Rate limit exceeded
    if (decision.reason?.isRateLimit()) {
      logger.warn('Rate limit exceeded', { ip: req.ip, userAgent, role });
      return res.status(429).json({
        message: 'Rate limit exceeded',
      });
    }

    // Any other denial
    if (decision.isDenied()) {
      logger.warn('Request denied', { ip: req.ip, userAgent });
      return res.status(403).json({
        message: 'Request denied',
      });
    }

    // Allowed 🎉
    next();
  } catch (error) {
    logger.error(`Error in security middleware: ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Internal server error, something went wrong' });
  }
};

export default securityMiddleware;
