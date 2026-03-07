/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ATOMIC_MASSES } from './periodicTable';

export type Composition = Record<string, number>;

/**
 * Parses a chemical formula string into a composition object.
 * Handles nested parentheses, e.g., (NH4)2SO4
 */
export function parseFormula(formula: string): Composition {
  const composition: Composition = {};
  const trimmedFormula = formula.trim();
  
  function parse(f: string, multiplier: number = 1) {
    // Handle parentheses, brackets, and braces
    let i = 0;
    while (i < f.length) {
      if (f[i] === '(' || f[i] === '[' || f[i] === '{') {
        const openChar = f[i];
        const closeChar = openChar === '(' ? ')' : openChar === '[' ? ']' : '}';
        
        // Find matching closing character
        let balance = 1;
        let j = i + 1;
        while (j < f.length && balance > 0) {
          if (f[j] === openChar) balance++;
          if (f[j] === closeChar) balance--;
          j++;
        }
        
        const subFormula = f.substring(i + 1, j - 1);
        // Find multiplier after closing character
        let k = j;
        let subMultiplierStr = "";
        while (k < f.length && /\d/.test(f[k])) {
          subMultiplierStr += f[k];
          k++;
        }
        const subMultiplier = subMultiplierStr === "" ? 1 : parseInt(subMultiplierStr);
        
        parse(subFormula, multiplier * subMultiplier);
        i = k;
      } else if (/[A-Z]/.test(f[i])) {
        // Parse element
        let element = f[i];
        let j = i + 1;
        while (j < f.length && /[a-z]/.test(f[j])) {
          element += f[j];
          j++;
        }
        
        // Parse quantity
        let quantityStr = "";
        while (j < f.length && /\d/.test(f[j])) {
          quantityStr += f[j];
          j++;
        }
        const quantity = quantityStr === "" ? 1 : parseInt(quantityStr);
        
        composition[element] = (composition[element] || 0) + quantity * multiplier;
        i = j;
      } else {
        i++;
      }
    }
  }

  parse(trimmedFormula);
  return composition;
}

export function calculateMolarMass(formula: string): number {
  const composition = parseFormula(formula);
  let totalMass = 0;
  for (const [element, quantity] of Object.entries(composition)) {
    const mass = ATOMIC_MASSES[element];
    if (mass === undefined) {
      throw new Error(`Elemento desconhecido: ${element}`);
    }
    totalMass += mass * quantity;
  }
  return totalMass;
}
