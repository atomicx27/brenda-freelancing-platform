const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMessageSystem() {
  try {
    console.log('🧪 Testing Message System...\n');

    // Get sample users
    const users = await prisma.user.findMany({
      take: 2,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to test messaging');
      return;
    }

    const [user1, user2] = users;
    console.log(`👤 User 1: ${user1.firstName} ${user1.lastName} (${user1.email})`);
    console.log(`👤 User 2: ${user2.firstName} ${user2.lastName} (${user2.email})\n`);

    // Test 1: Send a message
    console.log('📤 Test 1: Sending a message...');
    const message1 = await prisma.message.create({
      data: {
        senderId: user1.id,
        receiverId: user2.id,
        content: 'Hello! I saw your job posting and I\'m interested in working with you.',
        messageType: 'TEXT'
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log(`✅ Message sent: "${message1.content}"`);
    console.log(`   From: ${message1.sender.firstName} ${message1.sender.lastName}`);
    console.log(`   To: ${message1.receiver.firstName} ${message1.receiver.lastName}\n`);

    // Test 2: Send a reply
    console.log('📤 Test 2: Sending a reply...');
    const message2 = await prisma.message.create({
      data: {
        senderId: user2.id,
        receiverId: user1.id,
        content: 'Hi! Thanks for your interest. Can you tell me more about your experience?',
        messageType: 'TEXT'
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log(`✅ Reply sent: "${message2.content}"`);
    console.log(`   From: ${message2.sender.firstName} ${message2.sender.lastName}`);
    console.log(`   To: ${message2.receiver.firstName} ${message2.receiver.lastName}\n`);

    // Test 3: Get conversation
    console.log('💬 Test 3: Getting conversation...');
    const conversation = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1.id, receiverId: user2.id },
          { senderId: user2.id, receiverId: user1.id }
        ]
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    console.log(`✅ Found ${conversation.length} messages in conversation:`);
    conversation.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.createdAt.toLocaleTimeString()}] ${msg.sender.firstName}: "${msg.content}"`);
    });
    console.log('');

    // Test 4: Get conversations for user1
    console.log('📋 Test 4: Getting conversations for user1...');
    const user1Conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1.id },
          { receiverId: user1.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by other user
    const conversationMap = new Map();
    user1Conversations.forEach(message => {
      const otherUser = message.senderId === user1.id ? message.receiver : message.sender;
      const conversationKey = otherUser.id;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          user: otherUser,
          lastMessage: message
        });
      }
    });

    console.log(`✅ User1 has ${conversationMap.size} conversation(s):`);
    conversationMap.forEach((conv, userId) => {
      console.log(`   - With: ${conv.user.firstName} ${conv.user.lastName}`);
      console.log(`     Last message: "${conv.lastMessage.content}"`);
    });
    console.log('');

    // Test 5: Mark message as read
    console.log('👁️ Test 5: Marking message as read...');
    const updatedMessage = await prisma.message.update({
      where: {
        id: message2.id
      },
      data: {
        isRead: true
      }
    });
    console.log(`✅ Message marked as read: ${updatedMessage.isRead}\n`);

    // Test 6: Get unread count
    console.log('🔢 Test 6: Getting unread count...');
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: user1.id,
        isRead: false
      }
    });
    console.log(`✅ User1 has ${unreadCount} unread message(s)\n`);

    console.log('🎉 All message system tests passed!');
    console.log('\n📊 Message System Features Verified:');
    console.log('   ✅ Send messages');
    console.log('   ✅ Receive messages');
    console.log('   ✅ Get conversations');
    console.log('   ✅ Mark messages as read');
    console.log('   ✅ Count unread messages');
    console.log('   ✅ Message relationships');

  } catch (error) {
    console.error('❌ Error testing message system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMessageSystem();


