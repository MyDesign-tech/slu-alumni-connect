import fs from 'fs';
import path from 'path';

export interface Connection {
    id: string;
    requesterId: string;
    recipientId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

const filePath = path.join(process.cwd(), 'src/data', 'connections.json');

// Load initial data
let connections: Connection[] = [];
try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.trim()) {
            connections = JSON.parse(content);
        }
    }
} catch (error) {
    console.error('Error loading connections:', error);
}

const saveConnections = () => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(connections, null, 2));
    } catch (error) {
        console.error('Error saving connections:', error);
    }
};

export class ConnectionService {
    static create(requesterId: string, recipientId: string) {
        // Check if exists
        const existing = connections.find(c =>
            (c.requesterId === requesterId && c.recipientId === recipientId) ||
            (c.requesterId === recipientId && c.recipientId === requesterId)
        );

        if (existing) return existing;

        const conn: Connection = {
            id: `CONN${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            requesterId,
            recipientId,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        connections.push(conn);
        saveConnections();
        return conn;
    }

    static updateStatus(requesterId: string, recipientId: string, status: 'accepted' | 'rejected') {
        const conn = connections.find(c =>
            (c.requesterId === requesterId && c.recipientId === recipientId) ||
            (c.requesterId === recipientId && c.recipientId === requesterId)
        );

        if (conn) {
            conn.status = status;
            saveConnections();
            return conn;
        }
        return null;
    }

    static getConnections(userId: string) {
        return connections.filter(c =>
            (c.requesterId === userId || c.recipientId === userId) && c.status === 'accepted'
        );
    }

    static getPendingRequests(userId: string) {
        return connections.filter(c => c.recipientId === userId && c.status === 'pending');
    }

    static isConnected(user1Id: string, user2Id: string) {
        return connections.some(c =>
            ((c.requesterId === user1Id && c.recipientId === user2Id) ||
                (c.requesterId === user2Id && c.recipientId === user1Id)) &&
            c.status === 'accepted'
        );
    }

    static hasPendingRequest(requesterId: string, recipientId: string) {
        return connections.some(c =>
            c.requesterId === requesterId && c.recipientId === recipientId && c.status === 'pending'
        );
    }

    static getAllUserConnections(userId: string) {
        return connections.filter(c => c.requesterId === userId || c.recipientId === userId);
    }
}
