# Group Management Implementation

## Overview
Implemented comprehensive group owner controls allowing creators to manage their groups effectively.

## Backend Changes

### Database Schema (`prisma/schema.prisma`)

#### New Model: GroupBannedUser
```prisma
model GroupBannedUser {
  id        String    @id @default(cuid())
  groupId   String
  userId    String
  reason    String?
  bannedBy  String
  bannedAt  DateTime  @default(now())
  
  group     UserGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([groupId, userId])
  @@map("group_banned_users")
}
```

#### Updated Relations
- `UserGroup`: Added `bannedUsers GroupBannedUser[]`
- `User`: Added `bannedFromGroups GroupBannedUser[]`

### New API Endpoints (`controllers/communityController.ts`)

#### 1. Delete Group (Owner Only)
**Endpoint**: `DELETE /api/community/groups/:slug`
**Authorization**: Owner only
**Behavior**: 
- Verifies user is group owner (group.createdBy === userId)
- Deletes entire group with cascade to all members, posts, comments, banned users

#### 2. Ban User from Group (Owner Only)
**Endpoint**: `POST /api/community/groups/:slug/ban/:userId`
**Body**: `{ reason?: string }`
**Authorization**: Owner only
**Behavior**:
- Prevents owner from banning themselves
- Checks for existing ban
- Removes user from group if member
- Creates GroupBannedUser record
- Decrements memberCount

#### 3. Unban User (Owner Only)
**Endpoint**: `DELETE /api/community/groups/:slug/ban/:userId`
**Authorization**: Owner only
**Behavior**:
- Finds and removes ban record
- User can now rejoin group

#### 4. Get Banned Users List (Owner Only)
**Endpoint**: `GET /api/community/groups/:slug/banned-users`
**Authorization**: Owner only
**Returns**:
```json
{
  "status": "success",
  "data": {
    "bannedUsers": [
      {
        "id": "ban_id",
        "groupId": "group_id",
        "userId": "user_id",
        "reason": "Spam",
        "bannedBy": "owner_id",
        "bannedAt": "2024-01-01T00:00:00Z",
        "user": {
          "id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "url"
        }
      }
    ]
  }
}
```

### Updated Endpoints

#### Join Group Check
**Updated**: `POST /api/community/groups/:groupId/join`
**New Behavior**: Checks if user is banned before allowing join
```typescript
// Check if user is banned from this group
const isBanned = await prisma.groupBannedUser.findUnique({
  where: { groupId_userId: { groupId, userId } }
});

if (isBanned) {
  throw createError('You are banned from this group', 403);
}
```

## Routes (`routes/community.ts`)

Added authenticated routes:
```typescript
// Group management (owner only)
router.delete('/groups/:slug', deleteUserGroup);
router.post('/groups/:slug/ban/:userId', banUserFromGroup);
router.delete('/groups/:slug/ban/:userId', unbanUserFromGroup);
router.get('/groups/:slug/banned-users', getGroupBannedUsers);
```

## Business Rules

### Authorization
- Only group owner can delete group
- Only group owner can ban/unban users
- Only group owner can view banned users list
- Owner cannot ban themselves

### Banning Logic
1. Check if user already banned (prevent duplicates)
2. Remove user from group if they're a member
3. Decrement memberCount
4. Create ban record with optional reason
5. Banned users cannot rejoin group

### Deletion Logic
- Group deletion cascades to:
  - UserGroupMember (all members)
  - GroupPost (all posts)
  - GroupPostComment (all comments)
  - GroupBannedUser (all ban records)
  - UserGroupJoinRequest (all join requests)

## Frontend Implementation (TODO)

### Group Card Component
- [ ] Show owner badge for group creator
- [ ] Add dropdown menu with "Manage Group" option (owner only)
- [ ] Add "Delete Group" button with confirmation modal

### Group Detail Page
- [ ] Add "Manage Members" button (owner only)
- [ ] Create ManageGroupMembersModal component
- [ ] Show member list with role badges
- [ ] Add "Remove" and "Ban" buttons per member
- [ ] Add "Banned Users" tab showing list with Unban button
- [ ] Add confirmation dialogs for destructive actions

### Member List Features
```jsx
<ManageGroupMembersModal>
  <Tabs>
    <Tab name="Members">
      {members.map(member => (
        <MemberRow>
          <UserAvatar />
          <UserName />
          <RoleBadge /> {/* OWNER/MODERATOR/MEMBER */}
          {member.id !== ownerId && (
            <>
              <RemoveButton onClick={() => removeUser(member.id)} />
              <BanButton onClick={() => openBanModal(member.id)} />
            </>
          )}
        </MemberRow>
      ))}
    </Tab>
    
    <Tab name="Banned Users">
      {bannedUsers.map(ban => (
        <BannedUserRow>
          <UserAvatar />
          <UserName />
          <BanReason>{ban.reason}</BanReason>
          <BanDate>{ban.bannedAt}</BanDate>
          <UnbanButton onClick={() => unbanUser(ban.userId)} />
        </BannedUserRow>
      ))}
    </Tab>
  </Tabs>
</ManageGroupMembersModal>
```

### API Service Functions
```javascript
// communityService.js
export const deleteGroup = async (slug) => {
  return api.delete(`/community/groups/${slug}`);
};

export const banUserFromGroup = async (slug, userId, reason) => {
  return api.post(`/community/groups/${slug}/ban/${userId}`, { reason });
};

export const unbanUserFromGroup = async (slug, userId) => {
  return api.delete(`/community/groups/${slug}/ban/${userId}`);
};

export const getGroupBannedUsers = async (slug) => {
  return api.get(`/community/groups/${slug}/banned-users`);
};
```

## Testing Checklist

### Backend
- [x] Database table created (group_banned_users)
- [x] Prisma client generated with new model
- [x] Server starts without errors
- [ ] Test delete group endpoint
- [ ] Test ban user endpoint (prevents rejoin)
- [ ] Test unban user endpoint
- [ ] Test banned users list endpoint
- [ ] Test non-owner authorization (should fail)
- [ ] Test owner cannot ban themselves

### Frontend
- [ ] Owner sees "Manage Group" menu
- [ ] Non-owner does NOT see "Manage Group" menu
- [ ] Delete group shows confirmation
- [ ] Delete group removes from list
- [ ] Ban user removes from members
- [ ] Banned user cannot rejoin
- [ ] Unban user allows rejoin
- [ ] Banned users list shows all bans with reasons

## Security Considerations

1. **Owner Verification**: All endpoints verify `group.createdBy === req.user.id`
2. **Self-Ban Prevention**: Owner cannot ban themselves
3. **Cascade Deletion**: Group deletion properly cleans up all related records
4. **Ban Persistence**: Banned users tracked in separate table, not just membership removal
5. **Unique Constraint**: `@@unique([groupId, userId])` prevents duplicate bans

## Database Migration

```bash
cd brenda-backend
npx prisma db push
```

Status: ✅ Completed - Table created successfully

## Next Steps

1. ✅ Create backend endpoints
2. ✅ Add routes
3. ✅ Run database migration
4. ✅ Test server startup
5. [ ] Create frontend components
6. [ ] Update GroupCard component
7. [ ] Create ManageGroupMembersModal
8. [ ] Add ban/unban UI
9. [ ] Add confirmation modals
10. [ ] Test complete flow end-to-end
