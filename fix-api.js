const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/mentorship/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file length:', content.length);

// 1. Find and update handleSubmitMentorApplication
const markerText = 'id: \APP-' + '\\,';
const markerIdx = content.indexOf(markerText);
console.log('Found marker at:', markerIdx);

if (markerIdx > 0) {
  const beforeMarker = content.substring(0, markerIdx);
  const newMentorIdx = beforeMarker.lastIndexOf('const newMentor: Mentor = {');
  console.log('Found newMentor at:', newMentorIdx);
  
  if (newMentorIdx > 0) {
    const apiCallCode = 'try {\n' +
      '              const response = await fetch(\"/api/mentorship/apply\", {\n' +
      '                method: \"POST\",\n' +
      '                headers: { \"Content-Type\": \"application/json\", \"x-user-email\": user.email },\n' +
      '                body: JSON.stringify({ experience: mentorApplicationExperience, availability: mentorApplicationAvailability, areas: mentorshipAreas, bio: mentorApplicationBio.trim(), firstName, lastName, jobTitle, company, graduationYear })\n' +
      '              });\n' +
      '              if (!response.ok) { const err = await response.json(); setMentorApplicationError(err.error || \"Failed\"); return; }\n' +
      '              const data = await response.json();\n' +
      '              console.log(\"[MENTOR APP] Submitted:\", data);\n\n' +
      '            ';

    content = content.substring(0, newMentorIdx) + apiCallCode + content.substring(newMentorIdx);
    content = content.replace(markerText, 'id: data.application.id,');
    console.log('Added API call');
  }
}

// Add catch block
const oldEnd = 'setMentorApplicationError(null);\n          };\n\n          const mentorshipAreasData';
const newEnd = 'setMentorApplicationError(null);\n            } catch (error) { console.error(error); setMentorApplicationError(\"Failed\"); }\n          };\n\n          const mentorshipAreasData';
content = content.replace(oldEnd, newEnd);

// Update handleApproveMentor
const oldApprove = 'const handleApproveMentor = (mentorId: string) => {\n            setApprovedMentorIds((prev) => (prev.includes(mentorId) ? prev : [...prev, mentorId]));\n            setPendingMentorIds((prev) => prev.filter((id) => id !== mentorId));\n            setRejectedMentorIds((prev) => prev.filter((id) => id !== mentorId));\n          };';
const newApprove = 'const handleApproveMentor = async (mentorId: string) => {\n            try {\n              const response = await fetch(\"/api/mentorship/approve\", {\n                method: \"POST\",\n                headers: { \"Content-Type\": \"application/json\", \"x-user-email\": user?.email || \"admin@slu.edu\" },\n                body: JSON.stringify({ applicationId: mentorId, action: \"approve\" })\n              });\n              if (response.ok) {\n                setApprovedMentorIds((prev) => (prev.includes(mentorId) ? prev : [...prev, mentorId]));\n                setPendingMentorIds((prev) => prev.filter((id) => id !== mentorId));\n                setRejectedMentorIds((prev) => prev.filter((id) => id !== mentorId));\n              }\n            } catch (error) { console.error(error); }\n          };';
content = content.replace(oldApprove, newApprove);

// Update handleRejectMentor
const oldReject = 'const handleRejectMentor = (mentorId: string) => {\n            setRejectedMentorIds((prev) => (prev.includes(mentorId) ? prev : [...prev, mentorId]));\n            setPendingMentorIds((prev) => prev.filter((id) => id !== mentorId));\n            setApprovedMentorIds((prev) => prev.filter((id) => id !== mentorId));\n          };';
const newReject = 'const handleRejectMentor = async (mentorId: string) => {\n            try {\n              const response = await fetch(\"/api/mentorship/approve\", {\n                method: \"POST\",\n                headers: { \"Content-Type\": \"application/json\", \"x-user-email\": user?.email || \"admin@slu.edu\" },\n                body: JSON.stringify({ applicationId: mentorId, action: \"reject\" })\n              });\n              if (response.ok) {\n                setRejectedMentorIds((prev) => (prev.includes(mentorId) ? prev : [...prev, mentorId]));\n                setPendingMentorIds((prev) => prev.filter((id) => id !== mentorId));\n                setApprovedMentorIds((prev) => prev.filter((id) => id !== mentorId));\n                setMentors((prev) => prev.filter((m) => m.id !== mentorId));\n              }\n            } catch (error) { console.error(error); }\n          };';
content = content.replace(oldReject, newReject);

fs.writeFileSync(filePath, content, 'utf8');
const verify = fs.readFileSync(filePath, 'utf8');
console.log('New length:', verify.length);
console.log('Has /api/mentorship/apply:', verify.includes('/api/mentorship/apply'));
console.log('Has /api/mentorship/approve:', verify.includes('/api/mentorship/approve'));
