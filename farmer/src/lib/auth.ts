import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function getCurrentUser(request: NextRequest) {
  try {
    // In a real app, you would use JWT tokens or session-based authentication
    // For now, we'll get the user from the Authorization header or use a default user
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // In a real app, you would verify the JWT token and get the user ID
      // For now, we'll just use the token as the user ID (this is NOT secure)
      const user = await db.user.findUnique({
        where: { id: token },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true
        }
      });
      return user;
    }

    // Fallback: return a default user for development
    // In production, you should return null or throw an error
    const defaultUser = await db.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true
      }
    });
    
    return defaultUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}