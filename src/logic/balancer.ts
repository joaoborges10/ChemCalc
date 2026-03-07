/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseFormula, Composition } from './formulaParser';

/**
 * Balances a chemical equation.
 * Input: "H2 + O2 -> H2O"
 * Output: { reactants: ["2H2", "O2"], products: ["2H2O"] }
 */
export function balanceEquation(equation: string) {
  const [leftSide, rightSide] = equation.split('->').map(s => s.trim());
  if (!leftSide || !rightSide) throw new Error("Equação inválida. Use '->' para separar reagentes e produtos.");

  const reactants = leftSide.split('+').map(s => s.trim());
  const products = rightSide.split('+').map(s => s.trim());
  const allMolecules = [...reactants, ...products];

  // Get all unique elements
  const elements = new Set<string>();
  const moleculeCompositions: Composition[] = allMolecules.map(m => {
    const comp = parseFormula(m);
    Object.keys(comp).forEach(e => elements.add(e));
    return comp;
  });

  const elementList = Array.from(elements);
  const numMolecules = allMolecules.length;
  const numElements = elementList.length;

  // Build the matrix (rows = elements, cols = molecules)
  // Reactants have positive coefficients, products have negative
  const matrix: number[][] = Array.from({ length: numElements }, () => Array(numMolecules).fill(0));

  elementList.forEach((element, i) => {
    moleculeCompositions.forEach((comp, j) => {
      const count = comp[element] || 0;
      matrix[i][j] = j < reactants.length ? count : -count;
    });
  });

  // Solve using Gaussian elimination (simplified for integer results)
  // We want to find the smallest integer null space vector.
  // Since we only have one degree of freedom usually, we can try small integers for the last coefficient.
  
  const coefficients = solveMatrix(matrix);
  
  if (!coefficients) throw new Error("Não foi possível balancear a equação.");

  return {
    reactants: reactants.map((r, i) => (coefficients[i] === 1 ? "" : coefficients[i]) + r),
    products: products.map((p, i) => (coefficients[reactants.length + i] === 1 ? "" : coefficients[reactants.length + i]) + p),
    coefficients
  };
}

function solveMatrix(matrix: number[][]): number[] | null {
  const rows = matrix.length;
  const cols = matrix[0].length;

  // Gaussian elimination to RREF
  let pivotRow = 0;
  for (let pivotCol = 0; pivotCol < cols && pivotRow < rows; pivotCol++) {
    let maxRow = pivotRow;
    for (let r = pivotRow + 1; r < rows; r++) {
      if (Math.abs(matrix[r][pivotCol]) > Math.abs(matrix[maxRow][pivotCol])) maxRow = r;
    }

    if (Math.abs(matrix[maxRow][pivotCol]) < 1e-10) continue;

    [matrix[pivotRow], matrix[maxRow]] = [matrix[maxRow], matrix[pivotRow]];

    const pivotVal = matrix[pivotRow][pivotCol];
    for (let c = pivotCol; c < cols; c++) matrix[pivotRow][c] /= pivotVal;

    for (let r = 0; r < rows; r++) {
      if (r !== pivotRow) {
        const factor = matrix[r][pivotCol];
        for (let c = pivotCol; c < cols; c++) matrix[r][c] -= factor * matrix[pivotRow][c];
      }
    }
    pivotRow++;
  }

  // Find a solution in the null space
  // For simplicity, we assume one free variable (the last one)
  // We try values for the last variable until all coefficients are integers
  const solution = new Array(cols).fill(0);
  for (let scale = 1; scale <= 100; scale++) {
    solution[cols - 1] = scale;
    let valid = true;
    for (let r = 0; r < pivotRow; r++) {
      let sum = 0;
      let pivotCol = -1;
      for (let c = 0; c < cols - 1; c++) {
        if (Math.abs(matrix[r][c] - 1) < 1e-10) {
          pivotCol = c;
          break;
        }
      }
      if (pivotCol !== -1) {
        // x_pivot = - sum(matrix[r][c] * x_c) for c > pivotCol
        let val = -matrix[r][cols - 1] * scale;
        if (Math.abs(val - Math.round(val)) > 1e-5 || Math.round(val) <= 0) {
          valid = false;
          break;
        }
        solution[pivotCol] = Math.round(val);
      }
    }
    if (valid) return solution;
  }

  return null;
}
