import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateTokens } from '../utils/jwt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

export class AuthService {
  async register(email: string, password: string, name?: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        settings: {
          create: {}, // Create default settings
        },
      },
      include: {
        settings: true,
      },
    });
    
    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }
  
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        settings: true,
      },
    });
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }
  
  async refreshToken(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    return generateTokens({
      userId: user.id,
      email: user.email,
    });
  }
  
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}