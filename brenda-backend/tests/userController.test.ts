import request from 'supertest';
import { app } from '../src/index';
import prisma from '../src/utils/prisma';

import bcrypt from 'bcryptjs';

jest.setTimeout(30000);

describe('User API', () => {
  let user: any;
  let token: string;

  beforeAll(async () => {
    // Hash password and create a user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);

    user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password',
      });
    token = res.body.token;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['blockeduser@example.com', 'unblockeduser@example.com'],
        },
      },
    });
    await prisma.blockedUser.deleteMany({});
  });

  it('should get a public user profile', async () => {
    const res = await request(app)
      .get(`/api/users/${user.id}/profile`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(user.id);
    expect(res.body.data.firstName).toBe('Test');
    expect(res.body.data.lastName).toBe('User');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should block another user', async () => {
    const userToBlock = await prisma.user.create({
      data: {
        email: 'blockeduser@example.com',
        password: 'password',
        firstName: 'Blocked',
        lastName: 'User',
      },
    });

    const res = await request(app)
      .post(`/api/users/block/${userToBlock.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');

    await prisma.user.delete({ where: { id: userToBlock.id } });
  });

  it('should unblock a user', async () => {
    const userToBlock = await prisma.user.create({
      data: {
        email: 'unblockeduser@example.com',
        password: 'password',
        firstName: 'Unblocked',
        lastName: 'User',
      },
    });

    await prisma.blockedUser.create({
      data: {
        blockerId: user.id,
        blockedId: userToBlock.id,
      },
    });

    const res = await request(app)
      .delete(`/api/users/unblock/${userToBlock.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');

    await prisma.user.delete({ where: { id: userToBlock.id } });
  });
});
