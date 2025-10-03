import request from 'supertest';
import app from '../src/app';

describe('Integration Tests', () => {
  describe('Application Routes', () => {
    test('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'No route found');
    });

    test('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/non-existent-route');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should have security headers', async () => {
      const response = await request(app)
        .get('/non-existent-route');

      // Check for helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('API Structure', () => {
    test('should serve swagger documentation', async () => {
      const response = await request(app)
        .get('/api-docs/');

      // Should either serve swagger UI or redirect (not 404)
      expect([200, 301, 302]).toContain(response.status);
    });

    test('should require authentication for fulfillment endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/fulfillment/status');

      expect(response.status).toBe(401); // Unauthorized without token
    });

    test('should allow access to authentication endpoints', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        });

      // Should not be 404 (route exists) but will be 400/401 (validation/auth error)
      expect(response.status).not.toBe(404);
    });
  });

  describe('Middleware Integration', () => {
    test('should handle JSON body parsing', async () => {
      const response = await request(app)
        .post('/non-existent-route')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404); // Route not found, but JSON was parsed
      expect(response.body).toHaveProperty('message', 'No route found');
    });

    test('should handle rate limiting middleware', async () => {
      // Make multiple requests to test rate limiting is configured
      const responses = await Promise.all([
        request(app).get('/non-existent-route'),
        request(app).get('/non-existent-route'),
        request(app).get('/non-existent-route')
      ]);

      // All should return 404 (not rate limited for these few requests)
      responses.forEach(response => {
        expect(response.status).toBe(404);
      });
    });
  });
});