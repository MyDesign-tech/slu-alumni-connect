const fs = require('fs');
const path = 'c:/Users/madhu/Dheeraj/slu-alumni-connect/src/app/mentorship/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The old block that creates local mentor
const oldBlock = const newMentor: Mentor = {
              id: \APP-\\,
              firstName,
              lastName: lastName || "Mentor",
              jobTitle,
              company,
              graduationYear,
              expertise: mentorApplicationAreas,
              rating: 0,
              totalMentees: 0,
              availability: mentorApplicationAvailability,
              bio: mentorApplicationBio.trim(),
              mentorshipAreas,
            };

            setMentors((prev) => [...prev, newMentor]);
            setPendingMentorIds((prev) => [...prev, newMentor.id]);

            setMentorApplicationSubmitted(true);
            setMentorApplicationStatus('pending');;

const newBlock = // Submit to API for persistence
            try {
              const response = await fetch('/api/mentorship/apply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-email': user.email,
                },
                body: JSON.stringify({
                  experience: '1-3 years',
                  availability: mentorApplicationAvailability,
                  areas: mentorApplicationAreas,
                  bio: mentorApplicationBio.trim(),
                  firstName,
                  lastName: lastName || 'Mentor',
                  jobTitle,
                  company,
                  graduationYear,
                  mentorshipAreas,
                }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit application');
              }

              const data = await response.json();
              const newMentor: Mentor = {
                id: data.application.id,
                firstName,
                lastName: lastName || 'Mentor',
                jobTitle,
                company,
                graduationYear,
                expertise: mentorApplicationAreas,
                rating: 0,
                totalMentees: 0,
                availability: mentorApplicationAvailability,
                bio: mentorApplicationBio.trim(),
                mentorshipAreas,
              };

              setMentors((prev) => [...prev, newMentor]);
              setPendingMentorIds((prev) => [...prev, newMentor.id]);

              setMentorApplicationSubmitted(true);
              setMentorApplicationStatus('pending');;

if (content.includes('id: \APP-\\')) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(path, content);
  console.log('SUCCESS: Updated handleSubmitMentorApplication with API call');
} else {
  console.log('ERROR: Pattern not found');
  console.log('Looking for APP- at:', content.indexOf('APP-'));
}
