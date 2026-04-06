import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const usersService = {
  async registerUser(userData: typeof users.$inferInsert) {
    // 1. Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('Email already exists');
    }

    // 2. Hash password
    const hashedPassword = await Bun.password.hash(userData.password, {
      algorithm: 'bcrypt',
      cost: 10,
    });

    // 3. Insert new user
    await db.insert(users).values({
      ...userData,
      password: hashedPassword,
    });

    return { data: 'OK' };
  },
};
