// Test login with real CSV data
const baseUrl = 'http://localhost:3000';

const testLogin = async () => {
  console.log('🔐 Testing Login with Real CSV Data...\n');

  const testCredentials = [
    {
      email: 'linda.smith859@email.com',
      password: 'password123',
      expectedName: 'Linda Smith',
      expectedCompany: 'IBM'
    },
    {
      email: 'admin@slu.edu',
      password: 'admin123',
      expectedName: 'Admin User',
      expectedRole: 'ADMIN'
    },
    {
      email: 'jennifer.jackson532@email.com',
      password: 'password123',
      expectedName: 'Jennifer Jackson',
      expectedCompany: 'Cisco'
    }
  ];

  for (const cred of testCredentials) {
    try {
      console.log(`Testing: ${cred.email}`);
      
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Login successful!`);
        console.log(`   Name: ${data.user.profile.firstName} ${data.user.profile.lastName}`);
        console.log(`   Role: ${data.user.role}`);
        if (data.user.profile.currentEmployer) {
          console.log(`   Company: ${data.user.profile.currentEmployer}`);
        }
        console.log(`   Department: ${data.user.profile.department}`);
      } else {
        const error = await response.json();
        console.log(`❌ Login failed: ${error.error}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('🎯 Now try logging in through the website:');
  console.log('1. Go to http://localhost:3000');
  console.log('2. Click "Login"');
  console.log('3. Use: linda.smith859@email.com / password123');
  console.log('4. Or use: admin@slu.edu / admin123');
};

testLogin().catch(console.error);
