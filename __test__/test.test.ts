import { ESol } from "../src/eSol";

const test = new ESol()

const add = (a: number, b: number) => {
  return a + b;
};

describe('test add function', () => {
  it('should return 15 for add(10,5)', () => {
    expect(test.add(10, 5)).toBe(15);
  });
  it('should return 5 for add(2,3)', () => {
    expect(test.add(2, 3)).toBe(5);
  });
});
