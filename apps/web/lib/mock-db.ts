// Mock database for authentication
// In production, this would be replaced with a real database

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  created_at: string;
}

// Initialize with empty array - users can sign up
let users: User[] = [];

export const mockDb = {
  users: {
    findByEmail: (email: string): User | undefined => {
      return users.find(u => u.email === email);
    },
    
    create: (userData: Omit<User, 'id' | 'created_at'>): User => {
      const newUser: User = {
        ...userData,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      return newUser;
    },
    
    findById: (id: string): User | undefined => {
      return users.find(u => u.id === id);
    },
    
    validateCredentials: (email: string, password: string): User | null => {
      const user = users.find(u => u.email === email && u.password === password);
      return user || null;
    }
  }
};