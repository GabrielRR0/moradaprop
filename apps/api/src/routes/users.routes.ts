import type { Routes } from '@nestjs/core';
import { UsersModule } from '../modules/users';

export const usersRoutes: Routes = [{ path: 'users', module: UsersModule }];
