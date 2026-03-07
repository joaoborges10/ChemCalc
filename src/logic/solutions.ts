/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateMolarMass } from './formulaParser';

/**
 * Calculates molarity (M = n / V)
 * @param mass - Mass of solute in grams
 * @param formula - Chemical formula of solute
 * @param volume - Volume of solution in liters
 * @returns Molarity in mol/L
 */
export function calculateMolarity(mass: number, formula: string, volume: number): number {
  const mm = calculateMolarMass(formula);
  const moles = mass / mm;
  return moles / volume;
}

/**
 * Calculates mass needed for a specific molarity
 * @param molarity - Target molarity in mol/L
 * @param formula - Chemical formula of solute
 * @param volume - Volume of solution in liters
 * @returns Mass in grams
 */
export function calculateMassForMolarity(molarity: number, formula: string, volume: number): number {
  const mm = calculateMolarMass(formula);
  const moles = molarity * volume;
  return moles * mm;
}

/**
 * Calculates dilution (C1 * V1 = C2 * V2)
 * @param c1 - Initial concentration
 * @param v1 - Initial volume
 * @param c2 - Final concentration
 * @param v2 - Final volume
 * @returns The missing value (one must be null)
 */
export function calculateDilution(
  c1: number | null,
  v1: number | null,
  c2: number | null,
  v2: number | null
): number {
  if (c1 === null) return (c2! * v2!) / v1!;
  if (v1 === null) return (c2! * v2!) / c1!;
  if (c2 === null) return (c1! * v1!) / v2!;
  if (v2 === null) return (c1! * v1!) / c2!;
  return 0;
}

/**
 * Converts volume of gas to moles at STP (22.4 L/mol)
 * @param volume - Volume in liters
 * @returns Moles
 */
export function volumeToMolesSTP(volume: number): number {
  return volume / 22.4;
}

/**
 * Converts moles to volume of gas at STP (22.4 L/mol)
 * @param moles - Moles
 * @returns Volume in liters
 */
export function molesToVolumeSTP(moles: number): number {
  return moles * 22.4;
}
