import { mysqlTable, serial, varchar, text, timestamp, int, bigint } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = mysqlTable('sessions', {
  id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});
