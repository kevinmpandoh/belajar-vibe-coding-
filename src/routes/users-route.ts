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
  });
