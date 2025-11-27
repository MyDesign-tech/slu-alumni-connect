import fs from 'fs';
import path from 'path';
import alumniRows from "@/data/slu_alumni_data.json";

const saveData = (fileName: string, data: any[]) => {
  try {
    const dir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving ${fileName}:`, error);
  }
};
import eventsRows from "@/data/slu_events_data.json";
import donationsRows from "@/data/slu_donations_data.json";
import mentorshipRows from "@/data/slu_mentorship_data.json";
import rsvpRows from "@/data/slu_rsvp_data.json";
import engagementRows from "@/data/slu_engagement_data.json";

// Initialize mutable in-memory data stores
let alumniData = alumniRows.map(row => ({
  id: row.AlumniID,
  firstName: row.FirstName,
  lastName: row.LastName,
  email: row.Email,
  phone: row.Phone,
  graduationYear: parseInt(row.GraduationYear) || 0,
  program: row.Program,
  department: row.Department,
  verificationStatus: row.VerificationStatus,
  currentEmployer: row.CurrentEmployer,
  jobTitle: row.JobTitle,
  employmentStatus: row.EmploymentStatus,
  city: row.Location_City,
  state: row.Location_State,
  country: row.Location_Country,
  profileCompleteness: parseInt(row.ProfileCompleteness) || 0,
  lastActive: row.LastUpdatedDate,
  createdAt: row.AccountCreatedDate
}));

let eventsData = eventsRows.map(row => ({
  id: row.EventID,
  title: row.EventName,
  type: row.EventType,
  date: row.EventDate,
  time: row.EventTime,
  location: row.Location,
  capacity: parseInt(row.MaxCapacity) || 0,
  registered: parseInt(row.AttendanceCount) || 0,
  status: row.Status,
  description: row.Description,
  department: row.Department,
  isVirtual: row.IsVirtual === 'True',
  budget: parseInt(row.Budget) || 0,
  createdDate: row.CreatedDate
}));

let donationsData = donationsRows.map(row => ({
  id: row.DonationID,
  alumniId: row.AlumniID,
  amount: parseFloat(row.DonationAmount) || 0,
  type: row.DonationType,
  method: row.DonationMethod,
  date: row.DonationDate,
  purpose: row.Purpose,
  isAnonymous: row.IsAnonymous === 'True',
  taxDeductible: row.TaxDeductible === 'True',
  recurringFrequency: row.RecurringFrequency,
  status: row.Status
}));

let mentorshipData = mentorshipRows.map(row => ({
  id: row.MentorshipID,
  mentorId: row.MentorAlumniID,
  menteeId: row.MenteeAlumniID,
  area: row.MentorshipArea,
  startDate: row.StartDate,
  endDate: row.EndDate,
  status: row.Status,
  frequency: parseInt(row.FrequencyPerMonth || "0") || 0,
  lastInteraction: row.LastInteractionDate,
  rating: parseFloat(row.SatisfactionRating || "0") || 0
}));

let rsvpData = rsvpRows.map(row => ({
  id: row.RSVPID,
  eventId: row.EventID,
  alumniId: row.AlumniID,
  rsvpDate: row.RSVPDate,
  status: row.RSVPStatus,
  guestCount: parseInt(row.GuestCount || "0") || 0,
  attended: row.CheckInStatus === 'Yes'
}));



/**
 * Alumni Data Service
 */
export class AlumniDataService {
  static getAll() {
    return alumniData;
  }

  static getById(id: string) {
    return alumniData.find(alumni => alumni.id === id);
  }

  static create(alumni: any) {
    const newAlumni = {
      ...alumni,
      id: alumni.id || `ALUM-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      verificationStatus: alumni.verificationStatus || 'Pending'
    };
    alumniData = [newAlumni, ...alumniData];

    // Persist to file
    const rows = alumniData.map(a => ({
      AlumniID: a.id,
      FirstName: a.firstName,
      LastName: a.lastName,
      Email: a.email,
      Phone: a.phone,
      GraduationYear: a.graduationYear.toString(),
      Program: a.program,
      Department: a.department,
      VerificationStatus: a.verificationStatus,
      CurrentEmployer: a.currentEmployer,
      JobTitle: a.jobTitle,
      EmploymentStatus: a.employmentStatus,
      Location_City: a.city,
      Location_State: a.state,
      Location_Country: a.country,
      ProfileCompleteness: a.profileCompleteness.toString(),
      LastUpdatedDate: a.lastActive,
      AccountCreatedDate: a.createdAt
    }));
    saveData('slu_alumni_data.json', rows);

    return newAlumni;
  }

  static update(id: string, updates: any) {
    alumniData = alumniData.map(a => a.id === id ? { ...a, ...updates } : a);

    // Persist to file
    const rows = alumniData.map(a => ({
      AlumniID: a.id,
      FirstName: a.firstName,
      LastName: a.lastName,
      Email: a.email,
      Phone: a.phone,
      GraduationYear: a.graduationYear.toString(),
      Program: a.program,
      Department: a.department,
      VerificationStatus: a.verificationStatus,
      CurrentEmployer: a.currentEmployer,
      JobTitle: a.jobTitle,
      EmploymentStatus: a.employmentStatus,
      Location_City: a.city,
      Location_State: a.state,
      Location_Country: a.country,
      ProfileCompleteness: a.profileCompleteness.toString(),
      LastUpdatedDate: a.lastActive,
      AccountCreatedDate: a.createdAt
    }));
    saveData('slu_alumni_data.json', rows);

    return this.getById(id);
  }

  static delete(id: string) {
    alumniData = alumniData.filter(a => a.id !== id);

    // Persist to file
    const rows = alumniData.map(a => ({
      AlumniID: a.id,
      FirstName: a.firstName,
      LastName: a.lastName,
      Email: a.email,
      Phone: a.phone,
      GraduationYear: a.graduationYear.toString(),
      Program: a.program,
      Department: a.department,
      VerificationStatus: a.verificationStatus,
      CurrentEmployer: a.currentEmployer,
      JobTitle: a.jobTitle,
      EmploymentStatus: a.employmentStatus,
      Location_City: a.city,
      Location_State: a.state,
      Location_Country: a.country,
      ProfileCompleteness: a.profileCompleteness.toString(),
      LastUpdatedDate: a.lastActive,
      AccountCreatedDate: a.createdAt
    }));
    saveData('slu_alumni_data.json', rows);

    return true;
  }

  static search(filters: {
    search?: string;
    department?: string;
    graduationYear?: string;
    location?: string;
  }) {
    let results = this.getAll();

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(alumni =>
        alumni.firstName.toLowerCase().includes(searchLower) ||
        alumni.lastName.toLowerCase().includes(searchLower) ||
        alumni.email.toLowerCase().includes(searchLower) ||
        alumni.currentEmployer?.toLowerCase().includes(searchLower) ||
        alumni.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.department) {
      results = results.filter(alumni => alumni.department === filters.department);
    }

    if (filters.graduationYear) {
      results = results.filter(alumni =>
        alumni.graduationYear.toString() === filters.graduationYear
      );
    }

    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      results = results.filter(alumni =>
        alumni.city?.toLowerCase().includes(locationLower) ||
        alumni.state?.toLowerCase().includes(locationLower)
      );
    }

    return results;
  }
}

/**
 * Events Data Service
 */
export class EventsDataService {
  static getAll() {
    return eventsData;
  }

  static getById(id: string) {
    return eventsData.find(event => event.id === id);
  }

  static create(event: any) {
    const newEvent = {
      ...event,
      id: event.id || `EVT-${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
      registered: 0
    };
    eventsData = [newEvent, ...eventsData];
    return newEvent;
  }

  static getUpcoming() {
    const now = new Date();
    return eventsData
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && event.status !== 'Cancelled';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

/**
 * Donations Data Service
 */
export class DonationsDataService {
  static getAll() {
    return donationsData;
  }

  static getByAlumni(alumniId: string) {
    return donationsData.filter(donation => donation.alumniId === alumniId);
  }

  static create(donation: any) {
    const newDonation = {
      ...donation,
      id: donation.id || `DON-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Completed'
    };
    donationsData = [newDonation, ...donationsData];
    return newDonation;
  }

  static getTotalDonations() {
    return donationsData.reduce((sum, donation) => sum + donation.amount, 0);
  }

  static getDonationsByPurpose() {
    const byPurpose: { [key: string]: number } = {};

    donationsData.forEach(donation => {
      const purpose = donation.purpose || 'General Fund';
      byPurpose[purpose] = (byPurpose[purpose] || 0) + donation.amount;
    });

    return byPurpose;
  }

  static getRecentDonations(limit: number = 10) {
    return donationsData
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}

/**
 * Mentorship Data Service
 */
export class MentorshipDataService {
  static getAll() {
    return mentorshipData;
  }

  static create(mentorship: any) {
    const newMentorship = {
      ...mentorship,
      id: mentorship.id || `MEN-${Date.now()}`,
      status: 'Requested',
      startDate: new Date().toISOString().split('T')[0]
    };
    mentorshipData = [newMentorship, ...mentorshipData];
    return newMentorship;
  }

  static getActiveMentorships() {
    return mentorshipData.filter(mentorship => mentorship.status === 'Active');
  }

  static getMentorsByArea(area?: string) {
    const mentorships = this.getAll();
    const alumni = AlumniDataService.getAll();

    // Get unique mentor IDs
    const mentorIds = [...new Set(mentorships.map(m => m.mentorId))];

    // Get mentor details
    const mentors = mentorIds.map(id => {
      const alumniProfile = alumni.find(a => a.id === id);
      if (!alumniProfile) return null;

      // Get mentorships for this mentor
      const mentorMentorships = mentorships.filter(m => m.mentorId === id);
      const areas = [...new Set(mentorMentorships.map(m => m.area))];
      const totalMentees = mentorMentorships.length;
      const activeMentees = mentorMentorships.filter(m => m.status === 'Active').length;

      // Calculate average rating
      const ratings = mentorMentorships
        .map(m => m.rating)
        .filter(r => r > 0);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

      return {
        id: alumniProfile.id,
        firstName: alumniProfile.firstName,
        lastName: alumniProfile.lastName,
        email: alumniProfile.email,
        jobTitle: alumniProfile.jobTitle,
        company: alumniProfile.currentEmployer,
        graduationYear: alumniProfile.graduationYear,
        expertise: areas,
        mentorshipAreas: areas,
        rating: avgRating,
        totalMentees: totalMentees,
        activeMentees: activeMentees,
        bio: `${alumniProfile.jobTitle} at ${alumniProfile.currentEmployer}. Specializing in ${areas.join(', ')}.`,
        status: activeMentees > 0 ? 'active' : 'available',
        availability: 'weekends'
      };
    }).filter(m => m !== null);

    // Filter by area if specified
    if (area) {
      return mentors.filter(m => m.mentorshipAreas.includes(area));
    }

    return mentors;
  }
}

/**
 * RSVP Data Service
 */
export class RSVPDataService {
  static getAll() {
    return rsvpData;
  }

  static create(rsvp: any) {
    const newRSVP = {
      ...rsvp,
      id: rsvp.id || `RSVP-${Date.now()}`,
      rsvpDate: new Date().toISOString().split('T')[0]
    };
    rsvpData = [newRSVP, ...rsvpData];

    // Update event registered count
    const eventIndex = eventsData.findIndex(e => e.id === rsvp.eventId);
    if (eventIndex >= 0) {
      eventsData[eventIndex].registered += (rsvp.guestCount || 0) + 1;
    }

    return newRSVP;
  }

  static getByEvent(eventId: string) {
    return rsvpData.filter(rsvp => rsvp.eventId === eventId);
  }

  static getByAlumni(alumniId: string) {
    return rsvpData.filter(rsvp => rsvp.alumniId === alumniId);
  }
}

let engagementData = engagementRows.map(row => ({
  id: row.EngagementID,
  alumniId: row.AlumniID,
  eventsAttended: parseInt(row.EventsAttended || "0") || 0,
  donationCount: parseInt(row.DonationCount || "0") || 0,
  totalDonated: parseInt(row.TotalAmountDonated || "0") || 0,
  mentorshipsActive: parseInt(row.MentorshipsActive || "0") || 0,
  volunteerHours: parseInt(row.VolunteerHours || "0") || 0,
  profileCompleteness: parseInt(row.ProfileCompleteness || "0") || 0,
  engagementScore: parseInt(row.EngagementScore || "0") || 0,
  lastActivityDate: row.LastActivityDate
}));

/**
 * Engagement Data Service
 */
export class EngagementDataService {
  static getAll() {
    return engagementData;
  }

  static getByAlumni(alumniId: string) {
    return engagementData.filter(engagement => engagement.alumniId === alumniId);
  }

  static getEngagementStats() {
    let events = 0;
    let donations = 0;
    let mentorships = 0;
    let volunteering = 0;

    engagementData.forEach(e => {
      events += e.eventsAttended;
      donations += e.donationCount;
      mentorships += e.mentorshipsActive;
      if (e.volunteerHours > 0) volunteering++;
    });

    return {
      'Events': events,
      'Donations': donations,
      'Mentorships': mentorships,
      'Volunteering': volunteering
    };
  }
}

/**
 * Statistics Service - Aggregated data
 */
export class StatsService {
  static getOverview() {
    const now = new Date();

    return {
      totalAlumni: alumniData.length,
      verifiedAlumni: alumniData.filter(a => a.verificationStatus === 'Verified').length,
      totalEvents: eventsData.length,
      upcomingEvents: eventsData.filter(e => new Date(e.date) >= now).length,
      totalDonations: DonationsDataService.getTotalDonations(),
      donationCount: donationsData.length,
      activeMentorships: mentorshipData.filter(m => m.status === 'Active').length,
      totalMentorships: mentorshipData.length
    };
  }

  static getDepartmentDistribution() {
    const distribution: { [key: string]: number } = {};

    alumniData.forEach(alumnus => {
      const dept = alumnus.department || 'Unknown';
      distribution[dept] = (distribution[dept] || 0) + 1;
    });

    return distribution;
  }

  static getGraduationYearDistribution() {
    const distribution: { [key: number]: number } = {};

    alumniData.forEach(alumnus => {
      const year = alumnus.graduationYear;
      distribution[year] = (distribution[year] || 0) + 1;
    });

    return distribution;
  }

  static getAlumniByLocation() {
    const distribution: { [key: string]: number } = {};

    alumniData.forEach(alumnus => {
      const loc = alumnus.state || alumnus.country || 'Unknown';
      distribution[loc] = (distribution[loc] || 0) + 1;
    });

    // Return top 10 locations
    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
  }

  static getDonationTrends() {
    const trends: { [key: string]: number } = {};

    // Group by month (YYYY-MM)
    donationsData.forEach(donation => {
      const month = donation.date.substring(0, 7); // "2023-05"
      trends[month] = (trends[month] || 0) + donation.amount;
    });

    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));
  }
}
