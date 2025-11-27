import fs from 'fs';
import path from 'path';

interface RegisteredUser {
  password: string
  user: {
    id: string
    email: string
    role: string
    profile: any
  }
}

const filePath = path.join(process.cwd(), 'src/data', 'registered_users.json');

// Initialize map
const usersMap = new Map<string, RegisteredUser>();

// Load data
try {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.trim()) {
      const data = JSON.parse(content);
      // Assume object format { email: userObj }
      Object.entries(data).forEach(([email, user]: [string, any]) => {
        usersMap.set(email, user);
      });
    }
  }
} catch (error) {
  console.error('Error loading registered users:', error);
}

const saveUsers = () => {
  try {
    const data = Object.fromEntries(usersMap);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving registered users:', error);
  }
};

// Export an object that mimics Map interface for used methods
export const registeredUsers = {
  get: (key: string) => usersMap.get(key),
  set: (key: string, value: RegisteredUser) => {
    usersMap.set(key, value);
    saveUsers();
    return registeredUsers;
  },
  has: (key: string) => usersMap.has(key),
  delete: (key: string) => {
    const result = usersMap.delete(key);
    if (result) saveUsers();
    return result;
  },
  clear: () => {
    usersMap.clear();
    saveUsers();
  },
  values: () => usersMap.values()
};
