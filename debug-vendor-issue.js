const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugVendorIssue() {
  const userId = 'cmg1nbbk90000jv5w2aua7hgm';
  
  console.log('🔍 Debugging vendor verification issue for user:', userId);
  console.log('=' .repeat(60));
  
  try {
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        type: true,
        created_at: true 
      }
    });
    
    console.log('1️⃣ User exists:', user ? '✅ YES' : '❌ NO');
    if (user) {
      console.log('   User details:', user);
    }
    
    // 2. Check vendor verification record
    const verification = await prisma.vendorVerification.findUnique({
      where: { user_id: userId }
    });
    
    console.log('\n2️⃣ Vendor verification record exists:', verification ? '✅ YES' : '❌ NO');
    if (verification) {
      console.log('   Verification details:', {
        id: verification.id,
        status: verification.status,
        created_at: verification.created_at
      });
    }
    
    // 3. Check user documents
    const documents = await prisma.userDocument.findMany({
      where: { 
        user_id: userId,
        deleted_at: null 
      }
    });
    
    console.log('\n3️⃣ User documents count:', documents.length);
    if (documents.length > 0) {
      console.log('   Documents:', documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        created_at: doc.created_at
      })));
    }
    
    // 4. Check if there are ANY vendor verification records
    const allVerifications = await prisma.vendorVerification.findMany({
      select: { 
        id: true, 
        user_id: true, 
        status: true, 
        created_at: true 
      }
    });
    
    console.log('\n4️⃣ Total vendor verification records in database:', allVerifications.length);
    if (allVerifications.length > 0) {
      console.log('   All verifications:', allVerifications);
    }
    
    // 5. Check if there are ANY users with type 'vendor'
    const vendorUsers = await prisma.user.findMany({
      where: { type: 'vendor' },
      select: { id: true, name: true, email: true, type: true }
    });
    
    console.log('\n5️⃣ Users with type "vendor":', vendorUsers.length);
    if (vendorUsers.length > 0) {
      console.log('   Vendor users:', vendorUsers);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugVendorIssue();
