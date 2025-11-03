import { joinUserGroup, approveJoinRequest } from '../src/controllers/communityController';

// Mock prisma module used by controllers
const mockPrisma: any = {
  userGroupMember: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
  },
  userGroup: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  },
  userGroupJoinRequest: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  },
  groupPost: {
    findUnique: jest.fn()
  },
  groupPostComment: {
    create: jest.fn()
  }
};

// Use an inline factory for the mock to avoid hoisting issues
jest.mock('../src/utils/prisma', () => {
  return { __esModule: true, default: {
    userGroupMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    },
    userGroup: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    userGroupJoinRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    groupPost: { findUnique: jest.fn() },
    groupPostComment: { create: jest.fn() }
  } };
});

// Reuse the same reference for assertions in tests
const mockedPrisma = require('../src/utils/prisma').default as any;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((payload: any) => {
    res.payload = payload;
    return res;
  });
  return res;
};

describe('communityController - groups', () => {
  beforeEach(() => {
    // reset mocks
    jest.clearAllMocks();
  });

  test('joinUserGroup creates a join request when group requires approval', async () => {
    // Arrange
    const req: any = { params: { groupId: 'group1' }, user: { id: 'user1' } };
    const res = makeRes();
    const next = jest.fn();

  mockedPrisma.userGroupMember.findUnique.mockResolvedValue(null);
  mockedPrisma.userGroup.findUnique.mockResolvedValue({ id: 'group1', requiresApproval: true });
  mockedPrisma.userGroupJoinRequest.findUnique.mockResolvedValue(null);
  mockedPrisma.userGroupJoinRequest.create.mockResolvedValue({ id: 'req1', groupId: 'group1', userId: 'user1', status: 'PENDING' });

    // Act
    await joinUserGroup(req, res, next);

    // Assert
  expect(mockedPrisma.userGroupMember.findUnique).toHaveBeenCalled();
  expect(mockedPrisma.userGroup.findUnique).toHaveBeenCalledWith({ where: { id: 'group1' } });
  expect(mockedPrisma.userGroupJoinRequest.create).toHaveBeenCalledWith({ data: { groupId: 'group1', userId: 'user1', status: 'PENDING' } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.payload).toBeDefined();
    expect(res.payload.message).toMatch(/Join request submitted/i);
    expect(res.payload.data.request.id).toBe('req1');
  });

  test('approveJoinRequest approves and creates membership when requested by owner/mod', async () => {
    // Arrange
    const req: any = { params: { groupId: 'group1', requestId: 'req1' }, user: { id: 'owner1' } };
    const res = makeRes();
    const next = jest.fn();

    // isOwnerOrModerator check - actor membership
  mockedPrisma.userGroupMember.findUnique.mockResolvedValueOnce({ id: 'm-owner', role: 'OWNER' });
    // fetch join request
  mockedPrisma.userGroupJoinRequest.findUnique.mockResolvedValue({ id: 'req1', groupId: 'group1', userId: 'user2' });
  // create member
  mockedPrisma.userGroupMember.create.mockResolvedValue({ id: 'm1' });
  mockedPrisma.userGroup.update.mockResolvedValue({});
  mockedPrisma.userGroupJoinRequest.update.mockResolvedValue({ id: 'req1', status: 'APPROVED' });

    // Act
    await approveJoinRequest(req, res, next as any);

    // Assert
  expect(mockedPrisma.userGroupMember.findUnique).toHaveBeenCalled();
  expect(mockedPrisma.userGroupJoinRequest.findUnique).toHaveBeenCalledWith({ where: { id: 'req1' } });
  expect(mockedPrisma.userGroupMember.create).toHaveBeenCalledWith({ data: { groupId: 'group1', userId: 'user2', role: 'MEMBER' } });
  expect(mockedPrisma.userGroup.update).toHaveBeenCalledWith({ where: { id: 'group1' }, data: { memberCount: { increment: 1 } } });
  expect(mockedPrisma.userGroupJoinRequest.update).toHaveBeenCalledWith({ where: { id: 'req1' }, data: { status: 'APPROVED' } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.payload.message).toMatch(/Request approved/i);
  });
});
