import { SessionStatus, SessionType } from '../src/modules/sessions/session.entity';

describe('placeholder removed', () => {
  it('is covered by booking.e2e-spec.ts', () => {
    expect(SessionType.ASSESSMENT).toBe('ASSESSMENT');
    expect(SessionStatus.SCHEDULED).toBe('SCHEDULED');
  });
});
