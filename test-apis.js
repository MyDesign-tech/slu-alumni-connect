// Simple test script to verify all APIs are working with REAL CSV DATA
const baseUrl = 'http://localhost:3000';

const testAPIs = async () => {
  console.log('🧪 Testing SLU Alumni Connect APIs with REAL CSV DATA...\n');

  const headers = {
    'x-user-email': 'admin@slu.edu', // Use admin email for full testing
    'Content-Type': 'application/json'
  };

  const tests = [
    {
      name: 'Events API',
      url: '/api/events',
      method: 'GET'
    },
    {
      name: 'Donations API',
      url: '/api/donations',
      method: 'GET'
    },
    {
      name: 'Donations Campaigns API',
      url: '/api/donations?type=campaigns',
      method: 'GET'
    },
    {
      name: 'Directory API',
      url: '/api/directory',
      method: 'GET'
    },
    {
      name: 'Mentorship API',
      url: '/api/mentorship',
      method: 'GET'
    },
    {
      name: 'Admin Stats API',
      url: '/api/admin/stats',
      method: 'GET'
    },
    {
      name: 'Admin Users API',
      url: '/api/admin/users',
      method: 'GET'
    },
    {
      name: 'Messages API',
      url: '/api/messages',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: test.method,
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: Working (${response.status})`);
        
        // Log some sample data
        if (data.events) console.log(`   - Found ${data.events.length} events`);
        if (data.campaigns) console.log(`   - Found ${data.campaigns.length} campaigns`);
        if (data.donations) console.log(`   - Found ${data.donations.length} donations`);
        if (data.alumni) console.log(`   - Found ${data.alumni.length} alumni`);
        if (data.mentors) console.log(`   - Found ${data.mentors.length} mentors`);
        if (data.users) console.log(`   - Found ${data.users.length} users`);
        if (data.messages) console.log(`   - Found ${data.messages.length} messages`);
        if (data.overview) console.log(`   - Total users: ${data.overview.totalUsers}`);
      } else {
        console.log(`❌ ${test.name}: Failed (${response.status})`);
        const error = await response.text();
        console.log(`   - Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
    }
  }

  console.log('\n🎯 API Testing Complete!');
};

// Run the tests
testAPIs().catch(console.error);
