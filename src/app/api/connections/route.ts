import { NextRequest, NextResponse } from 'next/server';
import { ConnectionService } from '@/lib/connection-service';
import { NotificationService } from '@/lib/notification-service';
import { AlumniDataService } from '@/lib/data-service';
import { getCurrentUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { recipientId, recipientEmail } = body;

        if (!recipientId || !recipientEmail) return NextResponse.json({ error: 'Recipient ID and Email required' }, { status: 400 });

        const connection = ConnectionService.create(user.id, recipientId);

        await NotificationService.create({
            recipientEmail: recipientEmail,
            senderEmail: user.email,
            senderName: `${user.profile.firstName} ${user.profile.lastName}`,
            type: 'connection_request',
            title: 'New Connection Request',
            message: `${user.profile.firstName} ${user.profile.lastName} wants to connect with you.`,
            relatedId: user.id,
            emailData: {
                requesterName: `${user.profile.firstName} ${user.profile.lastName}`,
                requesterGradYear: user.profile.graduationYear,
                requesterTitle: user.profile.jobTitle,
                requesterCompany: user.profile.currentEmployer,
                message: "I'd like to connect!",
                connectionUrl: `${request.nextUrl.origin}/directory`
            }
        });

        return NextResponse.json({ success: true, connection });
    } catch (error) {
        console.error('Connection error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { requesterId, status, requesterEmail } = body;

        if (!requesterId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const connection = ConnectionService.updateStatus(requesterId, user.id, status);

        if (status === 'accepted' && requesterEmail) {
            await NotificationService.create({
                recipientEmail: requesterEmail,
                senderEmail: user.email,
                senderName: `${user.profile.firstName} ${user.profile.lastName}`,
                type: 'system_alert',
                title: 'Connection Accepted',
                message: `${user.profile.firstName} ${user.profile.lastName} accepted your connection request.`,
                relatedId: user.id
            });
        }

        return NextResponse.json({ success: true, connection });
    } catch (error) {
        console.error('Connection update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const connections = ConnectionService.getAllUserConnections(user.id);

        const expandedConnections = connections.map(c => {
            const otherId = c.requesterId === user.id ? c.recipientId : c.requesterId;
            const profile = AlumniDataService.getById(otherId);
            return {
                ...c,
                profile: profile ? {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    jobTitle: profile.jobTitle,
                    currentEmployer: profile.currentEmployer,
                    email: profile.email,
                    id: profile.id
                } : null
            };
        });

        return NextResponse.json({ connections: expandedConnections });
    } catch (error) {
        console.error('Error fetching connections:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
