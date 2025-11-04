import request from 'supertest';
import { app } from '../src/index';
import prisma from '../src/utils/prisma';
import bcrypt from 'bcryptjs';

jest.setTimeout(30000);

describe('Search API', () => {
  let user1: any;
  let user2: any;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);

    user1 = await prisma.user.create({
      data: {
        email: 'searchuser1@example.com',
        password: hashedPassword,
        firstName: 'Search',
        lastName: 'One',
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: 'searchuser2@example.com',
        password: hashedPassword,
        firstName: 'Search',
        lastName: 'Two',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['searchuser1@example.com', 'searchuser2@example.com'],
        },
      },
    });
  });

  it('should search for users by name', async () => {
    const res = await request(app).get('/api/search/users?query=Search');

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.users).toHaveLength(2);
  });

  it('should search for users by email', async () => {
    const res = await request(app).get(
      '/api/search/users?query=searchuser1@example.com'
    );

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.users[0].id).toBe(user1.id);
  });
});
