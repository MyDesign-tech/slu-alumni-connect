import { NextRequest, NextResponse } from 'next/server';
import { AlumniDataService, DonationsDataService, EventsDataService, StatsService } from '@/lib/data-service';

export async function GET() {
  try {
    const stats = StatsService.getOverview();
    const donationStats = DonationsDataService.getStats();
    const alumni = AlumniDataService.getAll();
    const events = EventsDataService.getUpcoming();
    
    // Get unique countries
    const uniqueCountries = new Set(
      alumni
        .map(a => a.country)
        .filter(c => c && c !== 'Unknown')
    );

    // Get actual years from donation data
    const allDonations = DonationsDataService.getAll();
    const donationYears = [...new Set(allDonations.map(d => parseInt(d.date.split('-')[0])))].sort();
    
    // Use last 5 years from donation data, or default to 2020-2024 if less data
    const currentYear = new Date().getFullYear();
    const startYear = donationYears.length > 0 ? Math.min(donationYears[0], currentYear - 4) : 2020;
    const endYear = currentYear;
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }

    // Calculate cumulative data for both alumni and donations
    const growthData = years.map(year => {
      // Count all alumni who graduated up to this year (cumulative)
      const cumulativeAlumni = alumni.filter(a => a.graduationYear <= year).length;
      
      // Sum ALL donations up to and including this year (cumulative, in millions)
      const cumulativeDonations = allDonations
        .filter(d => parseInt(d.date.split('-')[0]) <= year)
        .reduce((sum, d) => sum + d.amount, 0) / 1000000;

      return {
        year: year.toString(),
        alumni: cumulativeAlumni,
        donations: parseFloat(cumulativeDonations.toFixed(1))
      };
    });

    return NextResponse.json({
      totalAlumni: stats.totalAlumni,
      totalCountries: uniqueCountries.size,
      totalRaised: donationStats.totalRaised,
      scholarshipsFunded: donationStats.scholarshipsFunded,
      upcomingEvents: events.slice(0, 6),
      growthData,
      stats: {
        verifiedAlumni: stats.verifiedAlumni,
        upcomingEvents: stats.upcomingEvents,
        activeDonors: donationStats.activeDonors,
        activeMentorships: stats.activeMentorships
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
