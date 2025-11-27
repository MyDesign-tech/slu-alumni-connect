import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { RSVPDataService, MentorshipDataService } from '@/lib/data-service'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const alumniId = user.id

        // Get events count (RSVPs)
        const rsvps = RSVPDataService.getByAlumni(alumniId)
        const eventsCount = rsvps.length

        // Get mentorships count
        const allMentorships = MentorshipDataService.getAll()
        const mentorshipsCount = allMentorships.filter(m => m.menteeId === alumniId || m.mentorId === alumniId).length

        // Get connections count (Mock for now as we don't have a persistent connections service)
        const connectionsCount = 0

        return NextResponse.json({
            events: eventsCount,
            mentorships: mentorshipsCount,
            connections: connectionsCount
        })
    } catch (error) {
        console.error('Stats error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
