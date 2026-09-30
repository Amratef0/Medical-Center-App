import { SessionStatus, SessionType } from './session.entity';
import { SessionsService } from './sessions.service';

describe('SessionsService.calculateDurationAndAlert', () => {
  const service = new SessionsService({} as never, {} as never, {} as never, { notifyAssessmentEndedEarlier: async () => undefined } as never);

  function run(session: Record<string, unknown>) {
    (service as unknown as { calculateDurationAndAlert: (row: Record<string, unknown>) => void })
      .calculateDurationAndAlert(session);
    return session;
  }

  it('flags an assessment that ends more than 15 minutes early', () => {
    const session = run({
      id: 's1',
      session_type: SessionType.ASSESSMENT,
      scheduled_duration_minutes: 60,
      start_time: new Date('2026-01-01T10:00:00Z'),
      end_time: new Date('2026-01-01T10:10:00Z'),
    });
    expect(session.actual_duration_minutes).toBe(10);
    expect(session.duration_warning_generated).toBe(true);
  });

  it('does not flag an assessment that runs the scheduled length', () => {
    const session = run({
      id: 's2',
      session_type: SessionType.ASSESSMENT,
      scheduled_duration_minutes: 60,
      start_time: new Date('2026-01-01T10:00:00Z'),
      end_time: new Date('2026-01-01T11:00:00Z'),
    });
    expect(session.actual_duration_minutes).toBe(60);
    expect(session.duration_warning_generated).toBeFalsy();
  });

  it('records duration for a treatment without the early-finish warning', () => {
    const session = run({
      id: 's3',
      session_type: SessionType.TREATMENT,
      scheduled_duration_minutes: 45,
      status: SessionStatus.SCHEDULED,
      start_time: new Date('2026-01-01T10:00:00Z'),
      end_time: new Date('2026-01-01T10:10:00Z'),
    });
    expect(session.actual_duration_minutes).toBe(10);
    expect(session.duration_warning_generated).toBeFalsy();
  });

  it('still marks payment verified when storing the alert throws', async () => {
    const session = {
      id: 's',
      session_type: SessionType.ASSESSMENT,
      payment_verified: false,
      patient: { first_name: 'A' },
    };
    const sessionsRepo = {
      findOne: jest.fn().mockResolvedValue(session),
      save: jest.fn().mockImplementation(async (row) => row),
    };
    const notifications = {
      notifyPaymentVerified: jest.fn().mockRejectedValue(new Error('store down')),
    };
    const withStore = new SessionsService(
      sessionsRepo as never,
      {} as never,
      {} as never,
      notifications as never,
    );
    const saved = await withStore.verifyPayment('s', { name: 'Finance', email: 'f@test.com' } as never);
    expect(saved.payment_verified).toBe(true);
  });
});
