// Test script to verify delete functionality
console.log('🧪 Testing Delete Functionality\n');

// Test 1: Check if file can be read
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/data/slu_alumni_data.json');
console.log(`📁 File path: ${filePath}`);
console.log(`📄 File exists: ${fs.existsSync(filePath)}`);

if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`📊 Current alumni count in file: ${data.length}`);

    // Show first 3 alumni
    console.log('\n📋 First 3 alumni:');
    data.slice(0, 3).forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.AlumniID} - ${a.FirstName} ${a.LastName}`);
    });

    console.log('\n✅ File is readable and contains data');
} else {
    console.log('❌ File not found!');
}

console.log('\n📝 Next steps:');
console.log('1. Try deleting an alumni in the UI');
console.log('2. Watch the terminal for [DELETE] logs');
console.log('3. Check if the alumni is removed from the list');
console.log('4. Refresh the page to verify persistence');
