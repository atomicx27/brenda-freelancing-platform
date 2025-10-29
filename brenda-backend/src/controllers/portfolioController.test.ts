import supertest from 'supertest';
import app from '../index';

const api = supertest(app);

describe('Portfolio Controller', () => {
  it('should get a user\'s public portfolio', async () => {
    const userId = 'cm0w8nfqr0003t5fvnw7z5s5e';
    const response = await api.get(`/api/portfolio/public/user/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
