/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateMolarMass, parseFormula } from './formulaParser';
import { balanceEquation } from './balancer';
import { calculateStoichiometry, StoichiometryResult } from './stoichiometry';
import { ATOMIC_MASSES } from './periodicTable';

/**
 * Erro customizado para falhas de sintaxe em fórmulas químicas.
 */
export class ChemistrySyntaxError extends Error {
  constructor(message: string) {
    super(`[Syntax Error]: ${message}`);
    this.name = "ChemistrySyntaxError";
  }
}

/**
 * Erro customizado para elementos não encontrados na tabela periódica.
 */
export class UnknownElementError extends Error {
  constructor(element: string) {
    super(`[Element Error]: O elemento "${element}" não existe na tabela periódica indexada.`);
    this.name = "UnknownElementError";
  }
}

/**
 * Representa uma molécula química com propriedades calculadas.
 * Abstrai a complexidade de parsing e cálculo de massa com validação estrita.
 */
export class Molecule {
  public readonly formula: string;
  public readonly molarMass: number;
  public readonly composition: Record<string, number>;

  constructor(formula: string) {
    this.formula = formula.trim();
    if (!this.formula) throw new ChemistrySyntaxError("A fórmula não pode estar vazia.");
    
    // Validação de caracteres permitidos (Letras, Números, Parênteses)
    if (!/^[A-Za-z0-9()]+$/.test(this.formula)) {
      throw new ChemistrySyntaxError("A fórmula contém caracteres inválidos. Use apenas letras, números e parênteses.");
    }

    try {
      this.composition = parseFormula(this.formula);
      
      // Validar se todos os elementos existem
      for (const element in this.composition) {
        if (!(element in ATOMIC_MASSES)) {
          throw new UnknownElementError(element);
        }
      }

      this.molarMass = calculateMolarMass(this.formula);
    } catch (error) {
      if (error instanceof UnknownElementError || error instanceof ChemistrySyntaxError) throw error;
      throw new ChemistrySyntaxError(error instanceof Error ? error.message : 'Falha ao processar fórmula');
    }
  }

  /**
   * Retorna a composição centesimal (porcentagem em massa de cada elemento).
   */
  public getMassComposition(): Record<string, { percentage: number; mass: number }> {
    const result: Record<string, { percentage: number; mass: number }> = {};
    for (const [element, quantity] of Object.entries(this.composition)) {
      const elementMass = ATOMIC_MASSES[element] * quantity;
      result[element] = {
        mass: elementMass,
        percentage: (elementMass / this.molarMass) * 100
      };
    }
    return result;
  }

  /**
   * Calcula a molaridade (mol/L) de uma solução.
   * @param mass Massa do soluto em gramas.
   * @param volume Volume da solução em Litros.
   */
  public calculateMolarity(mass: number, volume: number): number {
    if (volume <= 0) throw new Error("O volume deve ser maior que zero.");
    const moles = mass / this.molarMass;
    return moles / volume;
  }
}

/**
 * Utilitário para Leis dos Gases (PV = nRT)
 */
export class GasLaw {
  private static readonly R = 0.0821; // atm.L / mol.K

  /**
   * Calcula uma variável da equação PV=nRT.
   * Passe 'null' para a variável que deseja descobrir.
   */
  public static solve(p: number | null, v: number | null, n: number | null, t: number | null): number {
    if (p === null) return (n! * this.R * t!) / v!;
    if (v === null) return (n! * this.R * t!) / p!;
    if (n === null) return (p! * v!) / (this.R * t!);
    if (t === null) return (p! * v!) / (n! * this.R);
    return 0;
  }
}

/**
 * Representa uma reação química completa.
 */
export class Reaction {
  public readonly reactants: Molecule[];
  public readonly products: Molecule[];
  private _coefficients: number[] = [];
  private _isBalanced: boolean = false;

  constructor(equation: string) {
    if (!equation.includes('->')) {
      throw new ChemistrySyntaxError("A equação deve conter '->' para separar reagentes de produtos.");
    }

    const [left, right] = equation.split('->').map(s => s.trim());
    if (!left || !right) throw new ChemistrySyntaxError("Reagentes ou produtos ausentes.");

    this.reactants = left.split('+').map(s => new Molecule(s.trim()));
    this.products = right.split('+').map(s => new Molecule(s.trim()));
  }

  public balance(): string {
    const rawEq = `${this.reactants.map(m => m.formula).join(' + ')} -> ${this.products.map(m => m.formula).join(' + ')}`;
    const result = balanceEquation(rawEq);
    this._coefficients = result.coefficients;
    this._isBalanced = true;
    return `${result.reactants.join(' + ')} -> ${result.products.join(' + ')}`;
  }

  public calculate(
    reactantData: { mass: number; purity: number }[],
    productData: { mass?: number }[] = []
  ): StoichiometryResult {
    if (!this._isBalanced) this.balance();

    const formattedReactants = this.reactants.map((m, i) => ({
      formula: m.formula,
      mass: reactantData[i]?.mass || 0,
      purity: reactantData[i]?.purity || 100
    }));

    const formattedProducts = this.products.map((m, i) => ({
      formula: m.formula,
      mass: productData[i]?.mass
    }));

    return calculateStoichiometry(formattedReactants, formattedProducts, this._coefficients);
  }

  get isBalanced(): boolean { return this._isBalanced; }
}

/**
 * Fachada (Facade) para o motor químico.
 */
export class ChemistryEngine {
  public static createMolecule(formula: string): Molecule {
    return new Molecule(formula);
  }

  public static createReaction(equation: string): Reaction {
    return new Reaction(equation);
  }
  
  public static gasLaw() {
    return GasLaw;
  }
}
