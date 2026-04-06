import { db } from '../db';
import { users, sessions } from '../db/schema';
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

  async loginUser(credentials: Pick<typeof users.$inferInsert, 'email' | 'password'>) {
    // 1. Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, credentials.email))
      .limit(1);

    if (!user) {
      throw new Error('Email atau password salah');
    }

    // 2. Verify password
    const isPasswordValid = await Bun.password.verify(credentials.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Email atau password salah');
    }

    // 3. Generate session token
    const token = crypto.randomUUID();

    // 4. Create session
    await db.insert(sessions).values({
      token,
      userId: user.id as any, // Cast because of bigint/number differences in Drizzle sometimes
    });

    return { data: token };
  },
};
