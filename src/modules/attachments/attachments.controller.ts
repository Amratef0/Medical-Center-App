import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { JwtAccessGuard, OptionalJwtAccessGuard } from '../../common/guards/jwt.guards';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';
import { AttachmentsService } from './attachments.service';
import {
  ConfirmAttachmentDto,
  PresignAttachmentDto,
} from './dto/attachment.dto';

@ApiTags('Attachments')
@ApiBearerAuth('access-token')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('presign')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  )
  @ApiOperation({ summary: 'Request a pre-signed upload URL' })
  presign(@Body() dto: PresignAttachmentDto, @CurrentUser() user: User) {
    return this.attachmentsService.presign(dto, user);
  }

  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  )
  @ApiOperation({ summary: 'Confirm upload and create attachment record' })
  confirm(@Body() dto: ConfirmAttachmentDto, @CurrentUser() user: User) {
    return this.attachmentsService.confirm(dto, user);
  }

  @Put('local-upload')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  )
  @ApiOperation({ summary: 'Local driver: upload file bytes (PUT body)' })
  async localUpload(
    @Headers('x-storage-key') storageKey: string,
    @Headers('content-type') contentType: string,
    @Req() req: ExpressRequest,
    @CurrentUser() user: User,
  ) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);
    return this.attachmentsService.saveLocalUpload(storageKey, body, contentType, user);
  }

  @Get(':id/file')
  @UseGuards(OptionalJwtAccessGuard)
  @ApiOperation({ summary: 'Stream attachment (auth or short-lived signed URL)' })
  async streamFile(
    @Param('id') id: string,
    @Query('expires') expires: string | undefined,
    @Query('sig') sig: string | undefined,
    @CurrentUser() user: User | undefined,
    @Res() res: ExpressResponse,
  ) {
    const result = await this.attachmentsService.streamFile(id, user, { expires, sig });
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Length', result.buffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${result.fileName}"`);
    res.send(result.buffer);
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  )
  @ApiOperation({ summary: 'Get a short-lived download URL' })
  getDownload(@Param('id') id: string, @CurrentUser() user: User) {
    return this.attachmentsService.getDownloadUrl(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Delete attachment (admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.attachmentsService.remove(id, user);
  }
}
