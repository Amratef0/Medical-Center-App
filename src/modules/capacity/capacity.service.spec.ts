import { ConflictException } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { QueryRunner } from 'typeorm';

describe('CapacityService utilization mapping', () => {
  const service = Object.create(CapacityService.prototype) as CapacityService;

  it('maps percentage to state using configured thresholds', () => {
    expect(service.mapPctToState(50, 80, 100)).toBe('AVAILABLE');
    expect(service.mapPctToState(80, 80, 100)).toBe('ALMOST_FULL');
    expect(service.mapPctToState(100, 80, 100)).toBe('FULL');
  });

  it('treats null limit as unlimited', () => {
    const row = service.buildUtilization('doctor', 5, null, { warn_pct: 80, full_pct: 100 });
    expect(row.state).toBe('AVAILABLE');
    expect(row.limit).toBeNull();
    expect(row.pct).toBe(0);
  });
});

describe('CapacityService.assertDoctorDailyCap', () => {
  it('rejects a booking when the doctor daily cap is already met', async () => {
    const svc = Object.create(CapacityService.prototype) as CapacityService;
    (svc as any).logger = { warn: jest.fn() };
    jest.spyOn(svc as any, 'getDoctor').mockResolvedValue({
      id: 'd1',
      name: 'Dr Test',
      max_sessions_per_day: 2,
    });
    jest.spyOn(svc, 'countDoctorSessionsOnDate').mockResolvedValue(2);

    await expect(
      svc.assertDoctorDailyCap({
        doctorId: 'd1',
        date: '2035-06-01',
        queryRunner: {} as QueryRunner,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
