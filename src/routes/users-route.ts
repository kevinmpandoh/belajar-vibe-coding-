import { Elysia, t } from 'elysia';
import { usersService } from '../services/users-service';

export const usersRoute = new Elysia({ prefix: '/api' })
  .post('/users', async ({ body, set }) => {
    try {
      return await usersService.registerUser(body);
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
  .get('/users/current', async ({ headers, set }) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const parts = authHeader.split(' ');
    const token = parts[1];
    if (parts.length !== 2 || !token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    try {
      return await usersService.getCurrentUser(token);
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      set.status = 500;
      return { error: 'Internal Server Error' };
    }
  });
