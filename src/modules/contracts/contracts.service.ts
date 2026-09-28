import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract, ContractLetter, ContractStatus, CollectionStatus } from './contract.entity';
import {
  CreateContractDto,
  UpdateContractDto,
  CreateLetterDto,
  UpdateLetterDto,
} from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractsRepo: Repository<Contract>,
    @InjectRepository(ContractLetter)
    private lettersRepo: Repository<ContractLetter>,
  ) {}

  // ============ التعاقدات ============

  async createContract(dto: CreateContractDto): Promise<Contract> {
    if (dto.start_date && dto.end_date && new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException('تاريخ انتهاء التعاقد يجب أن يكون بعد أو يساوى تاريخ البداية');
    }

    const totalValue = dto.total_value ? Math.round(Number(dto.total_value) * 100) / 100 : 0;

    const contract = this.contractsRepo.create({
      ...dto,
      total_value: totalValue,
      remaining_amount: totalValue,
    });

    // توليد رقم التعاقد تلقائيًا إن لم يوجد بشكل آمن لتفادي التكرار
    if (!contract.contract_number) {
      const count = await this.contractsRepo.count();
      const year = new Date().getFullYear();
      const rand = Math.floor(100 + Math.random() * 900);
      contract.contract_number = `CNT-${year}-${String(count + 1).padStart(4, '0')}-${rand}`;
    }

    return this.contractsRepo.save(contract);
  }

  async findAllContracts(): Promise<Contract[]> {
    return this.contractsRepo.find({
      order: { created_at: 'DESC' },
      relations: ['letters'],
    });
  }

  async findActiveContracts(): Promise<Contract[]> {
    return this.contractsRepo.find({
      where: { status: ContractStatus.ACTIVE, is_active: true },
      order: { end_date: 'ASC' },
      relations: ['letters'],
    });
  }

  async findContractById(id: string): Promise<Contract> {
    const contract = await this.contractsRepo.findOne({
      where: { id },
      relations: ['letters'],
    });
    if (!contract) throw new NotFoundException('التعاقد غير موجود');
    return contract;
  }

  async updateContract(id: string, dto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findContractById(id);

    const startDate = dto.start_date ? new Date(dto.start_date) : new Date(contract.start_date);
    const endDate = dto.end_date ? new Date(dto.end_date) : new Date(contract.end_date);
    if (endDate < startDate) {
      throw new BadRequestException('تاريخ انتهاء التعاقد يجب أن يكون بعد أو يساوى تاريخ البداية');
    }

    Object.assign(contract, dto);

    // تحديث المبلغ المتبقي تلقائيًا بحسابات دقيقة
    if (dto.collected_amount !== undefined || dto.total_value !== undefined) {
      const total = dto.total_value !== undefined ? Number(dto.total_value) : Number(contract.total_value);
      const collected = dto.collected_amount !== undefined ? Number(dto.collected_amount) : Number(contract.collected_amount);
      
      const roundedTotal = Math.round(total * 100) / 100;
      const roundedCollected = Math.round(collected * 100) / 100;
      const roundedRemaining = Math.max(0, Math.round((roundedTotal - roundedCollected) * 100) / 100);

      contract.total_value = roundedTotal;
      contract.collected_amount = roundedCollected;
      contract.remaining_amount = roundedRemaining;

      // تحديث حالة التحصيل تلقائيًا
      if (roundedCollected >= roundedTotal && roundedTotal > 0) {
        contract.collection_status = CollectionStatus.FULLY_COLLECTED;
      } else if (roundedCollected > 0) {
        contract.collection_status = CollectionStatus.PARTIAL;
      }
    }

    return this.contractsRepo.save(contract);
  }

  async removeContract(id: string): Promise<void> {
    const contract = await this.findContractById(id);
    await this.contractsRepo.remove(contract);
  }

  async getContractStats() {
    const all = await this.contractsRepo.find();
    const active = all.filter((c) => c.status === ContractStatus.ACTIVE);
    const expired = all.filter((c) => c.status === ContractStatus.EXPIRED);
    const pending = all.filter((c) => c.status === ContractStatus.PENDING);

    const totalValue = all.reduce((sum, c) => sum + Number(c.total_value || 0), 0);
    const totalCollected = all.reduce((sum, c) => sum + Number(c.collected_amount || 0), 0);
    const totalRemaining = all.reduce((sum, c) => sum + Number(c.remaining_amount || 0), 0);

    // التعاقدات التي تنتهي خلال 30 يوم
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringContracts = active.filter(
      (c) => new Date(c.end_date) <= thirtyDaysFromNow,
    );

    return {
      total: all.length,
      active: active.length,
      expired: expired.length,
      pending: pending.length,
      totalValue,
      totalCollected,
      totalRemaining,
      collectionRate: totalValue > 0 ? ((totalCollected / totalValue) * 100).toFixed(1) : '0',
      expiringCount: expiringContracts.length,
    };
  }

  // ============ الخطابات/الجوابات ============

  async createLetter(dto: CreateLetterDto): Promise<ContractLetter> {
    // التحقق من وجود التعاقد
    await this.findContractById(dto.contract_id);

    const letter = this.lettersRepo.create(dto);
    return this.lettersRepo.save(letter);
  }

  async findLettersByContract(contractId: string): Promise<ContractLetter[]> {
    return this.lettersRepo.find({
      where: { contract_id: contractId },
      order: { letter_date: 'DESC' },
    });
  }

  async findAllLetters(): Promise<ContractLetter[]> {
    return this.lettersRepo.find({
      order: { letter_date: 'DESC' },
    });
  }

  async findLetterById(id: string): Promise<ContractLetter> {
    const letter = await this.lettersRepo.findOne({ where: { id } });
    if (!letter) throw new NotFoundException('الخطاب غير موجود');
    return letter;
  }

  async updateLetter(id: string, dto: UpdateLetterDto): Promise<ContractLetter> {
    const letter = await this.findLetterById(id);
    Object.assign(letter, dto);
    return this.lettersRepo.save(letter);
  }

  async removeLetter(id: string): Promise<void> {
    const letter = await this.findLetterById(id);
    await this.lettersRepo.remove(letter);
  }

  // تسجيل دفعة تحصيل
  async recordPayment(contractId: string, amount: number, notes?: string): Promise<Contract> {
    const contract = await this.findContractById(contractId);
    const parsedAmount = Math.round(Number(amount) * 100) / 100;
    const newCollected = Math.round((Number(contract.collected_amount) + parsedAmount) * 100) / 100;
    const totalVal = Number(contract.total_value);
    const newRemaining = Math.max(0, Math.round((totalVal - newCollected) * 100) / 100);

    contract.collected_amount = newCollected;
    contract.remaining_amount = newRemaining;

    if (newCollected >= totalVal && totalVal > 0) {
      contract.collection_status = CollectionStatus.FULLY_COLLECTED;
    } else if (newCollected > 0) {
      contract.collection_status = CollectionStatus.PARTIAL;
    }

    if (notes) {
      contract.notes = (contract.notes || '') + `\n[${new Date().toISOString().split('T')[0]}] تحصيل: ${parsedAmount} - ${notes}`;
    }

    return this.contractsRepo.save(contract);
  }
}
