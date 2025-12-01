const fs = require('fs');
const file = 'src/app/mentorship/page.tsx';
let c = fs.readFileSync(file, 'utf-8');
console.log('Reading file, length:', c.length);

// Replace sync function with async
c = c.replace(
  'const handleSubmitMentorApplication = () => {',
  'const handleSubmitMentorApplication = async () => {'
);

// Find the line with id: APP-Date.now() and add API call before it
const marker = 'id: \APP-\\,';
const idx = c.indexOf(marker);
console.log('Found marker at index:', idx);

if (idx > 0) {
  // Find the line 'const newMentor: Mentor = {' before this
  const beforeMarker = c.substring(0, idx);
  const newMentorIdx = beforeMarker.lastIndexOf('const newMentor: Mentor = {');
  console.log('Found newMentor at index:', newMentorIdx);
  
  if (newMentorIdx > 0) {
    const apiCall = \	ry {
              const response = await fetch('/api/mentorship/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-email': user.email },
                body: JSON.stringify({ experience: mentorApplicationExperience, availability: mentorApplicationAvailability, areas: mentorshipAreas, bio: mentorApplicationBio.trim(), firstName, lastName, jobTitle, company, graduationYear })
              });
              if (!response.ok) { const err = await response.json(); setMentorApplicationError(err.error || 'Failed'); return; }
              const data = await response.json();
              console.log('[MENTOR APP] Submitted:', data);
              
              \;
    
    c = c.substring(0, newMentorIdx) + apiCall + c.substring(newMentorIdx);
    
    // Replace the id line
    c = c.replace('id: \APP-\\,', 'id: data.application.id,');
    
    // Add closing try-catch before the end of the function
    c = c.replace(
      'setMentorApplicationError(null);\n          };',
      'setMentorApplicationError(null);\n            } catch (error) { console.error(error); setMentorApplicationError(\"Failed to submit\"); }\n          };'
    );
  }
}

fs.writeFileSync(file, c, 'utf-8');
console.log('Done! Checking...');
console.log('Has API call:', c.includes('/api/mentorship/apply'));
