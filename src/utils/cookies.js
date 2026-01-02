import logger from '#config/logger.js';

export const cookies = {
  getOptions: () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  }),

  set: (res, name, value, options = {}) => {
    try {
      res.cookie(name, value, { ...options, ...cookies.getOptions() });
    } catch (error) {
      logger.error(`Error setting cookie: ${error.message}`);
      throw error;
    }
  },

  get: (req, name) => {
    try {
      return req.cookies[name];
    } catch (error) {
      logger.error(`Error getting cookie: ${error.message}`);
      throw error;
    }
  },

  clear: (res, name) => {
    try {
      res.clearCookie(name, { ...cookies.getOptions() });
    } catch (error) {
      logger.error(`Error clearing cookie: ${error.message}`);
      throw error;
    }
  },
};
