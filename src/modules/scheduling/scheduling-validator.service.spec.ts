import { SessionType } from '../sessions/session.entity';
import { SchedulingValidator } from './scheduling-validator.service';

describe('SchedulingValidator.resolveDurationMinutes', () => {
  it('keeps an explicit duration', () => {
    expect(SchedulingValidator.resolveDurationMinutes(30, SessionType.ASSESSMENT)).toBe(30);
  });

  it('uses 60 minutes for an assessment when none is given', () => {
    expect(SchedulingValidator.resolveDurationMinutes(null, SessionType.ASSESSMENT)).toBe(60);
    expect(SchedulingValidator.resolveDurationMinutes(0, SessionType.ASSESSMENT)).toBe(60);
  });

  it('uses 45 minutes for every other type when none is given', () => {
    expect(SchedulingValidator.resolveDurationMinutes(undefined, SessionType.TREATMENT)).toBe(45);
  });
});
