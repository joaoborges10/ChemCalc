/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateMolarMass } from './formulaParser';

export interface StoichiometryResult {
  limitingReagent: string;
  excessReagents: Record<string, number>;
  theoreticalYield: number;
  actualYield: number;
  percentYield: number;
  molarMasses: Record<string, number>;
  steps: string[];
}

/**
 * Performs stoichiometric calculations based on balanced equation coefficients.
 * 
 * @param reactants - Array of reactant objects with formula, mass, and purity.
 * @param products - Array of product objects with formula and optional actual mass.
 * @param coefficients - Array of stoichiometric coefficients from the balanced equation.
 * @returns StoichiometryResult containing limiting reagent, excess, and yields.
 */
export function calculateStoichiometry(
  reactants: { formula: string; mass: number; purity: number }[],
  products: { formula: string; mass?: number }[],
  coefficients: number[]
): StoichiometryResult {
  const molarMasses: Record<string, number> = {};
  const reactantMoles: number[] = [];
  const steps: string[] = [];

  steps.push("--- Passo 1: Cálculo de Mols dos Reagentes ---");
  // Calculate moles for each reactant
  reactants.forEach((r, i) => {
    const mm = calculateMolarMass(r.formula);
    molarMasses[r.formula] = mm;
    const pureMass = r.mass * (r.purity / 100);
    const moles = pureMass / mm;
    reactantMoles.push(moles);
    steps.push(`${r.formula}: Massa Pura = ${r.mass}g * ${r.purity}% = ${pureMass.toFixed(3)}g`);
    steps.push(`${r.formula}: n = ${pureMass.toFixed(3)}g / ${mm.toFixed(3)}g/mol = ${moles.toFixed(4)} mol`);
  });

  steps.push("\n--- Passo 2: Identificação do Reagente Limitante ---");
  // Find limiting reagent
  // moles / coefficient
  let minRatio = Infinity;
  let limitingIndex = 0;
  reactantMoles.forEach((moles, i) => {
    const ratio = moles / coefficients[i];
    steps.push(`${reactants[i].formula}: Razão n/coef = ${moles.toFixed(4)} / ${coefficients[i]} = ${ratio.toFixed(4)}`);
    if (ratio < minRatio) {
      minRatio = ratio;
      limitingIndex = i;
    }
  });

  const limitingReagent = reactants[limitingIndex].formula;
  steps.push(`Reagente Limitante: ${limitingReagent} (menor razão)`);

  steps.push("\n--- Passo 3: Rendimento Teórico do Produto ---");
  // Theoretical yield of the first product
  const productFormula = products[0].formula;
  const productMM = calculateMolarMass(productFormula);
  molarMasses[productFormula] = productMM;
  const productCoeff = coefficients[reactants.length];
  const theoreticalMoles = minRatio * productCoeff;
  const theoreticalYield = theoreticalMoles * productMM;
  
  steps.push(`${productFormula}: n_teórico = ${minRatio.toFixed(4)} * ${productCoeff} = ${theoreticalMoles.toFixed(4)} mol`);
  steps.push(`${productFormula}: Massa Teórica = ${theoreticalMoles.toFixed(4)} mol * ${productMM.toFixed(3)} g/mol = ${theoreticalYield.toFixed(3)}g`);

  steps.push("\n--- Passo 4: Reagentes em Excesso ---");
  // Excess reagents
  const excessReagents: Record<string, number> = {};
  reactants.forEach((r, i) => {
    if (i !== limitingIndex) {
      const usedMoles = minRatio * coefficients[i];
      const excessMoles = reactantMoles[i] - usedMoles;
      const excessMass = excessMoles * molarMasses[r.formula];
      excessReagents[r.formula] = excessMass;
      steps.push(`${r.formula}: Usado = ${minRatio.toFixed(4)} * ${coefficients[i]} = ${usedMoles.toFixed(4)} mol`);
      steps.push(`${r.formula}: Sobra = ${reactantMoles[i].toFixed(4)} - ${usedMoles.toFixed(4)} = ${excessMoles.toFixed(4)} mol (${excessMass.toFixed(3)}g)`);
    }
  });

  // Yield calculation if actual mass is provided
  const actualYield = products[0].mass || 0;
  const percentYield = theoreticalYield > 0 ? (actualYield / theoreticalYield) * 100 : 0;

  if (actualYield > 0) {
    steps.push("\n--- Passo 5: Eficiência (Rendimento Real) ---");
    steps.push(`Rendimento Real Informado: ${actualYield.toFixed(3)}g`);
    steps.push(`Eficiência (η) = (${actualYield.toFixed(3)} / ${theoreticalYield.toFixed(3)}) * 100 = ${percentYield.toFixed(2)}%`);
  }

  return {
    limitingReagent,
    excessReagents,
    theoreticalYield,
    actualYield,
    percentYield,
    molarMasses,
    steps
  };
}
