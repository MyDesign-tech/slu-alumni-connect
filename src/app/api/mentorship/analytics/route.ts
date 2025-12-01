import { NextRequest, NextResponse } from 'next/server';
import { MentorshipDataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
    try {
        const allMentorships = MentorshipDataService.getAll();

        // Calculate monthly mentorship activity (seasonality data)
        const monthlyData: Record<string, { active: number; completed: number; requested: number }> = {};

        allMentorships.forEach(m => {
            const date = new Date(m.startDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { active: 0, completed: 0, requested: 0 };
            }

            if (m.status === 'Active') monthlyData[monthKey].active++;
            else if (m.status === 'Completed') monthlyData[monthKey].completed++;
            else if (m.status === 'Requested') monthlyData[monthKey].requested++;
        });

        // Convert to sorted array for last 12 months
        const months = Object.keys(monthlyData).sort().slice(-12);
        const seasonalityData = months.map(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return {
                month: monthNames[parseInt(monthNum) - 1],
                yearMonth: month,
                ...monthlyData[month]
            };
        });

        // Calculate statistics
        const stats = {
            total: allMentorships.length,
            active: allMentorships.filter(m => m.status === 'Active').length,
            completed: allMentorships.filter(m => m.status === 'Completed').length,
            requested: allMentorships.filter(m => m.status === 'Requested').length,
            avgRating: allMentorships
                .filter(m => m.rating && m.rating > 0)
                .reduce((acc, m) => acc + (m.rating || 0), 0) /
                allMentorships.filter(m => m.rating && m.rating > 0).length || 0,
        };

        // Area distribution
        const areaDistribution: Record<string, number> = {};
        allMentorships.forEach(m => {
            areaDistribution[m.area] = (areaDistribution[m.area] || 0) + 1;
        });

        // Calculate growth data for the last 7 months
        const growthMonths = months.slice(-7);
        const growthData = growthMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // Count active mentorships up to this month
            const activeMentorships = allMentorships.filter(m => {
                const startDate = new Date(m.startDate);
                const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1);
                return startDate <= monthDate && (m.status === 'Active' || 
                    (m.endDate && new Date(m.endDate) >= monthDate));
            }).length;

            // Count unique mentors up to this month
            const mentorIds = new Set(
                allMentorships.filter(m => {
                    const startDate = new Date(m.startDate);
                    const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1);
                    return startDate <= monthDate;
                }).map(m => m.mentorId)
            );

            return {
                month: monthNames[parseInt(monthNum) - 1],
                activeMentorships,
                approvedMentors: mentorIds.size
            };
        });

        return NextResponse.json({
            stats,
            seasonalityData,
            growthData,
            areaDistribution: Object.entries(areaDistribution).map(([name, value]) => ({ name, value })),
            rawData: allMentorships
        });
    } catch (error) {
        console.error('Error fetching mentorship analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
