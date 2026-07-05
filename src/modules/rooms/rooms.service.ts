import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepo: Repository<Room>,
  ) {}

  async create(dto: CreateRoomDto): Promise<Room> {
    const existing = await this.roomsRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Room with code ${dto.code} already exists`);
    }
    const room = this.roomsRepo.create(dto);
    return this.roomsRepo.save(room);
  }

  async findAll(search?: string): Promise<Room[]> {
    const qb = this.roomsRepo.createQueryBuilder('room');
    if (search) {
      qb.where('room.name ILIKE :s OR room.code ILIKE :s', { s: `%${search}%` });
    }
    qb.orderBy('room.name', 'ASC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomsRepo.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    if (dto.code && dto.code !== room.code) {
      const existing = await this.roomsRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Room with code ${dto.code} already exists`);
      }
    }
    Object.assign(room, dto);
    return this.roomsRepo.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomsRepo.remove(room);
  }
}
