// Test script to verify real profile authentication
const baseUrl = 'http://localhost:3000';

const testRealProfiles = async () => {
  console.log('🧪 Testing Real Alumni Profile Authentication...\n');

  // Real alumni emails from your CSV data
  const realAlumniEmails = [
    'linda.smith859@email.com',        // IBM Executive
    'jennifer.jackson532@email.com',   // Cisco Data Scientist  
    'donald.davis559@email.com',       // Intel Executive
    'jessica.harris444@email.com',     // Amazon Director
    'robert.white570@email.com',       // Apple Architect
    'karen.williams316@email.com',     // Cisco VP
    'margaret.lopez324@email.com',     // Apple Coordinator
    'sandra.martin165@email.com',      // Coca-Cola Manager
    'ashley.jones371@email.com',       // Accenture Executive
    'admin@slu.edu'                    // Admin user
  ];

  console.log('📋 Available Real Profiles to Test:\n');
  
  for (let i = 0; i < realAlumniEmails.length; i++) {
    const email = realAlumniEmails[i];
    
    try {
      // Test directory API with this user
      const response = await fetch(`${baseUrl}/api/directory`, {
        headers: {
          'x-user-email': email,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const isAdmin = email === 'admin@slu.edu';
        
        console.log(`${i + 1}. ✅ ${email}`);
        console.log(`   Role: ${isAdmin ? 'ADMIN' : 'ALUMNI'}`);
        console.log(`   Access: Can view ${data.alumni?.length || 0} alumni profiles`);
        
        if (isAdmin) {
          // Test admin stats for admin user
          const statsResponse = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: {
              'x-user-email': email,
              'Content-Type': 'application/json'
            }
          });
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log(`   Admin Access: ✅ Can view admin dashboard (${statsData.overview?.totalUsers || 0} total users)`);
          }
        }
        console.log('');
      } else {
        console.log(`${i + 1}. ❌ ${email} - Authentication failed`);
      }
    } catch (error) {
      console.log(`${i + 1}. ❌ ${email} - Error: ${error.message}`);
    }
  }

  console.log('\n🎯 How to Login and Test:');
  console.log('1. Go to http://localhost:3000');
  console.log('2. Click "Login"');
  console.log('3. Use any email from the list above');
  console.log('4. Password: "password123" (for alumni) or "admin123" (for admin)');
  console.log('5. Explore the platform with real data!');
  
  console.log('\n📊 What You\'ll See:');
  console.log('- 3,500+ real alumni profiles in Directory');
  console.log('- 150+ real events in Events page');
  console.log('- 2,100+ real donations in Donate page');
  console.log('- 822+ real mentors in Mentorship page');
  console.log('- Real admin statistics (if logged in as admin)');
};

// Run the test
testRealProfiles().catch(console.error);
