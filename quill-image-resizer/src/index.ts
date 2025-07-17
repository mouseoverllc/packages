// src/index.ts

/**
 * Greets a person by name.
 * @param {string} name - The name of the person to greet.
 * @returns {string} A greeting message.
 */
export function greet(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Name must be a non-empty string.');
  }
  return `Hello, ${name}! Welcome to your first npm package!`;
}

/**
 * Calculates the square of a number.
 * @param {number} num - The number to square.
 * @returns {number} The square of the number.
 */
export function square(num: number): number {
  if (typeof num !== 'number') {
    throw new Error('Input must be a number.');
  }
  return num * num;
}