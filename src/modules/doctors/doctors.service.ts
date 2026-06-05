import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { DoctorAvailability } from './doctor-availability.entity';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  CreateDoctorAvailabilityDto,
  UpdateDoctorAvailabilityDto,
} from './dto/doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepo: Repository<Doctor>,
    @InjectRepository(DoctorAvailability)
    private availabilityRepo: Repository<DoctorAvailability>,
  ) {}

  async create(dto: CreateDoctorDto): Promise<Doctor> {
    const doctor = this.doctorsRepo.create(dto);
    return this.doctorsRepo.save(doctor);
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const qb = this.doctorsRepo.createQueryBuilder('doctor')
      .where('doctor.is_active = true');

    if (search) {
      qb.andWhere(
        '(doctor.name ILIKE :s OR doctor.specialization ILIKE :s OR doctor.email ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('doctor.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorsRepo.findOne({
      where: { id },
      relations: ['availability'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, dto);
    return this.doctorsRepo.save(doctor);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.doctorsRepo.update(id, { is_active: false });
  }

  // Availability
  async addAvailability(doctorId: string, dto: CreateDoctorAvailabilityDto): Promise<DoctorAvailability> {
    await this.findOne(doctorId);
    const availability = this.availabilityRepo.create({ ...dto, doctor_id: doctorId });
    return this.availabilityRepo.save(availability);
  }

  async getAvailability(doctorId: string): Promise<DoctorAvailability[]> {
    await this.findOne(doctorId);
    return this.availabilityRepo.find({
      where: { doctor_id: doctorId, is_active: true },
      order: { day_of_week: 'ASC' },
    });
  }

  async updateAvailability(doctorId: string, availabilityId: string, dto: UpdateDoctorAvailabilityDto): Promise<DoctorAvailability> {
    const availability = await this.availabilityRepo.findOne({
      where: { id: availabilityId, doctor_id: doctorId },
    });
    if (!availability) throw new NotFoundException('Availability slot not found');
    Object.assign(availability, dto);
    return this.availabilityRepo.save(availability);
  }

  async removeAvailability(doctorId: string, availabilityId: string): Promise<void> {
    const availability = await this.availabilityRepo.findOne({
      where: { id: availabilityId, doctor_id: doctorId },
    });
    if (!availability) throw new NotFoundException('Availability slot not found');
    await this.availabilityRepo.update(availabilityId, { is_active: false });
  }
}