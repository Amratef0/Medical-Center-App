import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAccessGuard } from '../../common/guards/jwt.guards';
import { JwtRefreshGuard } from '../../common/guards/jwt.guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({
    default: {
      limit: Number(process.env.THROTTLE_LOGIN_LIMIT ?? 5),
      ttl: Number(process.env.THROTTLE_LOGIN_TTL_MS ?? 900_000),
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get access + refresh tokens' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@CurrentUser() user: User) {
    return this.authService.refreshTokens(user);
  }

  @Post('logout')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }
}
