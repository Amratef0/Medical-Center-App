import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import {
  CreateContractDto,
  UpdateContractDto,
  CreateLetterDto,
  UpdateLetterDto,
  RecordPaymentDto,
} from './dto/contract.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Contracts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  // ============ التعاقدات ============

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'إنشاء تعاقد جديد' })
  createContract(@Body() dto: CreateContractDto) {
    return this.contractsService.createContract(dto);
  }

  @Get()
  @ApiOperation({ summary: 'جلب جميع التعاقدات' })
  findAllContracts() {
    return this.contractsService.findAllContracts();
  }

  @Get('active')
  @ApiOperation({ summary: 'جلب التعاقدات النشطة فقط' })
  findActiveContracts() {
    return this.contractsService.findActiveContracts();
  }

  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات التعاقدات' })
  getStats() {
    return this.contractsService.getContractStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب تعاقد بالمعرف' })
  findContractById(@Param('id') id: string) {
    return this.contractsService.findContractById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'تحديث تعاقد' })
  updateContract(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.updateContract(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف تعاقد (Admin فقط)' })
  removeContract(@Param('id') id: string) {
    return this.contractsService.removeContract(id);
  }

  @Post(':id/payment')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'تسجيل دفعة تحصيل' })
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.contractsService.recordPayment(id, dto.amount, dto.notes);
  }

  // ============ الخطابات/الجوابات ============

  @Post('letters')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'إنشاء خطاب/جواب جديد' })
  createLetter(@Body() dto: CreateLetterDto) {
    return this.contractsService.createLetter(dto);
  }

  @Get('letters/all')
  @ApiOperation({ summary: 'جلب جميع الخطابات' })
  findAllLetters() {
    return this.contractsService.findAllLetters();
  }

  @Get(':contractId/letters')
  @ApiOperation({ summary: 'جلب خطابات تعاقد محدد' })
  findLettersByContract(@Param('contractId') contractId: string) {
    return this.contractsService.findLettersByContract(contractId);
  }

  @Get('letters/:id')
  @ApiOperation({ summary: 'جلب خطاب بالمعرف' })
  findLetterById(@Param('id') id: string) {
    return this.contractsService.findLetterById(id);
  }

  @Put('letters/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'تحديث خطاب' })
  updateLetter(@Param('id') id: string, @Body() dto: UpdateLetterDto) {
    return this.contractsService.updateLetter(id, dto);
  }

  @Delete('letters/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف خطاب (Admin فقط)' })
  removeLetter(@Param('id') id: string) {
    return this.contractsService.removeLetter(id);
  }
}
