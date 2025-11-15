import alumniRows from "@/data/slu_alumni_data.json";
import eventsRows from "@/data/slu_events_data.json";
import donationsRows from "@/data/slu_donations_data.json";
import mentorshipRows from "@/data/slu_mentorship_data.json";
import rsvpRows from "@/data/slu_rsvp_data.json";
import engagementRows from "@/data/slu_engagement_data.json";

/**
 * Alumni Data Service
 */
export class AlumniDataService {
  static getAll() {
    const rows = alumniRows as any[];
    return rows.map(row => ({
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
  }

  static getById(id: string) {
    const all = this.getAll();
    return all.find(alumni => alumni.id === id);
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
    const rows = eventsRows as any[];
    return rows.map(row => ({
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
  }

  static getById(id: string) {
    const all = this.getAll();
    return all.find(event => event.id === id);
  }

  static getUpcoming() {
    const all = this.getAll();
    const now = new Date();
    return all
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
    const rows = donationsRows as any[];
    return rows.map(row => ({
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
  }

  static getByAlumni(alumniId: string) {
    const all = this.getAll();
    return all.filter(donation => donation.alumniId === alumniId);
  }

  static getTotalDonations() {
    const all = this.getAll();
    return all.reduce((sum, donation) => sum + donation.amount, 0);
  }

  static getDonationsByPurpose() {
    const all = this.getAll();
    const byPurpose: { [key: string]: number } = {};
    
    all.forEach(donation => {
      const purpose = donation.purpose || 'General Fund';
      byPurpose[purpose] = (byPurpose[purpose] || 0) + donation.amount;
    });

    return byPurpose;
  }

  static getRecentDonations(limit: number = 10) {
    const all = this.getAll();
    return all
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}

/**
 * Mentorship Data Service
 */
export class MentorshipDataService {
  static getAll() {
    const rows = mentorshipRows as any[];
    return rows.map(row => ({
      id: row.MentorshipID,
      mentorId: row.MentorAlumniID,
      menteeId: row.MenteeAlumniID,
      area: row.MentorshipArea,
      startDate: row.StartDate,
      endDate: row.EndDate,
      status: row.Status,
      frequency: parseInt(row.FrequencyPerMonth) || 0,
      lastInteraction: row.LastInteractionDate,
      rating: parseFloat(row.SatisfactionRating) || 0
    }));
  }

  static getActiveMentorships() {
    const all = this.getAll();
    return all.filter(mentorship => mentorship.status === 'Active');
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
    const rows = rsvpRows as any[];
    return rows.map(row => ({
      id: row.RSVPID,
      eventId: row.EventID,
      alumniId: row.AlumniID,
      rsvpDate: row.RSVPDate,
      status: row.Status,
      guestCount: parseInt(row.GuestCount) || 0,
      attended: row.Attended === 'True',
      checkInTime: row.CheckInTime
    }));
  }

  static getByEvent(eventId: string) {
    const all = this.getAll();
    return all.filter(rsvp => rsvp.eventId === eventId);
  }

  static getByAlumni(alumniId: string) {
    const all = this.getAll();
    return all.filter(rsvp => rsvp.alumniId === alumniId);
  }
}

/**
 * Engagement Data Service
 */
export class EngagementDataService {
  static getAll() {
    const rows = engagementRows as any[];
    return rows.map(row => ({
      id: row.EngagementID,
      alumniId: row.AlumniID,
      activityType: row.ActivityType,
      activityDate: row.ActivityDate,
      description: row.Description,
      points: parseInt(row.Points) || 0,
      category: row.Category
    }));
  }

  static getByAlumni(alumniId: string) {
    const all = this.getAll();
    return all.filter(engagement => engagement.alumniId === alumniId);
  }

  static getEngagementStats() {
    const all = this.getAll();
    const byType: { [key: string]: number } = {};
    
    all.forEach(engagement => {
      const type = engagement.activityType;
      byType[type] = (byType[type] || 0) + 1;
    });

    return byType;
  }
}

/**
 * Statistics Service - Aggregated data
 */
export class StatsService {
  static getOverview() {
    const alumni = AlumniDataService.getAll();
    const events = EventsDataService.getAll();
    const donations = DonationsDataService.getAll();
    const mentorships = MentorshipDataService.getAll();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalAlumni: alumni.length,
      verifiedAlumni: alumni.filter(a => a.verificationStatus === 'Verified').length,
      totalEvents: events.length,
      upcomingEvents: events.filter(e => new Date(e.date) >= now).length,
      totalDonations: DonationsDataService.getTotalDonations(),
      donationCount: donations.length,
      activeMentorships: mentorships.filter(m => m.status === 'Active').length,
      totalMentorships: mentorships.length
    };
  }

  static getDepartmentDistribution() {
    const alumni = AlumniDataService.getAll();
    const distribution: { [key: string]: number } = {};
    
    alumni.forEach(alumnus => {
      const dept = alumnus.department || 'Unknown';
      distribution[dept] = (distribution[dept] || 0) + 1;
    });

    return distribution;
  }

  static getGraduationYearDistribution() {
    const alumni = AlumniDataService.getAll();
    const distribution: { [key: number]: number } = {};
    
    alumni.forEach(alumnus => {
      const year = alumnus.graduationYear;
      distribution[year] = (distribution[year] || 0) + 1;
    });

    return distribution;
  }
}
