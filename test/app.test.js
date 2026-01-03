import request from 'supertest';
import app from '#src/app.js';
import { describe, it, expect } from '@jest/globals';

describe('API-Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status 200 and a message', async () => {
      const response = await request(app).get('/api/health').expect(200);
      expect(response.body.message).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
  describe('GET /api', () => {
    it('should return API status 200 and a message', async () => {
      const response = await request(app).get('/api').expect(200);
      expect(response.body.message).toBe('API is running');
    });
  });
  describe('GET /nonexistent', () => {
    it('should return 404 and a message', async () => {
      const response = await request(app).get('/nonexistent').expect(404);
      expect(response.body.message).toBe('Not Found');
    });
  });
});
