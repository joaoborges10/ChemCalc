# test_chemistry.py
import unittest
from parser import FormulaParser, ChemistrySyntaxError, UnknownElementError
from engine import Molecule, GasLaw

class TestChemistryLogic(unittest.TestCase):
    """
    Testes automatizados para a lógica química do ChemCalc.
    """
    
    def test_molar_mass_water(self):
        mm = FormulaParser.calculate_molar_mass("H2O")
        self.assertAlmostEqual(mm, 18.015, places=3)

    def test_parentheses_parsing(self):
        comp = FormulaParser.parse("(NH4)2SO4")
        self.assertEqual(comp["N"], 2)
        self.assertEqual(comp["H"], 8)

    def test_syntax_error(self):
        """Garante que caracteres inválidos disparam ChemistrySyntaxError"""
        with self.assertRaises(ChemistrySyntaxError):
            FormulaParser.parse("H2O!")
        with self.assertRaises(ChemistrySyntaxError):
            FormulaParser.parse("H2-O")

    def test_unknown_element_error(self):
        """Garante que elementos inexistentes disparam UnknownElementError"""
        with self.assertRaises(UnknownElementError):
            FormulaParser.parse("Abc2")

    def test_mass_composition(self):
        """Teste de composição centesimal"""
        water = Molecule("H2O")
        comp = water.get_mass_composition()
        # H: (2.016 / 18.015) * 100 = ~11.19%
        self.assertAlmostEqual(comp["H"]["percentage"], 11.19, delta=0.1)
        # O: (15.999 / 18.015) * 100 = ~88.81%
        self.assertAlmostEqual(comp["O"]["percentage"], 88.81, delta=0.1)

    def test_gas_law(self):
        """Teste da Lei dos Gases Ideais (PV=nRT)"""
        # Calcular Volume: n=1, T=273.15, P=1 -> V should be ~22.4L
        v = GasLaw.solve(p=1, n=1, t=273.15)
        self.assertAlmostEqual(v, 22.42, delta=0.1)

if __name__ == '__main__':
    unittest.main()
