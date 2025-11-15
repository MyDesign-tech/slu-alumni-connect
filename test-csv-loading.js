// Test CSV loading directly
const fs = require('fs');
const path = require('path');

function parseCSV(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    console.log('Trying to read:', fullPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log('❌ File does not exist:', fullPath);
      return { headers: [], rows: [] };
    }
    
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.log('❌ File is empty');
      return { headers: [], rows: [] };
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('✅ Headers found:', headers.length);
    
    // Parse rows
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      return row;
    });

    console.log('✅ Rows parsed:', rows.length);
    return { headers, rows };
  } catch (error) {
    console.error('❌ Error parsing CSV:', error.message);
    return { headers: [], rows: [] };
  }
}

// Test loading your CSV files
const dataPath = 'c:\\Users\\madhu\\Dheeraj\\Data';
const csvFiles = [
  'slu_alumni_data.csv',
  'slu_events_data.csv',
  'slu_donations_data.csv',
  'slu_mentorship_data.csv'
];

console.log('🧪 Testing CSV File Loading...\n');

csvFiles.forEach(fileName => {
  console.log(`📄 Testing ${fileName}:`);
  const filePath = path.join(dataPath, fileName);
  const result = parseCSV(filePath);
  
  if (result.rows.length > 0) {
    console.log(`✅ Successfully loaded ${result.rows.length} records`);
    
    // Show first record as example
    if (fileName === 'slu_alumni_data.csv') {
      const firstAlumni = result.rows[0];
      console.log(`   First alumni: ${firstAlumni.FirstName} ${firstAlumni.LastName} (${firstAlumni.Email})`);
      console.log(`   Company: ${firstAlumni.CurrentEmployer}`);
    }
  } else {
    console.log('❌ No data loaded');
  }
  console.log('');
});

console.log('🎯 If all files loaded successfully, the issue is in the Next.js integration.');
console.log('If files failed to load, there\'s a path or file access issue.');
