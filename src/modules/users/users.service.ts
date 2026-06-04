import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ ...dto, password_hash });
    return this.usersRepo.save(user);
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const qb = this.usersRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.role', 'user.is_active', 'user.created_at']);

    if (search) {
      qb.where('(user.name ILIKE :s OR user.email ILIKE :s)', { s: `%${search}%` });
    }

    const [data, total] = await qb
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      (dto as any).password_hash = await bcrypt.hash(dto.password, 10);
      delete dto.password;
    }
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async updateRole(email: string, role: UserRole): Promise<User> {
    const user = await this.findByEmail(email);
    await this.usersRepo.update(user.id, { role });
    return this.findByEmail(email);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.usersRepo.update(id, { is_active: false });
  }
}