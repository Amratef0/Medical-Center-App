import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

// ============ حالات التعاقد ============
export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
}

// ============ حالات التحصيل ============
export enum CollectionStatus {
  NOT_STARTED = 'NOT_STARTED',
  PARTIAL = 'PARTIAL',
  FULLY_COLLECTED = 'FULLY_COLLECTED',
  OVERDUE = 'OVERDUE',
  DISPUTED = 'DISPUTED',
}

// ============ حالات الخطاب/الجواب ============
export enum LetterStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PENDING_RESPONSE = 'PENDING_RESPONSE',
  RESPONDED = 'RESPONDED',
  ARCHIVED = 'ARCHIVED',
}

// ============ نوع الخطاب ============
export enum LetterType {
  CONTRACT_OFFER = 'CONTRACT_OFFER',
  RENEWAL_NOTICE = 'RENEWAL_NOTICE',
  INVOICE_LETTER = 'INVOICE_LETTER',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  SERVICE_REPORT = 'SERVICE_REPORT',
  COMPLAINT = 'COMPLAINT',
  GENERAL = 'GENERAL',
}

// ============ جهة التعاقد ============
@Entity('contracts')
export class Contract {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'اسم جهة التعاقد' })
  @Column()
  organization_name: string;

  @ApiProperty({ description: 'اسم جهة الاتصال', required: false })
  @Column({ nullable: true })
  contact_person: string;

  @ApiProperty({ description: 'رقم الهاتف', required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ description: 'البريد الإلكتروني', required: false })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({ description: 'العنوان', required: false })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({ description: 'رقم التعاقد', required: false })
  @Column({ nullable: true, unique: true })
  contract_number: string;

  @ApiProperty({ description: 'تاريخ بدء التعاقد' })
  @Column({ type: 'date' })
  start_date: Date;

  @ApiProperty({ description: 'تاريخ انتهاء التعاقد' })
  @Column({ type: 'date' })
  end_date: Date;

  @ApiProperty({ description: 'قيمة التعاقد الإجمالية' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_value: number;

  @ApiProperty({ description: 'المبلغ المحصل' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  collected_amount: number;

  @ApiProperty({ description: 'المبلغ المتبقي' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  remaining_amount: number;

  @ApiProperty({ description: 'نسبة الخصم (%)', required: false })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @ApiProperty({ enum: ContractStatus, description: 'حالة التعاقد' })
  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.PENDING,
  })
  status: ContractStatus;

  @ApiProperty({ enum: CollectionStatus, description: 'حالة التحصيل' })
  @Column({
    type: 'enum',
    enum: CollectionStatus,
    default: CollectionStatus.NOT_STARTED,
  })
  collection_status: CollectionStatus;

  @ApiProperty({ description: 'ملاحظات', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'شروط الدفع', required: false })
  @Column({ type: 'text', nullable: true })
  payment_terms: string;

  @ApiProperty({ description: 'الخدمات المشمولة', required: false })
  @Column({ type: 'simple-array', nullable: true })
  covered_services: string[];

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => ContractLetter, (letter) => letter.contract, {
    cascade: true,
    eager: false,
  })
  letters: ContractLetter[];

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}

// ============ خطابات/جوابات التعاقد ============
@Entity('contract_letters')
export class ContractLetter {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'معرف التعاقد' })
  @Column()
  contract_id: string;

  @ApiProperty({ description: 'عنوان الخطاب' })
  @Column()
  subject: string;

  @ApiProperty({ description: 'محتوى الخطاب', required: false })
  @Column({ type: 'text', nullable: true })
  content: string;

  @ApiProperty({ enum: LetterType, description: 'نوع الخطاب' })
  @Column({
    type: 'enum',
    enum: LetterType,
    default: LetterType.GENERAL,
  })
  letter_type: LetterType;

  @ApiProperty({ enum: LetterStatus, description: 'حالة الخطاب' })
  @Column({
    type: 'enum',
    enum: LetterStatus,
    default: LetterStatus.DRAFT,
  })
  status: LetterStatus;

  @ApiProperty({ description: 'تاريخ الخطاب' })
  @Column({ type: 'date' })
  letter_date: Date;

  @ApiProperty({ description: 'تاريخ الاستلام', required: false })
  @Column({ type: 'date', nullable: true })
  received_date: Date;

  @ApiProperty({ description: 'تاريخ الرد', required: false })
  @Column({ type: 'date', nullable: true })
  response_date: Date;

  @ApiProperty({ description: 'رقم المرجع', required: false })
  @Column({ nullable: true })
  reference_number: string;

  @ApiProperty({ description: 'مسار المستند المرفق', required: false })
  @Column({ nullable: true })
  document_path: string;

  @ApiProperty({ description: 'المرسل', required: false })
  @Column({ nullable: true })
  sender: string;

  @ApiProperty({ description: 'المستلم', required: false })
  @Column({ nullable: true })
  recipient: string;

  @ApiProperty({ description: 'ملاحظات', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  // العلاقة مع التعاقد
  @ManyToOne(() => Contract, (contract) => contract.letters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
