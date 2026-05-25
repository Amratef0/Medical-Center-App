import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepo: Repository<Service>,
  ) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    const service = this.servicesRepo.create(dto);
    return this.servicesRepo.save(service);
  }

  async findAll(): Promise<Service[]> {
    return this.servicesRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findActive(): Promise<Service[]> {
    return this.servicesRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    return this.servicesRepo.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.servicesRepo.remove(service);
  }
}
