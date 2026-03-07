# engine.py
from parser import FormulaParser, ChemistrySyntaxError, UnknownElementError
from atoms import ATOMIC_MASSES

class Molecule:
    """Representa uma molécula química com validação estrita."""
    def __init__(self, formula):
        self.formula = formula.strip()
        # O parser agora já valida sintaxe e existência de elementos
        self.composition = FormulaParser.parse(self.formula)
        self.molar_mass = FormulaParser.calculate_molar_mass(self.formula)

    def get_mass_composition(self):
        """Retorna a porcentagem em massa de cada elemento."""
        res = {}
        for el, qty in self.composition.items():
            mass = ATOMIC_MASSES[el] * qty
            res[el] = {
                "mass": mass,
                "percentage": (mass / self.molar_mass) * 100
            }
        return res

class GasLaw:
    """Utilitário para cálculos de PV = nRT."""
    R = 0.0821 # atm.L / mol.K

    @staticmethod
    def solve(p=None, v=None, n=None, t=None):
        """Resolve PV=nRT para a variável que for None."""
        if p is None: return (n * GasLaw.R * t) / v
        if v is None: return (n * GasLaw.R * t) / p
        if n is None: return (p * v) / (GasLaw.R * t)
        if t is None: return (p * v) / (n * GasLaw.R)

class Reaction:
    def __init__(self, equation_str):
        if "->" not in equation_str:
            raise ValueError("Equação deve conter '->'")
        left, right = equation_str.split("->")
        self.reactants = [Molecule(m) for m in left.split("+")]
        self.products = [Molecule(m) for m in right.split("+")]
