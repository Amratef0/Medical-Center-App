import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waitlist } from './waitlist.entity';
import { CreateWaitlistDto, UpdateWaitlistDto } from './dto/waitlist.dto';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(Waitlist)
    private waitlistRepo: Repository<Waitlist>,
  ) {}

  async create(dto: CreateWaitlistDto): Promise<Waitlist> {
    const entry = this.waitlistRepo.create(dto);
    return this.waitlistRepo.save(entry);
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const qb = this.waitlistRepo
      .createQueryBuilder('waitlist')
      .leftJoinAndSelect('waitlist.patient', 'patient')
      .leftJoinAndSelect('waitlist.doctor', 'doctor');

    if (search) {
      qb.where(
        '(patient.first_name ILIKE :s OR patient.last_name ILIKE :s OR patient.patient_code ILIKE :s OR doctor.name ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('waitlist.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Waitlist> {
    const entry = await this.waitlistRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });
    if (!entry) throw new NotFoundException('Waitlist entry not found');
    return entry;
  }

  async update(id: string, dto: UpdateWaitlistDto): Promise<Waitlist> {
    const entry = await this.findOne(id);
    Object.assign(entry, dto);
    return this.waitlistRepo.save(entry);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    await this.waitlistRepo.remove(entry);
  }
}