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
      order: { category: 'ASC', sort_order: 'ASC', name: 'ASC' },
    });
  }

  async findActive(): Promise<Service[]> {
    return this.servicesRepo.find({
      where: { is_active: true },
      order: { category: 'ASC', sort_order: 'ASC', name: 'ASC' },
    });
  }

  async findByCategory(category: string): Promise<Service[]> {
    return this.servicesRepo.find({
      where: { category: category as any, is_active: true },
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  async getCategories() {
    return [
      { key: 'NEURO_PT', label: 'علاج طبيعي أعصاب' },
      { key: 'ORTHO_PT', label: 'علاج طبيعي عظام' },
      { key: 'PEDIATRIC_PT', label: 'علاج طبيعي أطفال' },
      { key: 'SPEECH_THERAPY', label: 'التخاطب' },
      { key: 'NUTRITION', label: 'التغذية' },
      { key: 'GENERAL', label: 'خدمات عامة' },
    ];
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
