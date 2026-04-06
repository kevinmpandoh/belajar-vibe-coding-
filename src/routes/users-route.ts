import { Elysia, t } from 'elysia';
import { usersService } from '../services/users-service';
import { UnauthorizedError } from '../utils/errors';

export const usersRoute = new Elysia({ prefix: '/api' })
  .post('/users', async ({ body, set }) => {
    try {
      return await usersService.registerUser(body as any);
    } catch (error: any) {
      if (error.message === 'Email already exists') {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      password: t.String(),
    })
  })
  .post('/users/login', async ({ body, set }) => {
    try {
      return await usersService.loginUser(body);
    } catch (error: any) {
      if (error.message === 'Email atau password salah') {
        set.status = 401; // Unauthorized
        return { error: error.message };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    })
  })
  .derive(({ headers }) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { token: null };
    }

    const parts = authHeader.split(' ');
    const token = parts[1];

    if (parts.length !== 2 || !token) {
      return { token: null };
    }

    return { token };
  })
  .get('/users/current', async ({ token, set }) => {
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    try {
      return await usersService.getCurrentUser(token);
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  })
  .delete('/users/logout', async ({ token, set }) => {
    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    try {
      return await usersService.logoutUser(token);
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  });
