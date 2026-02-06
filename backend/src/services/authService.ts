import { readJSON, writeJSON } from '../utils/storage';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private readonly USERS_FILE = 'users.json';

  async login(email: string, password: string): Promise<User | null> {
    const users = readJSON<User[]>(this.USERS_FILE);
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    
    return null;
  }

  async getUser(userId: string): Promise<User | null> {
    const users = readJSON<User[]>(this.USERS_FILE);
    const user = users.find(u => u.id === userId);
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    
    return null;
  }

  initializeTestUser(): void {
    const users = readJSON<User[]>(this.USERS_FILE);
    
    if (!users.find(u => u.email === 'test@gmail.com')) {
      users.push({
        id: uuidv4(),
        email: 'test@gmail.com',
        password: 'test@123',
        name: 'Test User',
        createdAt: new Date().toISOString()
      });
      
      writeJSON(this.USERS_FILE, users);
    }
  }
}
