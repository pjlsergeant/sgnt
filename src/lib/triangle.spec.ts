import { describe, it, expect } from 'vitest';
import { calculateArea, calculatePerimeter, isValidTriangle } from './triangle';

describe('triangle', () => {
  describe('calculateArea', () => {
    it('should calculate the area of a triangle', () => {
      expect(calculateArea(10, 5)).toBe(25);
      expect(calculateArea(6, 8)).toBe(24);
    });

    it('should return 0 for zero base or height', () => {
      expect(calculateArea(0, 5)).toBe(0);
      expect(calculateArea(10, 0)).toBe(0);
    });
  });

  describe('calculatePerimeter', () => {
    it('should calculate the perimeter of a triangle', () => {
      expect(calculatePerimeter(3, 4, 5)).toBe(12);
      expect(calculatePerimeter(10, 10, 10)).toBe(30);
    });
  });

  describe('isValidTriangle', () => {
    it('should return true for valid triangles', () => {
      expect(isValidTriangle(3, 4, 5)).toBe(true);
      expect(isValidTriangle(10, 10, 10)).toBe(true);
    });

    it('should return false for invalid triangles', () => {
      expect(isValidTriangle(1, 2, 10)).toBe(false);
      expect(isValidTriangle(5, 1, 1)).toBe(false);
    });
  });
});
