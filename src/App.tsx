/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FlaskConical, 
  Calculator, 
  Scale, 
  BookOpen, 
  Code, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Bookmark,
  Save,
  Table,
  Waves,
  Download,
  FileText,
  PieChart as PieChartIcon,
  Activity,
  Zap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { calculateMolarMass, parseFormula } from './logic/formulaParser';
import { balanceEquation } from './logic/balancer';
import { calculateStoichiometry } from './logic/stoichiometry';
import { ChemistryEngine, Reaction, Molecule } from './logic/ChemistryEngine';
import { PeriodicTable } from './components/PeriodicTable';
import { calculateMolarity, calculateMassForMolarity, calculateDilution } from './logic/solutions';

// --- Types ---
interface ReactantInput {
  formula: string;
  mass: string;
  purity: string;
}

interface ProductInput {
  formula: string;
  mass: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'parser' | 'balancer' | 'stoichiometry' | 'tutor' | 'library' | 'table' | 'solutions' | 'advanced'>('parser');
  
  // Library State
  const [savedEquations, setSavedEquations] = useState<any[]>([]);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Formula Parser State
  const [formulaInput, setFormulaInput] = useState('H2SO4');
  const [molarMass, setMolarMass] = useState<number | null>(null);
  const [composition, setComposition] = useState<Record<string, number> | null>(null);
  const [massComposition, setMassComposition] = useState<Record<string, { percentage: number; mass: number }> | null>(null);
  const [parserError, setParserError] = useState<string | null>(null);
  const [massInput, setMassInput] = useState<string>('100');
  const [molesResult, setMolesResult] = useState<number | null>(null);
  const [commonName, setCommonName] = useState<string | null>(null);

  // Balancer State
  const [equationInput, setEquationInput] = useState('H2 + O2 -> H2O');
  const [balancedResult, setBalancedResult] = useState<{ reactants: string[], products: string[], coefficients: number[] } | null>(null);
  const [balancerError, setBalancerError] = useState<string | null>(null);

  // Stoichiometry State
  const [stoicReactants, setStoicReactants] = useState<ReactantInput[]>([{ formula: 'H2', mass: '10', purity: '100' }, { formula: 'O2', mass: '80', purity: '100' }]);
  const [stoicProducts, setStoicProducts] = useState<ProductInput[]>([{ formula: 'H2O', mass: '' }]);
  const [stoicResult, setStoicResult] = useState<any>(null);
  const [stoicError, setStoicError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  // Solutions State
  const [solMass, setSolMass] = useState('10');
  const [solFormula, setSolFormula] = useState('NaOH');
  const [solVolume, setSolVolume] = useState('0.5');
  const [solMolarity, setSolMolarity] = useState<number | null>(null);

  const [dilC1, setDilC1] = useState('1.0');
  const [dilV1, setDilV1] = useState('0.1');
  const [dilC2, setDilC2] = useState('0.1');
  const [dilV2, setDilV2] = useState('');
  const [dilResult, setDilResult] = useState<number | null>(null);

  // Advanced Tools State
  const [phInput, setPhInput] = useState('7');
  const [phInputType, setPhInputType] = useState<'ph' | 'poh' | 'h' | 'oh'>('ph');
  const [phResult, setPhResult] = useState<{ ph: number, poh: number, h: number, oh: number, type: string } | null>(null);
  const [empiricalInput, setEmpiricalInput] = useState<{ element: string, percentage: string }[]>([{ element: 'C', percentage: '40' }, { element: 'H', percentage: '6.7' }, { element: 'O', percentage: '53.3' }]);
  const [empiricalResult, setEmpiricalResult] = useState<string | null>(null);

  const COMMON_NAMES: Record<string, string> = {
    'H2O': 'Água',
    'NaCl': 'Sal de Cozinha',
    'C12H22O11': 'Açúcar (Sacarose)',
    'NaHCO3': 'Bicarbonato de Sódio',
    'NaOH': 'Soda Cáustica',
    'HCl': 'Ácido Clorídrico',
    'H2SO4': 'Ácido Sulfúrico',
    'NH3': 'Amônia',
    'CH4': 'Metano',
    'CO2': 'Dióxido de Carbono',
    'C2H5OH': 'Álcool Etílico (Etanol)',
    'CH3COOH': 'Ácido Acético (Vinagre)',
    'CaCO3': 'Calcário / Mármore',
    'KNO3': 'Salitre',
    'MgSO4': 'Sal de Epsom',
    'N2O': 'Gás Hilariante'
  };

  // Effects
  useEffect(() => {
    // Auto-format equation input
    if (equationInput.includes('>') && !equationInput.includes('->')) {
      setEquationInput(equationInput.replace('>', '->'));
    }
  }, [equationInput]);

  useEffect(() => {
    if (activeTab === 'parser') handleParse();
    if (activeTab === 'library') fetchSavedEquations();
  }, [formulaInput, activeTab]);

  useEffect(() => {
    if (molarMass && massInput) {
      const mass = parseFloat(massInput);
      if (!isNaN(mass)) {
        setMolesResult(mass / molarMass);
      } else {
        setMolesResult(null);
      }
    } else {
      setMolesResult(null);
    }
  }, [molarMass, massInput]);

  useEffect(() => {
    try {
      const m = parseFloat(solMass);
      const v = parseFloat(solVolume);
      if (!isNaN(m) && !isNaN(v) && v > 0) {
        setSolMolarity(calculateMolarity(m, solFormula, v));
      } else {
        setSolMolarity(null);
      }
    } catch {
      setSolMolarity(null);
    }
  }, [solMass, solFormula, solVolume]);

  useEffect(() => {
    const c1 = dilC1 === '' ? null : parseFloat(dilC1);
    const v1 = dilV1 === '' ? null : parseFloat(dilV1);
    const c2 = dilC2 === '' ? null : parseFloat(dilC2);
    const v2 = dilV2 === '' ? null : parseFloat(dilV2);

    const nullCount = [c1, v1, c2, v2].filter(v => v === null).length;
    if (nullCount === 1) {
      setDilResult(calculateDilution(c1, v1, c2, v2));
    } else {
      setDilResult(null);
    }
  }, [dilC1, dilV1, dilC2, dilV2]);

  const fetchSavedEquations = async () => {
    try {
      const response = await fetch('/api/equations');
      if (response.ok) {
        const data = await response.json();
        setSavedEquations(data);
      }
    } catch (error) {
      console.error("Failed to fetch equations", error);
    }
  };

  const saveEquation = async () => {
    if (!saveName || !balancedResult) return;
    setIsSaving(true);
    try {
      const balancedStr = `${balancedResult.reactants.join(' + ')} -> ${balancedResult.products.join(' + ')}`;
      const response = await fetch('/api/equations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          equation: equationInput,
          balanced_equation: balancedStr
        })
      });
      if (response.ok) {
        setSaveName('');
        alert("Equação salva com sucesso!");
      }
    } catch (error) {
      alert("Erro ao salvar equação.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEquation = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta equação?")) return;
    try {
      const response = await fetch(`/api/equations/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchSavedEquations();
      }
    } catch (error) {
      alert("Erro ao excluir equação.");
    }
  };

  const exportToCSV = () => {
    if (!stoicResult) return;
    const rows = [
      ["Item", "Valor"],
      ["Reagente Limitante", stoicResult.limitingReagent],
      ["Rendimento Teórico (g)", stoicResult.theoreticalYield.toFixed(3)],
      ["Rendimento Real (g)", stoicResult.actualYield.toFixed(3)],
      ["Eficiência (%)", stoicResult.percentYield.toFixed(2)],
      ...Object.entries(stoicResult.excessReagents).map(([f, m]: any) => [`Excesso de ${f} (g)`, m.toFixed(3)]),
      ["", ""],
      ["Memorial de Cálculo", ""],
      ...stoicResult.steps.map((s: string) => [s.replace(/,/g, ';')])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_estequiometria.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParse = () => {
    try {
      const molecule = ChemistryEngine.createMolecule(formulaInput);
      setMolarMass(molecule.molarMass);
      setComposition(molecule.composition);
      setMassComposition(molecule.getMassComposition());
      setCommonName(COMMON_NAMES[formulaInput.trim()] || null);
      setParserError(null);
    } catch (e: any) {
      setParserError(e.message);
      setMolarMass(null);
      setComposition(null);
      setMassComposition(null);
      setCommonName(null);
    }
  };

  const handlePhCalculate = () => {
    const val = parseFloat(phInput);
    if (isNaN(val) || val <= 0 && (phInputType === 'h' || phInputType === 'oh')) return;

    let ph = 7, poh = 7, h = 1e-7, oh = 1e-7;

    if (phInputType === 'ph') {
      ph = val;
      poh = 14 - ph;
      h = Math.pow(10, -ph);
      oh = Math.pow(10, -poh);
    } else if (phInputType === 'poh') {
      poh = val;
      ph = 14 - poh;
      h = Math.pow(10, -ph);
      oh = Math.pow(10, -poh);
    } else if (phInputType === 'h') {
      h = val;
      ph = -Math.log10(h);
      poh = 14 - ph;
      oh = Math.pow(10, -poh);
    } else if (phInputType === 'oh') {
      oh = val;
      poh = -Math.log10(oh);
      ph = 14 - poh;
      h = Math.pow(10, -ph);
    }

    let type = "Neutro";
    if (ph < 6.5) type = "Ácido";
    else if (ph > 7.5) type = "Básico";

    setPhResult({ ph, poh, h, oh, type });
  };

  const handleEmpiricalCalculate = () => {
    try {
      const data = empiricalInput.map(i => {
        const mm = calculateMolarMass(i.element);
        return {
          element: i.element,
          moles: parseFloat(i.percentage) / mm
        };
      });
      
      const minMoles = Math.min(...data.map(d => d.moles));
      const ratios = data.map(d => ({
        element: d.element,
        ratio: Math.round(d.moles / minMoles)
      }));
      
      const formula = ratios.map(r => `${r.element}${r.ratio > 1 ? r.ratio : ''}`).join('');
      setEmpiricalResult(formula);
    } catch (e) {
      setEmpiricalResult('Erro no cálculo. Verifique os elementos.');
    }
  };

  const handleBalance = () => {
    try {
      const reaction = ChemistryEngine.createReaction(equationInput);
      reaction.balance();
      
      // Convert class result back to state format for UI
      const result = balanceEquation(equationInput);
      setBalancedResult(result);
      setBalancerError(null);
    } catch (e: any) {
      setBalancerError(e.message);
      setBalancedResult(null);
    }
  };

  const handleStoic = () => {
    try {
      const eq = `${stoicReactants.map(r => r.formula).join(' + ')} -> ${stoicProducts.map(p => p.formula).join(' + ')}`;
      const reaction = ChemistryEngine.createReaction(eq);
      
      const result = reaction.calculate(
        stoicReactants.map(r => ({ mass: parseFloat(r.mass) || 0, purity: parseFloat(r.purity) || 100 })),
        stoicProducts.map(p => ({ mass: parseFloat(p.mass) || 0 }))
      );
      
      // Re-balance for balancedEq display
      const balanced = balanceEquation(eq);
      setStoicResult({ ...result, balancedEq: balanced });
      setStoicError(null);
    } catch (e: any) {
      setStoicError(e.message);
      setStoicResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Mobile Header */}
      <div className="md:hidden p-6 border-b border-[#141414]/10 flex justify-between items-center bg-[#E4E3E0] sticky top-0 z-20">
        <h1 className="text-lg font-serif italic font-bold">ChemCalc</h1>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('parser')} className={`p-2 rounded ${activeTab === 'parser' ? 'bg-[#141414] text-white' : ''}`}><FlaskConical size={18} /></button>
          <button onClick={() => setActiveTab('balancer')} className={`p-2 rounded ${activeTab === 'balancer' ? 'bg-[#141414] text-white' : ''}`}><Scale size={18} /></button>
          <button onClick={() => setActiveTab('stoichiometry')} className={`p-2 rounded ${activeTab === 'stoichiometry' ? 'bg-[#141414] text-white' : ''}`}><Calculator size={18} /></button>
          <button onClick={() => setActiveTab('solutions')} className={`p-2 rounded ${activeTab === 'solutions' ? 'bg-[#141414] text-white' : ''}`}><Waves size={18} /></button>
          <button onClick={() => setActiveTab('advanced')} className={`p-2 rounded ${activeTab === 'advanced' ? 'bg-[#141414] text-white' : ''}`}><Zap size={18} /></button>
          <button onClick={() => setActiveTab('table')} className={`p-2 rounded ${activeTab === 'table' ? 'bg-[#141414] text-white' : ''}`}><Table size={18} /></button>
          <button onClick={() => setActiveTab('library')} className={`p-2 rounded ${activeTab === 'library' ? 'bg-[#141414] text-white' : ''}`}><Bookmark size={18} /></button>
          <button onClick={() => setActiveTab('tutor')} className={`p-2 rounded ${activeTab === 'tutor' ? 'bg-[#141414] text-white' : ''}`}><BookOpen size={18} /></button>
        </div>
      </div>

      {/* Sidebar / Navigation */}
      <div className="fixed left-0 top-0 h-full w-64 border-r border-[#141414]/10 bg-[#E4E3E0] z-10 hidden md:block">
        <div className="p-8">
          <h1 className="text-xl font-serif italic font-bold tracking-tight mb-1">ChemCalc</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50 mb-8">Calculadora Estequiométrica</p>
          
          <nav className="space-y-1">
            <NavItem 
              active={activeTab === 'parser'} 
              onClick={() => setActiveTab('parser')} 
              icon={<FlaskConical size={18} />} 
              label="Massa Molar" 
            />
            <NavItem 
              active={activeTab === 'balancer'} 
              onClick={() => setActiveTab('balancer')} 
              icon={<Scale size={18} />} 
              label="Balanceamento" 
            />
            <NavItem 
              active={activeTab === 'stoichiometry'} 
              onClick={() => setActiveTab('stoichiometry')} 
              icon={<Calculator size={18} />} 
              label="Estequiometria" 
            />
            <NavItem 
              active={activeTab === 'solutions'} 
              onClick={() => setActiveTab('solutions')} 
              icon={<Waves size={18} />} 
              label="Soluções & Diluição" 
            />
            <NavItem 
              active={activeTab === 'advanced'} 
              onClick={() => setActiveTab('advanced')} 
              icon={<Zap size={18} />} 
              label="Ferramentas Avançadas" 
            />
            <NavItem 
              active={activeTab === 'table'} 
              onClick={() => setActiveTab('table')} 
              icon={<Table size={18} />} 
              label="Tabela Periódica" 
            />
            <NavItem 
              active={activeTab === 'library'} 
              onClick={() => setActiveTab('library')} 
              icon={<Bookmark size={18} />} 
              label="Biblioteca" 
            />
            <div className="pt-4 mt-4 border-t border-[#141414]/10">
              <NavItem 
                active={activeTab === 'tutor'} 
                onClick={() => setActiveTab('tutor')} 
                icon={<BookOpen size={18} />} 
                label="Tutor (Algoritmos)" 
              />
            </div>
          </nav>
        </div>
        
        <div className="absolute bottom-8 left-8 right-8">
          <div className="p-4 bg-[#141414] text-[#E4E3E0] rounded-lg">
            <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Status do Projeto</p>
            <p className="text-xs font-medium">TCC - IF (Eng. Software)</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-64 p-8 md:p-12 max-w-5xl min-h-screen bg-[#E4E3E0] relative overflow-hidden">
        {/* Lab Notebook Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <AnimatePresence mode="wait">
          {activeTab === 'parser' && (
            <motion.div 
              key="parser"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <SectionHeader title="Massa Molar & Conversão" subtitle="Análise molecular e estequiometria básica" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-6 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">Fórmula Química</label>
                        <button 
                          onClick={() => setActiveTab('table')}
                          className="text-[10px] uppercase tracking-widest font-bold hover:underline flex items-center gap-1"
                        >
                          <Table size={10} /> Ver Tabela
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={formulaInput} 
                        onChange={(e) => setFormulaInput(e.target.value)}
                        placeholder="Ex: H2O, C6H12O6"
                        className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono text-xl focus:outline-none focus:border-[#141414]" 
                      />
                      {commonName && (
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                          Nome Comum: {commonName}
                        </p>
                      )}
                    </div>

                    <div className="pt-6 border-t border-[#141414]/5">
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Massa Molar</p>
                      <p className="text-4xl font-mono font-bold">
                        {molarMass ? molarMass.toFixed(3) : '---'} 
                        <span className="text-sm font-normal opacity-50 ml-2">g/mol</span>
                      </p>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">Conversor: Massa (g)</label>
                        <input 
                          type="number" 
                          value={massInput}
                          onChange={(e) => setMassInput(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                        />
                      </div>
                      <div className="p-4 bg-[#141414] text-white rounded-xl">
                        <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Resultado em Mols</p>
                        <p className="text-2xl font-mono font-bold">{molesResult ? molesResult.toFixed(4) : '---'} mol</p>
                      </div>
                    </div>

                    {parserError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded border border-red-100">
                        <AlertCircle size={16} />
                        <span>{parserError}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-8 bg-white border border-[#141414]/10 rounded-2xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                      <PieChartIcon size={18} />
                      Composição Centesimal
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="h-[300px]">
                      {massComposition ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(massComposition!).map(([name, data]) => ({ name, value: (data as any).percentage }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {Object.entries(massComposition).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={['#141414', '#4F46E5', '#10B981', '#F59E0B', '#EF4444'][index % 5]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-20">
                          <Activity size={48} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {massComposition ? Object.entries(massComposition).map(([element, data]: [string, any]) => (
                        <div key={element} className="flex justify-between items-center border-b border-[#141414]/5 pb-2">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-[#141414] text-white rounded font-bold text-xs">
                              {element}
                            </span>
                            <span className="text-sm font-medium">{data.mass.toFixed(2)}g</span>
                          </div>
                          <span className="font-mono font-bold text-indigo-600">{data.percentage.toFixed(2)}%</span>
                        </div>
                      )) : (
                        <p className="text-sm opacity-40 italic">Insira uma fórmula para ver a composição.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'balancer' && (
            <motion.div 
              key="balancer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <SectionHeader title="Balanceamento de Equações" subtitle="Resolução de sistemas lineares via Eliminação Gaussiana" />
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-50">Equação Química</label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        value={equationInput}
                        onChange={(e) => setEquationInput(e.target.value)}
                        placeholder="Ex: H2 + O2 -> H2O"
                        className="w-full bg-transparent border-b-2 border-[#141414] py-3 text-2xl font-mono focus:outline-none"
                      />
                      {/* Quick Action Bar */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1">
                        <button 
                          onClick={() => setEquationInput(prev => prev + ' + ')}
                          className="w-8 h-8 flex items-center justify-center bg-[#141414]/5 rounded hover:bg-[#141414]/10 transition-colors font-bold"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => setEquationInput(prev => prev + ' -> ')}
                          className="w-10 h-8 flex items-center justify-center bg-[#141414]/5 rounded hover:bg-[#141414]/10 transition-colors font-bold"
                        >
                          →
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={handleBalance}
                      className="bg-[#141414] text-[#E4E3E0] px-6 py-2 rounded-lg font-medium hover:bg-[#141414]/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} />
                      Balancear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 w-full mb-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-40">Reações Comuns (Sugestões):</p>
                    <div className="group relative">
                      <Info size={12} className="opacity-30 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-[#141414] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Clique em uma reação para carregar a fórmula automaticamente. Útil para quem está começando!
                      </div>
                    </div>
                  </div>
                  {[
                    { label: 'Água', eq: 'H2 + O2 -> H2O' },
                    { label: 'Combustão Metano', eq: 'CH4 + O2 -> CO2 + H2O' },
                    { label: 'Fotossíntese', eq: 'CO2 + H2O -> C6H12O6 + O2' },
                    { label: 'Ferrugem', eq: 'Fe + O2 -> Fe2O3' },
                    { label: 'Complexo', eq: 'KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2' }
                  ].map((ex) => (
                    <button 
                      key={ex.label}
                      onClick={() => {
                        setEquationInput(ex.eq);
                        // Trigger balance automatically for convenience
                        setTimeout(handleBalance, 100);
                      }}
                      className="text-[10px] font-mono border border-[#141414]/20 px-2 py-1 rounded hover:bg-[#141414] hover:text-white transition-colors"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>

                <div className="bg-[#141414]/5 p-4 rounded-xl border border-[#141414]/5">
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mb-3">Componentes Detectados (Massa Molar):</p>
                  <div className="flex flex-wrap gap-4">
                    {equationInput.split(/[+->]/).map(s => s.trim()).filter(s => s.length > 0).map((molecule, idx) => {
                      try {
                        const mm = calculateMolarMass(molecule);
                        return (
                          <div key={idx} className="flex flex-col">
                            <span className="font-mono font-bold text-sm">{molecule}</span>
                            <span className="text-[10px] opacity-50">{mm.toFixed(2)} g/mol</span>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })}
                  </div>
                </div>

                {balancerError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded border border-red-100">
                    <AlertCircle size={16} />
                    <span>{balancerError}</span>
                  </div>
                )}

                {balancedResult && (
                  <div className="bg-white p-8 rounded-2xl border border-[#141414]/10 shadow-sm space-y-8">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-4">Equação Balanceada</p>
                      <div className="text-3xl font-mono flex flex-wrap justify-center items-center gap-4">
                        {balancedResult.reactants.map((r, i) => (
                          <React.Fragment key={`r-${i}`}>
                            <span className="bg-[#141414]/5 px-3 py-1 rounded">{r}</span>
                            {i < balancedResult.reactants.length - 1 && <span>+</span>}
                          </React.Fragment>
                        ))}
                        <ChevronRight className="mx-2 opacity-30" />
                        {balancedResult.products.map((p, i) => (
                          <React.Fragment key={`p-${i}`}>
                            <span className="bg-[#141414]/5 px-3 py-1 rounded">{p}</span>
                            {i < balancedResult.products.length - 1 && <span>+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#141414]/5 flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">Nome da Reação (para salvar)</label>
                        <input 
                          type="text" 
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          placeholder="Ex: Síntese da Água"
                          className="w-full bg-transparent border-b border-[#141414]/20 py-2 focus:outline-none focus:border-[#141414]"
                        />
                      </div>
                      <button 
                        onClick={saveEquation}
                        disabled={!saveName || isSaving}
                        className="bg-[#141414] text-[#E4E3E0] px-6 py-2 rounded-lg font-medium hover:bg-[#141414]/90 transition-colors flex items-center gap-2 disabled:opacity-30"
                      >
                        <Save size={18} />
                        Salvar na Biblioteca
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'stoichiometry' && (
            <motion.div 
              key="stoic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <SectionHeader title="Cálculos Estequiométricos" subtitle="Análise de reagente limitante, excesso e rendimento" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider">Reagentes</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setStoicReactants([...stoicReactants, { formula: '', mass: '', purity: '100' }])}
                          className="text-xs flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <Plus size={14} /> Adicionar
                        </button>
                        <div className="group relative">
                          <Info size={14} className="opacity-30 cursor-help" />
                          <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-[#141414] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Insira a fórmula (ex: H2), a massa em gramas e a pureza (se souber). O sistema calculará o reagente limitante automaticamente.
                          </div>
                        </div>
                      </div>
                    </div>
                    {stoicReactants.map((r, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4 space-y-1">
                          <label className="text-[9px] uppercase opacity-40">Fórmula</label>
                          <input 
                            type="text" 
                            value={r.formula} 
                            onChange={(e) => {
                              const newR = [...stoicReactants];
                              newR[i].formula = e.target.value;
                              setStoicReactants(newR);
                            }}
                            className="w-full bg-white border border-[#141414]/10 rounded p-2 text-sm font-mono" 
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <label className="text-[9px] uppercase opacity-40">Massa (g)</label>
                          <input 
                            type="text" 
                            value={r.mass} 
                            onChange={(e) => {
                              const newR = [...stoicReactants];
                              newR[i].mass = e.target.value;
                              setStoicReactants(newR);
                            }}
                            className="w-full bg-white border border-[#141414]/10 rounded p-2 text-sm" 
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <label className="text-[9px] uppercase opacity-40">Pureza (%)</label>
                          <input 
                            type="text" 
                            value={r.purity} 
                            onChange={(e) => {
                              const newR = [...stoicReactants];
                              newR[i].purity = e.target.value;
                              setStoicReactants(newR);
                            }}
                            className="w-full bg-white border border-[#141414]/10 rounded p-2 text-sm" 
                          />
                        </div>
                        <div className="col-span-2 pb-1">
                          <button 
                            onClick={() => setStoicReactants(stoicReactants.filter((_, idx) => idx !== i))}
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider">Produtos</h3>
                    </div>
                    {stoicProducts.map((p, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6 space-y-1">
                          <label className="text-[9px] uppercase opacity-40">Fórmula</label>
                          <input 
                            type="text" 
                            value={p.formula} 
                            onChange={(e) => {
                              const newP = [...stoicProducts];
                              newP[i].formula = e.target.value;
                              setStoicProducts(newP);
                            }}
                            className="w-full bg-white border border-[#141414]/10 rounded p-2 text-sm font-mono" 
                          />
                        </div>
                        <div className="col-span-6 space-y-1">
                          <label className="text-[9px] uppercase opacity-40">Massa Obtida (g) - Opcional</label>
                          <input 
                            type="text" 
                            value={p.mass} 
                            onChange={(e) => {
                              const newP = [...stoicProducts];
                              newP[i].mass = e.target.value;
                              setStoicProducts(newP);
                            }}
                            className="w-full bg-white border border-[#141414]/10 rounded p-2 text-sm" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleStoic}
                    className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-xl font-bold hover:bg-[#141414]/90 transition-all shadow-lg shadow-[#141414]/10"
                  >
                    Calcular Estequiometria
                  </button>

                  {stoicError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded border border-red-100">
                      <AlertCircle size={16} />
                      <span>{stoicError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {stoicResult ? (
                    <div className="bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-8 shadow-sm">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <p className="text-[10px] uppercase tracking-widest text-emerald-700 mb-1">Reagente Limitante</p>
                          <p className="text-2xl font-mono font-bold text-emerald-900">{stoicResult.limitingReagent}</p>
                        </div>
                        
                        <div className="p-4 bg-[#141414]/5 rounded-xl">
                          <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Rendimento Teórico</p>
                          <p className="text-xl font-mono font-bold">{stoicResult.theoreticalYield.toFixed(3)}g</p>
                        </div>

                        <div className="p-4 bg-[#141414]/5 rounded-xl">
                          <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Rendimento Real</p>
                          <p className="text-xl font-mono font-bold">{stoicResult.actualYield > 0 ? `${stoicResult.actualYield.toFixed(3)}g` : '---'}</p>
                        </div>

                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                          <p className="text-[10px] uppercase tracking-widest text-indigo-700 mb-1">Eficiência (η)</p>
                          <p className="text-xl font-mono font-bold text-indigo-900">{stoicResult.percentYield.toFixed(1)}%</p>
                        </div>

                        <div className="col-span-2 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-[10px] uppercase tracking-widest text-amber-700 mb-1">Partículas (N)</p>
                          <p className="text-xl font-mono font-bold text-amber-900">
                            {(stoicResult.theoreticalYield / ChemistryEngine.createMolecule(stoicProducts[0].formula).molarMass * 6.022e23).toExponential(3)}
                            <span className="text-xs font-normal ml-2 opacity-60">moléculas</span>
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3">Reagentes em Excesso</p>
                        <div className="space-y-2">
                          {Object.entries(stoicResult.excessReagents).map(([formula, mass]: any) => (
                            <div key={formula} className="flex justify-between items-center border-b border-[#141414]/5 pb-2">
                              <span className="font-mono font-bold">{formula}</span>
                              <span className="text-sm">{mass.toFixed(3)}g sobrando</span>
                            </div>
                          ))}
                          {Object.keys(stoicResult.excessReagents).length === 0 && (
                            <p className="text-sm italic opacity-40">Nenhum excesso detectado.</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#141414]/10 flex justify-between items-center">
                        <p className="text-[10px] uppercase tracking-widest opacity-50">Equação Balanceada Utilizada</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowSteps(!showSteps)}
                            className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"
                          >
                            <FileText size={12} />
                            {showSteps ? 'Ocultar Memorial' : 'Ver Memorial'}
                          </button>
                          <button 
                            onClick={exportToCSV}
                            className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"
                          >
                            <Download size={12} />
                            Exportar CSV
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-mono opacity-70 mb-4">
                        {stoicResult.balancedEq.reactants.join(' + ')} → {stoicResult.balancedEq.products.join(' + ')}
                      </p>

                      {showSteps && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-[#141414] text-[#E4E3E0] p-4 rounded-lg font-mono text-[10px] whitespace-pre-wrap overflow-x-auto"
                        >
                          {stoicResult.steps.join('\n')}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                      <Calculator size={48} strokeWidth={1} />
                      <p className="italic">Insira os dados e clique em calcular para ver os resultados estequiométricos.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'solutions' && (
            <motion.div 
              key="solutions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <SectionHeader title="Soluções & Diluição" subtitle="Cálculo de concentração molar e preparo de reagentes" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <FlaskConical size={18} />
                    Molaridade (M = n/V)
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest opacity-50">Fórmula do Soluto</label>
                      <input 
                        type="text" 
                        value={solFormula}
                        onChange={(e) => setSolFormula(e.target.value)}
                        className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">Massa (g)</label>
                        <input 
                          type="number" 
                          value={solMass}
                          onChange={(e) => setSolMass(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">Volume (L)</label>
                        <input 
                          type="number" 
                          value={solVolume}
                          onChange={(e) => setSolVolume(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#141414]/5">
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Concentração Resultante</p>
                    <p className="text-3xl font-mono font-bold">
                      {solMolarity !== null ? solMolarity.toFixed(4) : '---'} 
                      <span className="text-sm font-normal opacity-50 ml-2">mol/L (M)</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <RefreshCw size={18} />
                    Diluição (C1·V1 = C2·V2)
                  </h3>
                  
                  <p className="text-xs opacity-50">Deixe em branco o campo que deseja calcular.</p>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase opacity-30">Solução Inicial</p>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">C1 (mol/L)</label>
                        <input 
                          type="number" 
                          value={dilC1}
                          onChange={(e) => setDilC1(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">V1 (L)</label>
                        <input 
                          type="number" 
                          value={dilV1}
                          onChange={(e) => setDilV1(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase opacity-30">Solução Final</p>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">C2 (mol/L)</label>
                        <input 
                          type="number" 
                          value={dilC2}
                          onChange={(e) => setDilC2(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest opacity-50">V2 (L)</label>
                        <input 
                          type="number" 
                          value={dilV2}
                          onChange={(e) => setDilV2(e.target.value)}
                          className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#141414]/5">
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Valor Calculado</p>
                    <p className="text-3xl font-mono font-bold">
                      {dilResult !== null ? dilResult.toFixed(4) : '---'}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <Calculator size={18} />
                    Conversor de Gás (CNTP - 22.4 L/mol)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-xs opacity-50">Converta volume de gás em mols nas Condições Normais de Temperatura e Pressão.</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] uppercase tracking-widest opacity-50">Volume (L)</label>
                          <input 
                            type="number" 
                            placeholder="Ex: 22.4"
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              const target = document.getElementById('gas-mols-output');
                              if (target) target.innerText = !isNaN(v) ? (v / 22.4).toFixed(4) : '---';
                            }}
                            className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                          />
                        </div>
                        <ChevronRight className="mt-4 opacity-20" />
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] uppercase tracking-widest opacity-50">Resultado (mol)</label>
                          <div id="gas-mols-output" className="py-2 font-mono font-bold text-xl">---</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs opacity-50">Converta mols em volume de gás nas CNTP.</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] uppercase tracking-widest opacity-50">Quantidade (mol)</label>
                          <input 
                            type="number" 
                            placeholder="Ex: 1.0"
                            onChange={(e) => {
                              const n = parseFloat(e.target.value);
                              const target = document.getElementById('gas-vol-output');
                              if (target) target.innerText = !isNaN(n) ? (n * 22.4).toFixed(2) : '---';
                            }}
                            className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none focus:border-[#141414]"
                          />
                        </div>
                        <ChevronRight className="mt-4 opacity-20" />
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] uppercase tracking-widest opacity-50">Resultado (L)</label>
                          <div id="gas-vol-output" className="py-2 font-mono font-bold text-xl">---</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'advanced' && (
            <motion.div 
              key="advanced"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <SectionHeader title="Ferramentas Avançadas" subtitle="Cálculos de pH, fórmulas empíricas e constantes" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-6 shadow-sm">
                  <h3 className="font-bold flex items-center gap-2 italic font-serif">
                    <Zap size={18} />
                    Cálculo de pH & pOH
                  </h3>
                  <p className="text-xs opacity-50">Determine a acidez ou basicidade de uma solução.</p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-[#141414]/5 rounded-lg">
                      {(['ph', 'poh', 'h', 'oh'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setPhInputType(t)}
                          className={`flex-1 py-1 text-[10px] uppercase font-bold rounded transition-all ${phInputType === t ? 'bg-[#141414] text-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                        >
                          {t === 'h' ? '[H+]' : t === 'oh' ? '[OH-]' : t}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest opacity-50">
                        {phInputType === 'ph' ? 'Valor de pH' : phInputType === 'poh' ? 'Valor de pOH' : phInputType === 'h' ? 'Concentração [H+]' : 'Concentração [OH-]'}
                      </label>
                      <input 
                        type={phInputType === 'h' || phInputType === 'oh' ? 'text' : 'number'}
                        value={phInput}
                        onChange={(e) => setPhInput(e.target.value)}
                        placeholder={phInputType === 'h' || phInputType === 'oh' ? 'Ex: 1e-7' : 'Ex: 7.0'}
                        className="w-full bg-transparent border-b border-[#141414]/20 py-2 font-mono text-2xl focus:outline-none focus:border-[#141414]"
                      />
                    </div>
                    <button 
                      onClick={handlePhCalculate}
                      className="w-full bg-[#141414] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                    >
                      Calcular Equilíbrio
                    </button>
                  </div>

                  {phResult && (
                    <div className="space-y-6 pt-6 border-t border-[#141414]/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                          <p className="text-[9px] uppercase tracking-widest text-indigo-600">pH</p>
                          <p className="text-xl font-mono font-bold">{phResult.ph.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl">
                          <p className="text-[9px] uppercase tracking-widest text-amber-600">pOH</p>
                          <p className="text-xl font-mono font-bold">{phResult.poh.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl">
                          <p className="text-[9px] uppercase tracking-widest text-emerald-600">[H+] (mol/L)</p>
                          <p className="text-xl font-mono font-bold">{phResult.h.toExponential(2)}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <p className="text-[9px] uppercase tracking-widest text-blue-600">[OH-] (mol/L)</p>
                          <p className="text-xl font-mono font-bold">{phResult.oh.toExponential(2)}</p>
                        </div>
                      </div>

                      <div className="relative h-12 bg-gradient-to-r from-red-500 via-yellow-200 via-green-400 via-blue-200 to-purple-900 rounded-full overflow-hidden flex items-center px-4">
                        <motion.div 
                          initial={{ left: '50%' }}
                          animate={{ left: `${(phResult.ph / 14) * 100}%` }}
                          className="absolute w-1 h-8 bg-white shadow-lg border border-black/20 z-10"
                        />
                        <div className="w-full flex justify-between text-[8px] font-bold text-white mix-blend-difference">
                          <span>ÁCIDO</span>
                          <span>NEUTRO</span>
                          <span>BÁSICO</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          phResult.type === 'Ácido' ? 'bg-red-100 text-red-700' : 
                          phResult.type === 'Básico' ? 'bg-blue-100 text-blue-700' : 
                          'bg-green-100 text-green-700'
                        }`}>
                          Caráter: {phResult.type}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-6 shadow-sm">
                  <h3 className="font-bold flex items-center gap-2 italic font-serif">
                    <Activity size={18} />
                    Fórmula Empírica
                  </h3>
                  <p className="text-xs opacity-50">Determine a fórmula mínima a partir da composição centesimal.</p>
                  
                  <div className="space-y-4">
                    {empiricalInput.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Elemento" 
                          value={item.element}
                          onChange={(e) => {
                            const newI = [...empiricalInput];
                            newI[idx].element = e.target.value;
                            setEmpiricalInput(newI);
                          }}
                          className="bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none"
                        />
                        <input 
                          placeholder="%" 
                          value={item.percentage}
                          onChange={(e) => {
                            const newI = [...empiricalInput];
                            newI[idx].percentage = e.target.value;
                            setEmpiricalInput(newI);
                          }}
                          className="bg-transparent border-b border-[#141414]/20 py-2 font-mono focus:outline-none"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEmpiricalInput([...empiricalInput, { element: '', percentage: '' }])}
                        className="text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100"
                      >
                        + Adicionar Elemento
                      </button>
                      <button 
                        onClick={handleEmpiricalCalculate}
                        className="flex-1 bg-[#141414] text-white py-2 rounded-lg font-bold"
                      >
                        Calcular Fórmula
                      </button>
                    </div>
                  </div>

                  {empiricalResult && (
                    <div className="pt-6 border-t border-[#141414]/5">
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Fórmula Mínima</p>
                      <p className="text-3xl font-mono font-bold text-indigo-600">{empiricalResult}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-6 shadow-sm lg:col-span-2">
                  <h3 className="font-bold flex items-center gap-2 italic font-serif">
                    <Scale size={18} />
                    Identificador Rápido de Reagente Limitante
                  </h3>
                  <p className="text-xs opacity-50">Descubra qual reagente acaba primeiro sem precisar de uma equação completa.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest opacity-40 font-bold">
                        <span>Massa (g)</span>
                        <span>Massa Molar</span>
                        <span>Coeficiente</span>
                      </div>
                      {[1, 2].map((i) => (
                        <div key={i} className="grid grid-cols-3 gap-2">
                          <input 
                            type="number" 
                            placeholder="Massa" 
                            id={`lr-m-${i}`}
                            className="bg-transparent border-b border-[#141414]/20 py-2 font-mono text-sm focus:outline-none"
                          />
                          <input 
                            type="number" 
                            placeholder="MM" 
                            id={`lr-mm-${i}`}
                            className="bg-transparent border-b border-[#141414]/20 py-2 font-mono text-sm focus:outline-none"
                          />
                          <input 
                            type="number" 
                            placeholder="Coef" 
                            id={`lr-c-${i}`}
                            className="bg-transparent border-b border-[#141414]/20 py-2 font-mono text-sm focus:outline-none"
                          />
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const m1 = parseFloat((document.getElementById('lr-m-1') as HTMLInputElement).value);
                          const mm1 = parseFloat((document.getElementById('lr-mm-1') as HTMLInputElement).value);
                          const c1 = parseFloat((document.getElementById('lr-c-1') as HTMLInputElement).value);
                          
                          const m2 = parseFloat((document.getElementById('lr-m-2') as HTMLInputElement).value);
                          const mm2 = parseFloat((document.getElementById('lr-mm-2') as HTMLInputElement).value);
                          const c2 = parseFloat((document.getElementById('lr-c-2') as HTMLInputElement).value);
                          
                          if (!isNaN(m1) && !isNaN(mm1) && !isNaN(c1) && !isNaN(m2) && !isNaN(mm2) && !isNaN(c2)) {
                            const n1 = m1 / mm1;
                            const n2 = m2 / mm2;
                            const r1 = n1 / c1;
                            const r2 = n2 / c2;
                            
                            const result = r1 < r2 ? "Reagente 1 é o Limitante" : "Reagente 2 é o Limitante";
                            const target = document.getElementById('lr-result');
                            if (target) target.innerText = result;
                          }
                        }}
                        className="w-full bg-[#141414] text-white py-2 rounded-lg font-bold"
                      >
                        Comparar Reagentes
                      </button>
                    </div>
                    <div className="flex flex-col justify-center items-center p-6 bg-[#141414]/5 rounded-2xl border border-dashed border-[#141414]/20">
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Resultado da Análise</p>
                      <div id="lr-result" className="text-xl font-serif italic font-bold text-center">---</div>
                      <p className="text-[10px] opacity-40 mt-4 text-center">Baseado na menor razão molar (n/coeficiente)</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'table' && (
            <motion.div 
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <SectionHeader title="Tabela Periódica Interativa" subtitle="Explore os elementos e suas propriedades fundamentais" />
              <PeriodicTable 
                onAddToFormula={(symbol) => {
                  setFormulaInput(prev => prev + symbol);
                  setActiveTab('parser');
                }} 
              />
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <SectionHeader title="Biblioteca de Reações" subtitle="Suas equações balanceadas salvas para consulta rápida" />
              
              <div className="grid grid-cols-1 gap-4">
                {savedEquations.length > 0 ? (
                  savedEquations.map((eq) => (
                    <div key={eq.id} className="bg-white border border-[#141414]/10 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{eq.name}</h3>
                        <p className="font-mono text-sm opacity-70">{eq.balanced_equation}</p>
                        <p className="text-[10px] opacity-30 uppercase tracking-widest">Salvo em: {new Date(eq.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEquationInput(eq.equation);
                            setActiveTab('balancer');
                            setTimeout(handleBalance, 100);
                          }}
                          className="text-xs font-bold uppercase tracking-widest border border-[#141414] px-4 py-2 rounded hover:bg-[#141414] hover:text-white transition-all"
                        >
                          Carregar
                        </button>
                        <button 
                          onClick={() => deleteEquation(eq.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30 space-y-4">
                    <Bookmark size={48} className="mx-auto" strokeWidth={1} />
                    <p className="italic">Sua biblioteca está vazia. Balanceie uma equação e salve-a para vê-la aqui.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'tutor' && (
            <motion.div 
              key="tutor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <SectionHeader title="Tutor de Arquitetura & Química" subtitle="Explicação técnica dos algoritmos implementados" />
              
              <div className="grid grid-cols-1 gap-8">
                <TutorCard 
                  title="1. Parser de Fórmulas (Regex & Pilha)"
                  icon={<Code size={20} />}
                  content={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p>Para identificar elementos como <code>H2SO4</code> ou <code>(NH4)2SO4</code>, utilizamos Expressões Regulares (Regex) e uma abordagem recursiva.</p>
                        <ul className="list-disc list-inside space-y-2 text-sm opacity-80 mt-4">
                          <li><strong>[A-Z][a-z]*</strong>: Captura o símbolo (ex: Fe, H, Na).</li>
                          <li><strong>\d*</strong>: Captura a quantidade (se vazio, assume 1).</li>
                          <li><strong>Recursão</strong>: Quando encontramos parênteses, chamamos a função novamente para o conteúdo interno e multiplicamos pelo índice externo.</li>
                        </ul>
                      </div>
                      <div className="bg-[#141414] text-[#E4E3E0] p-6 rounded-xl font-mono text-xs border border-white/10 shadow-inner">
                        <p className="opacity-40 mb-2">// Algoritmo de Tokenização</p>
                        pattern = r"([A-Z][a-z]*)(\d*)"<br/>
                        tokens = re.findall(pattern, formula)<br/><br/>
                        <p className="opacity-40 mb-2">// Exemplo: (NH4)2SO4</p>
                        1. Parse NH4 {'->'} {'{N:1, H:4}'}<br/>
                        2. Multiply by 2 {'->'} {'{N:2, H:8}'}<br/>
                        3. Add SO4 {'->'} {'{N:2, H:8, S:1, O:4}'}
                      </div>
                    </div>
                  }
                />

                <TutorCard 
                  title="2. Balanceamento (Sistemas Lineares)"
                  icon={<Scale size={20} />}
                  content={
                    <>
                      <p>O balanceamento não é "tentativa e erro". É matemática pura. Cada elemento gera uma equação de conservação de massa.</p>
                      <p className="mt-2">Para <code>aH2 + bO2 → cH2O</code>:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm opacity-80 mb-4">
                        <li>Hidrogênio: 2a = 2c  ⇒ 2a + 0b - 2c = 0</li>
                        <li>Oxigênio: 0a + 2b = 1c ⇒ 0a + 2b - 1c = 0</li>
                      </ul>
                      <p>Resolvemos essa matriz usando <strong>Eliminação Gaussiana</strong> para encontrar o Espaço Nulo (Null Space), que nos dá os menores coeficientes inteiros.</p>
                    </>
                  }
                />

                <TutorCard 
                  title="3. Estequiometria & Rendimento"
                  icon={<Calculator size={20} />}
                  content={
                    <>
                      <p>A lógica segue quatro passos modulares:</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm opacity-80">
                        <li><strong>Conversão para Mols</strong>: <code>n = (massa * pureza) / MassaMolar</code>.</li>
                        <li><strong>Identificação do Limitante</strong>: O reagente com a menor razão <code>n / coeficiente</code>.</li>
                        <li><strong>Proporção</strong>: Usamos a razão do limitante para calcular o rendimento teórico.</li>
                        <li><strong>Eficiência (η)</strong>: Razão entre massa obtida e massa teórica.</li>
                      </ol>
                    </>
                  }
                />

                <TutorCard 
                  title="4. Validação Estrita & Ferramentas Docentes"
                  icon={<CheckCircle2 size={20} />}
                  content={
                    <>
                      <p>Implementamos uma camada de validação estrita que impede o uso de elementos inexistentes ou fórmulas mal-formadas.</p>
                      <ul className="list-disc list-inside space-y-2 text-sm opacity-80 mt-2">
                        <li><strong>Memorial de Cálculo</strong>: Passo a passo detalhado de todas as operações estequiométricas.</li>
                        <li><strong>Soluções & Diluição</strong>: Ferramentas para preparo de reagentes (M1V1 = M2V2).</li>
                        <li><strong>Tabela Periódica Interativa</strong>: Banco de dados completo com 118 elementos.</li>
                        <li><strong>Exportação</strong>: Geração de relatórios em CSV para documentação de laboratório.</li>
                      </ul>
                    </>
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-components ---

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-[#141414] text-[#E4E3E0] shadow-lg shadow-[#141414]/20' 
          : 'hover:bg-[#141414]/5 opacity-60 hover:opacity-100'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto"><CheckCircle2 size={14} /></motion.div>}
    </button>
  );
}

function SectionHeader({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-3xl font-serif italic font-bold tracking-tight">{title}</h2>
      <p className="text-sm opacity-50">{subtitle}</p>
    </div>
  );
}

function TutorCard({ title, icon, content }: { title: string, icon: React.ReactNode, content: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#141414]/10 rounded-2xl p-8 space-y-4 shadow-sm">
      <div className="flex items-center gap-3 text-[#141414]">
        <div className="p-2 bg-[#141414]/5 rounded-lg">{icon}</div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="text-[#141414]/80 leading-relaxed">
        {content}
      </div>
    </div>
  );
}
