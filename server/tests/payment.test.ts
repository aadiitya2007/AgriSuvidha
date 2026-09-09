import { describe, it, expect } from 'vitest';
import { procurementService } from '../src/services/procurement.service';
import { QualityGrade } from '@prisma/client';

describe('Procurement Grading & Payment Calculations', () => {
  it('should assign Grade A with 0 deduction for dry FAQ grain (moisture <= 12%)', () => {
    const result = procurementService.calculateGradeAndDeductions({
      commodityCode: 'WHT-01',
      moisture: 11.5,
      foreignMatter: 0.5,
      mspPrice: 2275.0,
      submittedWeight: 100.0,
    });

    expect(result.qualityGrade).toBe(QualityGrade.GRADE_A);
    expect(result.ratePerUnit).toBe(2275.0);
    expect(result.grossPayable).toBe(227500.0);
    expect(result.deductions).toBe(0);
    expect(result.netPayable).toBe(227500.0);
  });

  it('should assign Grade B with slight deduction for moisture between 12% and 14%', () => {
    const result = procurementService.calculateGradeAndDeductions({
      commodityCode: 'WHT-01',
      moisture: 13.5,
      foreignMatter: 0.9,
      mspPrice: 2275.0,
      submittedWeight: 50.0,
    });

    expect(result.qualityGrade).toBe(QualityGrade.GRADE_B);
    expect(result.ratePerUnit).toBeLessThan(2275.0);
    expect(result.deductions).toBeGreaterThan(0);
    expect(result.netPayable).toBe(result.grossPayable - result.deductions);
  });

  it('should reject grain exceeding maximum acceptable moisture (>16%)', () => {
    const result = procurementService.calculateGradeAndDeductions({
      commodityCode: 'WHT-01',
      moisture: 18.0,
      foreignMatter: 2.0,
      mspPrice: 2275.0,
      submittedWeight: 60.0,
    });

    expect(result.qualityGrade).toBe(QualityGrade.REJECTED);
    expect(result.ratePerUnit).toBe(0);
    expect(result.netPayable).toBe(0);
    expect(result.deductionReason).toContain('exceeds maximum');
  });
});
