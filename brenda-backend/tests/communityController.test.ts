import request from 'supertest';
import { app } from '../src/index';
import prisma from '../src/utils/prisma';
import bcrypt from 'bcryptjs';

jest.setTimeout(30000);

describe('Community API', () => {
  let user1: any;
  let user2: any;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);

    user1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        password: hashedPassword,
        firstName: 'User',
        lastName: 'One',
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        password: hashedPassword,
        firstName: 'User',
        lastName: 'Two',
      },
    });

    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'password' });
    token1 = res1.body.token;

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@example.com', password: 'password' });
    token2 = res2.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['user1@example.com', 'user2@example.com'],
        },
      },
    });
  });

  describe('Social Connections', () => {
    afterEach(async () => {
      await prisma.socialConnection.deleteMany({});
    });

    it('should send a connection request', async () => {
      const res = await request(app)
        .post('/api/community/social/connect')
        .set('Authorization', `Bearer ${token1}`)
        .send({ connectedUserId: user2.id });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.connection.status).toBe('PENDING');
    });

    it('should accept a connection request', async () => {
      const connReq = await prisma.socialConnection.create({
        data: {
          userId: user1.id,
          connectedUserId: user2.id,
          status: 'PENDING',
        },
      });

      const res = await request(app)
        .post(`/api/community/social/connections/${connReq.id}/accept`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.connection.status).toBe('ACCEPTED');
    });

    it('should remove a connection', async () => {
      await prisma.socialConnection.create({
        data: {
          userId: user1.id,
          connectedUserId: user2.id,
          status: 'ACCEPTED',
        },
      });

      const res = await request(app)
        .delete(`/api/community/social/connections/${user2.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
    });

    it('should reject a connection request', async () => {
      const connReq = await prisma.socialConnection.create({
        data: {
          userId: user1.id,
          connectedUserId: user2.id,
          status: 'PENDING',
        },
      });

      const res = await request(app)
        .delete(`/api/community/social/connections/${connReq.id}/reject`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
    });

    it('should get pending connection requests', async () => {
      await prisma.socialConnection.create({
        data: {
          userId: user1.id,
          connectedUserId: user2.id,
          status: 'PENDING',
        },
      });

      const res = await request(app)
        .get('/api/community/social/connections/pending')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.connections).toHaveLength(1);
      expect(res.body.data.connections[0].user.id).toBe(user1.id);
    });
  });
});
