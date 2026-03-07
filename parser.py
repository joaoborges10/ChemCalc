# parser.py
import re
from atoms import ATOMIC_MASSES

class ChemistrySyntaxError(Exception):
    """Erro disparado quando a fórmula possui erros de digitação ou caracteres inválidos."""
    pass

class UnknownElementError(Exception):
    """Erro disparado quando um elemento não existe na tabela periódica."""
    pass

class FormulaParser:
    """
    Módulo responsável por converter strings de fórmulas químicas em dados estruturados.
    Utiliza Expressões Regulares (Regex) para identificar símbolos e quantidades.
    """
    
    @staticmethod
    def parse(formula):
        """
        Analisa uma fórmula química (ex: H2SO4, (NH4)2SO4) e retorna um dicionário
        com a contagem de átomos de cada elemento.
        """
        formula = formula.strip()
        if not formula:
            return {}
            
        # Validação de caracteres
        if not re.match(r'^[A-Za-z0-9()]+$', formula):
            raise ChemistrySyntaxError("A fórmula contém caracteres inválidos. Use apenas letras, números e parênteses.")

        def _parse(f, multiplier=1):
            res = {}
            # Regex: ([A-Z][a-z]*)(\d*) -> Elemento e Quantidade
            # \((.*?)\)(\d*) -> Conteúdo entre parênteses e multiplicador externo
            pattern = re.compile(r'([A-Z][a-z]*)(\d*)|\((.*?)\)(\d*)')
            tokens = pattern.findall(f)
            
            if not tokens and f:
                raise ChemistrySyntaxError(f"Não foi possível processar a parte: {f}")

            for el, qty, sub_f, sub_qty in tokens:
                if sub_f: # Caso de parênteses (ex: (NH4)2)
                    m = int(sub_qty) if sub_qty else 1
                    sub_res = _parse(sub_f, m * multiplier)
                    for k, v in sub_res.items():
                        res[k] = res.get(k, 0) + v
                elif el: # Caso de elemento simples (ex: H2)
                    m = int(qty) if qty else 1
                    if el not in ATOMIC_MASSES:
                        raise UnknownElementError(f"O elemento '{el}' não existe na tabela periódica.")
                    res[el] = res.get(el, 0) + m * multiplier
            return res
            
        return _parse(formula)

    @staticmethod
    def calculate_molar_mass(formula):
        """
        Calcula a massa molar total de uma fórmula química.
        """
        comp = FormulaParser.parse(formula)
        total = 0.0
        for el, qty in comp.items():
            total += ATOMIC_MASSES[el] * qty
        return round(total, 4)
