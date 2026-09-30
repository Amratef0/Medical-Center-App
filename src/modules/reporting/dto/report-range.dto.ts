import { IsDateString } from 'class-validator';

export class ReportRangeQuery {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
