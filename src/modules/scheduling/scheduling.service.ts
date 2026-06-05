import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleSlot, SlotType } from './schedule-slot.entity';
import {
  CreateSlotDto,
  GenerateBulkSlotsDto,
  UpdateSlotDto,
  SlotQueryDto,
} from './dto/scheduling.dto';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(ScheduleSlot)
    private slotsRepo: Repository<ScheduleSlot>,
  ) {}

  // ──────────── Single Slot ────────────

  async createSlot(dto: CreateSlotDto, createdBy: string): Promise<ScheduleSlot> {
    const start = new Date(dto.start_time);
    const end = new Date(dto.end_time);

    // Check for conflicts
    await this.checkConflict(dto.doctor_id, start, end);

    const slot = this.slotsRepo.create({
      ...dto,
      start_time: start,
      end_time: end,
      type: dto.type || SlotType.DYNAMIC,
    });
    return this.slotsRepo.save(slot);
  }

  // ──────────── Bulk Slot Generation ────────────

  async generateBulkSlots(
    dto: GenerateBulkSlotsDto,
    createdBy: string,
  ): Promise<{ created: number; skipped: number; slots: ScheduleSlot[] }> {
    const {
      doctor_id,
      service_id,
      pattern,
      start_date,
      end_date,
      start_time,
      end_time,
      slot_duration_minutes,
      capacity,
    } = dto;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      throw new BadRequestException('end_date must be after start_date');
    }

    const [startHour, startMin] = start_time.split(':').map(Number);
    const [endHour, endMin] = end_time.split(':').map(Number);
    const dayStartMinutes = startHour * 60 + startMin;
    const dayEndMinutes = endHour * 60 + endMin;

    if (dayEndMinutes <= dayStartMinutes) {
      throw new BadRequestException('end_time must be after start_time');
    }

    const slotsToCreate: Partial<ScheduleSlot>[] = [];
    let skipped = 0;

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0=Sunday

      if (pattern.includes(dayOfWeek)) {
        let currentMinute = dayStartMinutes;

        while (currentMinute + slot_duration_minutes <= dayEndMinutes) {
          const slotStartHour = Math.floor(currentMinute / 60);
          const slotStartMin = currentMinute % 60;
          const slotEndMinute = currentMinute + slot_duration_minutes;
          const slotEndHour = Math.floor(slotEndMinute / 60);
          const slotEndMin = slotEndMinute % 60;

          // Build ISO absolute timestamps in the current timezone or UTC
          const start = new Date(currentDate);
          start.setHours(slotStartHour, slotStartMin, 0, 0);

          const end = new Date(currentDate);
          end.setHours(slotEndHour, slotEndMin, 0, 0);

          // Check for existing conflicting slot
          const existing = await this.slotsRepo.findOne({
            where: {
              doctor_id,
              start_time: start,
            },
          });

          if (existing) {
            skipped++;
          } else {
            slotsToCreate.push({
              doctor_id,
              service_id,
              start_time: start,
              end_time: end,
              capacity: capacity || 1,
              type: SlotType.BULK,
              is_available: true,
            });
          }

          currentMinute += slot_duration_minutes;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const createdSlots = await this.slotsRepo.save(
      slotsToCreate.map((s) => this.slotsRepo.create(s)),
    );

    return {
      created: createdSlots.length,
      skipped,
      slots: createdSlots,
    };
  }

  // ──────────── Query Slots ────────────

  async findSlots(query: SlotQueryDto): Promise<ScheduleSlot[]> {
    const qb = this.slotsRepo.createQueryBuilder('slot')
      .leftJoinAndSelect('slot.service', 'service');

    if (query.doctor_id) {
      qb.andWhere('slot.doctor_id = :doctorId', { doctorId: query.doctor_id });
    }
    if (query.service_id) {
      qb.andWhere('slot.service_id = :serviceId', { serviceId: query.service_id });
    }
    if (query.from) {
      qb.andWhere('slot.start_time >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('slot.end_time <= :to', { to: new Date(query.to) });
    }

    qb.orderBy('slot.start_time', 'ASC');

    return qb.getMany();
  }

  async findAvailableSlots(query: SlotQueryDto): Promise<ScheduleSlot[]> {
    const qb = this.slotsRepo.createQueryBuilder('slot')
      .leftJoinAndSelect('slot.service', 'service')
      .where('slot.is_available = :isAvailable', { isAvailable: true })
      .andWhere('slot.booked_count < slot.capacity');

    if (query.doctor_id) {
      qb.andWhere('slot.doctor_id = :doctorId', { doctorId: query.doctor_id });
    }
    if (query.service_id) {
      qb.andWhere('slot.service_id = :serviceId', { serviceId: query.service_id });
    }
    if (query.from) {
      qb.andWhere('slot.start_time >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('slot.end_time <= :to', { to: new Date(query.to) });
    }

    qb.orderBy('slot.start_time', 'ASC');

    return qb.getMany();
  }

  async findOne(id: string): Promise<ScheduleSlot> {
    const slot = await this.slotsRepo.findOne({
      where: { id },
      relations: ['service'],
    });
    if (!slot) throw new NotFoundException('Slot not found');
    return slot;
  }

  async update(id: string, dto: UpdateSlotDto): Promise<ScheduleSlot> {
    const slot = await this.findOne(id);
    Object.assign(slot, dto);
    return this.slotsRepo.save(slot);
  }

  async remove(id: string): Promise<void> {
    const slot = await this.findOne(id);
    if (slot.booked_count > 0) {
      throw new BadRequestException('Cannot delete a slot with existing bookings');
    }
    await this.slotsRepo.remove(slot);
  }

  // ──────────── Booking ────────────

  async bookSlot(id: string): Promise<ScheduleSlot> {
    const slot = await this.findOne(id);

    if (!slot.is_available) {
      throw new BadRequestException('This slot is not available');
    }
    if (slot.booked_count >= slot.capacity) {
      throw new BadRequestException('This slot is fully booked');
    }

    slot.booked_count += 1;
    if (slot.booked_count >= slot.capacity) {
      slot.is_available = false;
    }

    return this.slotsRepo.save(slot);
  }

  async cancelBooking(id: string): Promise<ScheduleSlot> {
    const slot = await this.findOne(id);

    if (slot.booked_count <= 0) {
      throw new BadRequestException('No bookings to cancel');
    }

    slot.booked_count -= 1;
    if (slot.booked_count < slot.capacity) {
      slot.is_available = true;
    }

    return this.slotsRepo.save(slot);
  }

  // ──────────── Conflict Detection ────────────

  private async checkConflict(
    doctorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const conflicting = await this.slotsRepo
      .createQueryBuilder('slot')
      .where('slot.doctor_id = :doctorId', { doctorId })
      .andWhere('slot.start_time < :endTime', { endTime })
      .andWhere('slot.end_time > :startTime', { startTime })
      .getOne();

    if (conflicting) {
      throw new ConflictException(
        `Slot conflicts with existing slot: ${conflicting.start_time.toISOString()}-${conflicting.end_time.toISOString()}`,
      );
    }
  }
}
