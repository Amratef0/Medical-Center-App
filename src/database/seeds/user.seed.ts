import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../modules/users/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const usersRepo = dataSource.getRepository(User);

  const users = [
    {
      name: 'System Admin',
      email: 'admin@mcsos.com',
      password: 'password123',
      role: 'ADMIN',
    },
    {
      name: 'Reception User',
      email: 'reception@mcsos.com',
      password: 'password123',
      role: 'RECEPTIONIST',
    },
    {
      name: 'Doctor User',
      email: 'doctor@mcsos.com',
      password: 'password123',
      role: 'DOCTOR',
    },
    {
      name: 'Finance User',
      email: 'finance@mcsos.com',
      password: 'password123',
      role: 'FINANCE',
    },
    {
      name: 'Operations Manager',
      email: 'ops@mcsos.com',
      password: 'password123',
      role: 'OPERATIONS_MANAGER',
    },
    {
      name: 'Customer Support',
      email: 'support@mcsos.com',
      password: 'password123',
      role: 'CUSTOMER_SUPPORT',
    },
  ];

  for (const userData of users) {
    const exists = await usersRepo.findOne({
      where: { email: userData.email },
    });

    if (exists) continue;

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = usersRepo.create({
      name: userData.name,
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role as any,
    });

    await usersRepo.save(user);

    console.log(`✅ ${userData.role} seeded`);
  }
}
