export function calculateArea(base: number, height: number): number {
  return (base * height) / 2;
}

export function calculatePerimeter(a: number, b: number, c: number): number {
  return a + b + c;
}

export function isValidTriangle(a: number, b: number, c: number): boolean {
  return a + b > c && a + c > b && b + c > a;
}
