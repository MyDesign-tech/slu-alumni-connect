// Quick verification that APIs are serving real CSV data
const baseUrl = 'http://localhost:3000';

const verifyRealData = async () => {
  console.log('🔍 Verifying Real CSV Data Integration...\n');

  const tests = [
    {
      name: 'Directory API',
      url: '/api/directory',
      expectedCount: 3500,
      checkField: 'alumni'
    },
    {
      name: 'Events API', 
      url: '/api/events',
      expectedCount: 150,
      checkField: 'events'
    },
    {
      name: 'Donations API',
      url: '/api/donations',
      expectedCount: 2100,
      checkField: 'donations'
    },
    {
      name: 'Mentorship API',
      url: '/api/mentorship',
      expectedCount: 822,
      checkField: 'mentors'
    }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(`${baseUrl}${test.url}`, {
        headers: {
          'x-user-email': 'admin@slu.edu',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data[test.checkField]?.length || 0;
        
        if (count >= test.expectedCount * 0.9) { // Allow 10% variance
          console.log(`✅ ${test.name}: ${count} records (REAL DATA)`);
          
          // Show sample data to verify it's real
          if (data[test.checkField] && data[test.checkField][0]) {
            const sample = data[test.checkField][0];
            if (test.name === 'Directory API') {
              console.log(`   Sample: ${sample.firstName} ${sample.lastName} at ${sample.currentEmployer}`);
            } else if (test.name === 'Events API') {
              console.log(`   Sample: ${sample.title} on ${sample.date}`);
            }
          }
        } else {
          console.log(`⚠️  ${test.name}: Only ${count} records (Expected ~${test.expectedCount})`);
        }
      } else {
        console.log(`❌ ${test.name}: API call failed (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 Summary:');
  console.log('- If you see "REAL DATA" above, your APIs are working correctly');
  console.log('- The issue might be browser caching or frontend not refreshing');
  console.log('- Try: Hard refresh (Ctrl+F5) or open in incognito mode');
  console.log('- Or restart the dev server: npm run dev');
};

verifyRealData().catch(console.error);
