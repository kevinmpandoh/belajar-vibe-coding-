import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UnauthorizedError } from '../utils/errors';

export const usersService = {
  async registerUser(userData: typeof users.$inferInsert) {
    // 1. Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email!))
      .limit(1);

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // 2. Hash password
    const hashedPassword = await Bun.password.hash(userData.password!, {
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
      userId: user.id, // Now matches schema (bigint)
    } as any); // cast as any here because of Drizzle's strict $inferInsert with non-serial bigints

    return { data: token };
  },

  async getCurrentUser(token: string) {
    // 1. Join sessions and users where token matches
    const [result] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (!result) {
      throw new UnauthorizedError();
    }

    return { data: result };
  },

  async logoutUser(token: string) {
    // 1. Delete session where token matches
    const result = await db.delete(sessions).where(eq(sessions.token, token));

    if (result[0].affectedRows === 0) {
      throw new UnauthorizedError();
    }

    return { data: 'OK' };
  },
};
