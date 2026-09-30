import { PatientsService } from './patients.service';

describe('PatientsService.calculateAge', () => {
  const service = new PatientsService({} as never, {} as never);

  it('returns null when the date is missing or invalid', () => {
    expect(service.calculateAge(null)).toBeNull();
    expect(service.calculateAge(undefined)).toBeNull();
    expect(service.calculateAge('not-a-date')).toBeNull();
  });

  it('returns null for a future date', () => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    expect(service.calculateAge(nextYear)).toBeNull();
  });

  it('subtracts a year when the birthday has not happened yet', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate() + 1);
    expect(service.calculateAge(dob)).toBe(29);
  });

  it('counts a birthday that is today', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    expect(service.calculateAge(dob)).toBe(30);
  });
});
