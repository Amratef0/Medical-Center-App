import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './package.entity';
import { PackageService } from './package-service.entity';
import { PatientPackage, PatientPackageStatus } from './patient-package.entity';
import {
  CreatePackageDto,
  UpdatePackageDto,
  AssignPackageDto,
} from './dto/package.dto';
import { User } from '../users/user.entity';
import { Session, SessionStatus, SessionType } from '../sessions/session.entity';

import { SchedulingService } from '../scheduling/scheduling.service';
import { Doctor } from '../doctors/doctor.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packagesRepo: Repository<Package>,
    @InjectRepository(PackageService)
    private packageServicesRepo: Repository<PackageService>,
    @InjectRepository(PatientPackage)
    private patientPackagesRepo: Repository<PatientPackage>,
    @InjectRepository(Session)
    private sessionsRepo: Repository<Session>,
    @InjectRepository(Doctor)
    private doctorsRepo: Repository<Doctor>,
    private schedulingService: SchedulingService,
  ) {}

  // ──────────── Package CRUD ────────────

  async create(dto: CreatePackageDto): Promise<Package> {
    const { services, ...packageData } = dto;

    const pkg = this.packagesRepo.create(packageData);
    const savedPkg = await this.packagesRepo.save(pkg);

    if (services && services.length > 0) {
      const packageServices = services.map((s) =>
        this.packageServicesRepo.create({
          package_id: savedPkg.id,
          service_id: s.service_id,
          session_count: s.session_count,
        }),
      );
      await this.packageServicesRepo.save(packageServices);
    }

    return this.findOne(savedPkg.id);
  }

  async findAll(): Promise<Package[]> {
    return this.packagesRepo.find({
      relations: ['package_services', 'package_services.service'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Package> {
    const pkg = await this.packagesRepo.findOne({
      where: { id },
      relations: ['package_services', 'package_services.service'],
    });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto): Promise<Package> {
    const pkg = await this.findOne(id);
    const { services, ...updateData } = dto;

    Object.assign(pkg, updateData);
    await this.packagesRepo.save(pkg);

    if (services) {
      // Replace existing package services
      await this.packageServicesRepo.delete({ package_id: id });
      const packageServices = services.map((s) =>
        this.packageServicesRepo.create({
          package_id: id,
          service_id: s.service_id,
          session_count: s.session_count,
        }),
      );
      await this.packageServicesRepo.save(packageServices);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const pkg = await this.findOne(id);
    await this.packagesRepo.remove(pkg);
  }

  // ──────────── Patient Package Assignment ────────────

  async assignToPatient(
    dto: AssignPackageDto,
    assignedBy: User,
  ): Promise<PatientPackage> {
    const pkg = await this.findOne(dto.package_id);
    if (!pkg.is_active) {
      throw new BadRequestException('Cannot assign an inactive package');
    }

    const startDate = new Date();
    let endDate: Date | undefined = undefined;
    if (pkg.expiry_days) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + pkg.expiry_days);
    }

    // Calculate total sessions from package services
    let totalSessions = pkg.total_sessions || 0;
    if (!totalSessions && pkg.package_services?.length > 0) {
      totalSessions = pkg.package_services.reduce(
        (sum, ps) => sum + ps.session_count,
        0,
      );
    }

    const patientPackage = this.patientPackagesRepo.create({
      patient_id: dto.patient_id,
      package_id: dto.package_id,
      remaining_sessions: totalSessions,
      status: PatientPackageStatus.ACTIVE,
      start_date: startDate,
      end_date: endDate,
      discount_type: dto.discount_type,
      discount_amount: dto.discount_amount,
      notes: dto.notes,
    });

    if (pkg.price != null && dto.discount_amount != null && dto.discount_amount > 0) {
      if (dto.discount_type === 'percentage') {
        patientPackage.final_price = pkg.price - (pkg.price * (dto.discount_amount / 100));
      } else {
        // fixed
        patientPackage.final_price = pkg.price - dto.discount_amount;
      }
      if (patientPackage.final_price < 0) {
         patientPackage.final_price = 0;
      }
    } else if (pkg.price != null) {
      patientPackage.final_price = pkg.price;
    }

    const savedPP = await this.patientPackagesRepo.save(patientPackage);

    if (dto.auto_book && pkg.package_services?.length > 0) {
      // Find the doctor from the last session for this patient.
      const lastSession = await this.sessionsRepo.findOne({
        where: { patient_id: dto.patient_id, status: 'ATTENDED' as any },
        order: { session_date: 'DESC' },
        relations: ['doctor'],
      });

      if (lastSession && lastSession.doctor_id) {
        let primaryDoctorId = lastSession.doctor_id;
        const specialization = lastSession.doctor?.specialization;
         
        // For each service in the package, try to auto-book
        for (const ps of pkg.package_services) {
          let neededSessions = ps.session_count;
          if (neededSessions <= 0) continue;
            
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          // Get slots for the primary doctor
          let availableSlots = await this.schedulingService.findAvailableSlots({
            doctor_id: primaryDoctorId,
            service_id: ps.service_id,
            from: tomorrow.toISOString(),
          });

          const getUniqueDaysCount = (slots: any[]) => {
            const days = new Set<string>();
            slots.forEach(s => {
              const d = new Date(s.start_time);
              days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
            });
            return days.size;
          };

          // If we need more sessions but primary doctor has no slots, find other doctors in same specialization
          if (getUniqueDaysCount(availableSlots) < neededSessions && specialization) {
            const alternativeDoctors = await this.doctorsRepo.find({
              where: { specialization: specialization, is_active: true }
            });
            for (const altDoc of alternativeDoctors) {
               if (altDoc.id === primaryDoctorId) continue;
               
               const altSlots = await this.schedulingService.findAvailableSlots({
                  doctor_id: altDoc.id,
                  service_id: ps.service_id,
                  from: tomorrow.toISOString(),
               });
               
               availableSlots = availableSlots.concat(altSlots);
               if (getUniqueDaysCount(availableSlots) >= neededSessions) break;
            }
            
            // Sort by start_time so we book earliest possible slots
            availableSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
          }

          const bookedDates = new Set<string>();

          for (const slot of availableSlots) {
            if (neededSessions <= 0) break;
            
            const slotDate = new Date(slot.start_time);
            const dateString = `${slotDate.getFullYear()}-${slotDate.getMonth()}-${slotDate.getDate()}`;
            
            if (bookedDates.has(dateString)) {
               continue; // Only one session per day
            }
                
            // Book the slot
            await this.schedulingService.bookSlot(slot.id);
                
            // Create a session
            const session = this.sessionsRepo.create({
              patient_id: dto.patient_id,
              doctor_id: slot.doctor_id || primaryDoctorId,
              service_id: ps.service_id,
              slot_id: slot.id,
              patient_package_id: savedPP.id,
              session_type: SessionType.TREATMENT,
              session_date: slot.start_time,
              status: SessionStatus.SCHEDULED,
              is_deducted: false,
            });
            await this.sessionsRepo.save(session);
            bookedDates.add(dateString);
            neededSessions--;
          }

          // Fallback: If we still need sessions but ran out of slots, create manual sessions
          if (neededSessions > 0) {
             let lastDate = tomorrow;
             if (availableSlots.length > 0) {
                 const lastSlot = availableSlots[availableSlots.length - 1];
                 lastDate = new Date(lastSlot.start_time);
             }

             while (neededSessions > 0) {
                 lastDate.setDate(lastDate.getDate() + 1);
                 const dateString = `${lastDate.getFullYear()}-${lastDate.getMonth()}-${lastDate.getDate()}`;
                 
                 // Ensure we don't book on a date we already booked
                 if (bookedDates.has(dateString)) {
                     continue;
                 }

                 const sessionDate = new Date(lastDate);
                 sessionDate.setHours(10, 0, 0, 0); // Default to 10:00 AM

                 const session = this.sessionsRepo.create({
                   patient_id: dto.patient_id,
                   doctor_id: primaryDoctorId,
                   service_id: ps.service_id,
                   patient_package_id: savedPP.id,
                   session_type: SessionType.TREATMENT,
                   session_date: sessionDate,
                   status: SessionStatus.SCHEDULED,
                   is_deducted: false,
                 });
                 await this.sessionsRepo.save(session);
                 
                 bookedDates.add(dateString);
                 neededSessions--;
             }
          }
        }
      }
    }

    return savedPP;
  }

  async getPatientPackages(patientId: string): Promise<PatientPackage[]> {
    return this.patientPackagesRepo.find({
      where: { patient_id: patientId },
      relations: ['package', 'package.package_services', 'package.package_services.service'],
      order: { created_at: 'DESC' },
    });
  }

  async getPatientActivePackage(patientId: string): Promise<PatientPackage | null> {
    return this.patientPackagesRepo.findOne({
      where: {
        patient_id: patientId,
        status: PatientPackageStatus.ACTIVE,
      },
      relations: ['package'],
    });
  }

  async deductSession(patientPackageId: string): Promise<PatientPackage> {
    const pp = await this.patientPackagesRepo.findOne({
      where: { id: patientPackageId },
    });
    if (!pp) throw new NotFoundException('Patient package not found');

    if (pp.status !== PatientPackageStatus.ACTIVE) {
      throw new BadRequestException('Patient package is not active');
    }

    if (pp.remaining_sessions <= 0) {
      throw new BadRequestException('No sessions remaining');
    }

    // Check expiry
    if (pp.end_date && new Date() > new Date(pp.end_date)) {
      pp.status = PatientPackageStatus.EXPIRED;
      await this.patientPackagesRepo.save(pp);
      throw new BadRequestException('Patient package has expired');
    }

    pp.remaining_sessions -= 1;

    if (pp.remaining_sessions === 0) {
      pp.status = PatientPackageStatus.EXHAUSTED;
    }

    return this.patientPackagesRepo.save(pp);
  }

  async getCompletedFirstSessions(dateString?: string): Promise<Session[]> {
    const targetDate = dateString ? new Date(dateString) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Step 1: Get all ATTENDED sessions for the day
    const sessions = await this.sessionsRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.patient', 'patient')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .where('session.status = :status', { status: 'ATTENDED' })
      .andWhere('session.session_date >= :targetDate', { targetDate })
      .andWhere('session.session_date < :nextDate', { nextDate })
      .orderBy('session.session_date', 'DESC')
      .getMany();

    if (sessions.length === 0) return [];

    // Step 2: Get patients who already have an active package
    const patientIds = sessions.map((s) => s.patient_id);

    const activePackages = await this.patientPackagesRepo
      .createQueryBuilder('pp')
      .select('pp.patient_id')
      .where('pp.patient_id IN (:...patientIds)', { patientIds })
      .andWhere('pp.status = :activeStatus', { activeStatus: PatientPackageStatus.ACTIVE })
      .getRawMany();

    const patientsWithPackage = new Set(activePackages.map((p) => p.pp_patient_id));

    // Step 3: Filter out patients who already have an active package
    return sessions.filter((s) => !patientsWithPackage.has(s.patient_id));
  }
}
