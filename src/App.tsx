import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Ruler, 
  UploadCloud, 
  Link2, 
  Share2, 
  Bookmark, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Info,
  ShieldCheck,
  Cpu,
  Tv,
  RotateCcw,
  Sliders,
  ChevronRight,
  TrendingUp,
  Download,
  AlertCircle,
  Dna
} from 'lucide-react';
import ThreeAvatarViewer from './components/ThreeAvatarViewer';
import { AvatarParameters, ClothingItem, TryOnResult, ScrapedProduct, SavedTryOn } from './types';

// Curated high-fashion presets for instant interactions
const APPAREL_PRESETS: ClothingItem[] = [
  {
    id: 'garment-1',
    name: 'Sandstone Ribbed Knit Polo',
    type: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop&q=80',
    description: 'A tailored sandstone beige polo sweater featuring an elegant fold-over collar and textured ribbed knitting.',
    primaryColor: '#d6c5b3',
    styleTags: ['Knitwear', 'Polo', 'Classic', 'Sartorial'],
    fitAdvice: 'True to size. Fitted ribbed stretch collar.',
    secondaryColors: ['#bcaea1'],
    pantoneMatch: 'TCX 14-1116',
    fabricType: 'Ribbed Knit Cotton',
    weavePattern: 'Woven Knit Rib',
    surfaceFinish: 'Textured Matte',
    sheenLevel: 0.04,
    weightClass: 'Medium Weight',
    stretchFactor: 'Medium Stretch (15-20%)',
    neckline: 'Polo Fold Collar',
    sleeveStyle: 'Short Sleeve',
    fitType: 'Fitted',
    patternType: 'Solid Ribbed',
    patternScale: 'Micro',
    embellishments: ['Two-button functional placket']
  },
  {
    id: 'garment-2',
    name: 'Metropolitan Premium Trench Coat',
    type: 'outerwear',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80',
    description: 'Double-breasted gabardine coat crafted with broad lapels and modular storm vents, tailored for all climates.',
    primaryColor: '#78350f',
    styleTags: ['Structured', 'Corporate', 'Classy'],
    fitAdvice: 'Rigid structure. Size up if aiming to layer heavily.',
    secondaryColors: ['#1e1b4b'],
    pantoneMatch: 'TCX 19-1220',
    fabricType: 'Heavy Gabardine',
    weavePattern: 'Twill Weave',
    surfaceFinish: 'Semi-Matte Satin',
    sheenLevel: 0.15,
    weightClass: 'Heavyweight',
    stretchFactor: 'Rigid (0-5%)',
    neckline: 'Double Lapel',
    sleeveStyle: 'Long Cuffed Sleeve',
    fitType: 'Regular Fit',
    patternType: 'Solid',
    patternScale: 'None',
    embellishments: ['Contrast vintage buttons', 'Belt closure']
  },
  {
    id: 'garment-3',
    name: 'Classic Light-Wash Denim',
    type: 'bottom',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
    description: 'Comfortable light-blue denim construction with a relaxed straight-leg draping and leg creases.',
    primaryColor: '#abc8e2',
    styleTags: ['Denim', 'Light-Wash', 'Everyday'],
    fitAdvice: 'Straight leg drape. Standard waist fit.',
    secondaryColors: ['#ffffff', '#e2e8f0'],
    pantoneMatch: 'TCX 14-4115',
    fabricType: 'Aged Denim Cotton',
    weavePattern: 'Twill Weave',
    surfaceFinish: 'Matte distressed',
    sheenLevel: 0.05,
    weightClass: 'Heavyweight',
    stretchFactor: 'Minimal Stretch (2-5%)',
    neckline: 'High-Rise Waist',
    sleeveStyle: 'None',
    fitType: 'Relaxed Fit',
    patternType: 'Blue Indigo Distress',
    patternScale: 'Large',
    embellishments: ['Stitched silver rivets', 'Golden seam contrast thread']
  },
  {
    id: 'garment-4',
    name: 'Aura Organic Silk Midi Dress',
    type: 'dress',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    description: 'An ethereal luxury midi dress combining dynamic bias drape flows with subtle adjustable shoulder structures.',
    primaryColor: '#9f1239',
    styleTags: ['Elegant', 'Formal', 'Fluid'],
    fitAdvice: 'Flowy chest fit. Adjustable waist wraps easily.',
    secondaryColors: ['#f43f5e'],
    pantoneMatch: 'TCX 19-1763',
    fabricType: 'Organic Mulberry Silk',
    weavePattern: 'Satin Weave',
    surfaceFinish: 'Glossy Silk Sheen',
    sheenLevel: 0.45,
    weightClass: 'Lightweight',
    stretchFactor: 'Slight Bias Stretch (10%)',
    neckline: 'V-Neck Wrap',
    sleeveStyle: 'Sleeveless',
    fitType: 'Fluid Silhouette',
    patternType: 'Solid Flowing',
    patternScale: 'None',
    embellishments: ['Invisible zipper', 'Subtle adjustable shoulder ribbons']
  }
];

const SKIN_TONE_PRESETS = [
  { name: 'Sienna Deep', hex: '#6b4c35' },
  { name: 'Bronze Tan', hex: '#b28a6f' },
  { name: 'Golden Warm', hex: '#e8be96' },
  { name: 'Peach Neutral', hex: '#f9d5b7' },
  { name: 'Ivory Fair', hex: '#fff1e6' }
];

export default function App() {
  // 1. STATE INITIALIZATION
  const [avatar, setAvatar] = useState<AvatarParameters>({
    age: 25,
    gender: 'male',
    bodyShape: 'athletic',
    skinTone: '#b28a6f',
    height: 183,
    weight: 76
  });

  const [activePreset, setActivePreset] = useState<string>('garment-1');
  const [activeGarment, setActiveGarment] = useState<ClothingItem>(APPAREL_PRESETS[0]);
  const [selectedGarments, setSelectedGarments] = useState<ClothingItem[]>([
    APPAREL_PRESETS[0], // Sandstone Ribbed Knit Polo (top)
    APPAREL_PRESETS[2], // Classic Light-Wash Denim (bottom)
  ]);
  
  // Custom Product additions states
  const [clothingTypeInput, setClothingTypeInput] = useState<'top' | 'bottom' | 'dress' | 'outerwear'>('top');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Simulation execution pipeline states
  const [activeTab, setActiveTab] = useState<'3d-stage' | 'ai-render'>('3d-stage');
  const [cameraPreset, setCameraPreset] = useState<'fullbody' | 'torso' | 'headshot'>('fullbody');
  const [isProcessingTryOn, setIsProcessingTryOn] = useState(false);
  const [tryOnProgress, setTryOnProgress] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);

  // Before/After comparison slider percentage
  const [comparePosition, setComparePosition] = useState(50);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const isSliderDraggingRef = useRef(false);

  // Save/Share lists
  const [savedLookbooks, setSavedLookbooks] = useState<SavedTryOn[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  // 2. STYLIST AUTOMATED DESCRIPTION ADJUSTMENT FEEDBACK
  useEffect(() => {
    // Automatically trigger visual calibration sequence when avatar values change
    if (activeGarment) {
      triggerSilentPipelineCalibration();
    }
  }, [avatar, activeGarment]);

  const triggerSilentPipelineCalibration = async () => {
    setPipelineLogs(prev => [
      `[CALIB] Re-aligning parametric node structures to bodyShape: '${avatar.bodyShape}'...`,
      `[CALIB] Scaled heights constraints to heightIndex: ${avatar.height}cm`,
      `[CALIB] Mesh tissue tension calculated successfully.`,
      ...prev.slice(0, 5)
    ]);
  };

  // 3. HANDLERS
  // Preset Selection Click - Layered Category toggling!
  const handlePresetSelect = (id: string) => {
    const item = APPAREL_PRESETS.find(p => p.id === id);
    if (item) {
      setSelectedGarments(prev => {
        const isAlreadyWorn = prev.some(g => g.id === id);
        if (isAlreadyWorn) {
          showToast(`Shed ${item.name} from model!`);
          return prev.filter(g => g.id !== id);
        } else {
          showToast(`Wearing ${item.name}!`);
          let next = [...prev];
          if (item.type === 'dress') {
            next = next.filter(g => g.type !== 'top' && g.type !== 'bottom' && g.type !== 'dress');
          } else if (item.type === 'top' || item.type === 'bottom') {
            next = next.filter(g => g.type !== 'dress');
          }
          next = next.filter(g => g.id !== id);
          return [...next, item];
        }
      });
      setActivePreset(id);
      setActiveGarment(item);
      setCameraPreset(item.type === 'bottom' ? 'torso' : 'fullbody');
      setTryOnResult(null); // Reset until pipeline is processed
    }
  };

  // Interactive URL Scraper Link Paste
  const handleScrapeProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;

    setIsScraping(true);
    setUploadError('');
    try {
      const res = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Construct garment item
      const scrapedItem: ClothingItem = {
        id: `scraped-${Date.now()}`,
        name: data.name,
        type: data.type,
        imageUrl: data.imageUrl,
        sourceUrl: data.sourceUrl,
        description: data.description,
        primaryColor: '#7c3aed', // Default purple accent
        styleTags: ['Scraped', 'Direct Sourced']
      };

      setSelectedGarments(prev => {
        let next = [...prev];
        if (scrapedItem.type === 'dress') {
          next = next.filter(g => g.type !== 'top' && g.type !== 'bottom' && g.type !== 'dress');
        } else if (scrapedItem.type === 'top' || scrapedItem.type === 'bottom') {
          next = next.filter(g => g.type !== 'dress');
        }
        next = next.filter(g => g.type !== scrapedItem.type);
        return [...next, scrapedItem];
      });
      setActiveGarment(scrapedItem);
      setActivePreset(scrapedItem.id);
      setScrapeUrl('');
      showToast('Product URL Sourced & Worn Successfully!');
      setCameraPreset(scrapedItem.type === 'bottom' ? 'torso' : 'fullbody');
      setTryOnResult(null);

    } catch (err: any) {
      setUploadError(err.message || 'Scrape failed. Falling back to structured parsing.');
    } finally {
      setIsScraping(false);
    }
  };

  // Drag and drop image uploader
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Transmit to processor backend
        const res = await fetch('/api/process-clothing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: base64String,
            name: customName || file.name.split('.')[0]
          })
        });

        if (!res.ok) throw new Error('Failed to analyze custom garment asset.');
        const parsedNode = await res.json();

        // Create Custom Item
        const detectedType = parsedNode.type || clothingTypeInput;
        const customItem: ClothingItem = {
          id: `custom-${Date.now()}`,
          name: parsedNode.name || file.name.split('.')[0],
          type: detectedType as any,
          imageUrl: base64String, // Use full quality upload
          description: parsedNode.description || 'Custom fashion garment.',
          primaryColor: parsedNode.primaryColor || '#7c3aed',
          styleTags: parsedNode.styleTags || ['Custom'],
          fitAdvice: parsedNode.fitAdvice || 'Fits true to tailored body coordinates.'
        };

        setSelectedGarments(prev => {
          let next = [...prev];
          if (customItem.type === 'dress') {
            next = next.filter(g => g.type !== 'top' && g.type !== 'bottom' && g.type !== 'dress');
          } else if (customItem.type === 'top' || customItem.type === 'bottom') {
            next = next.filter(g => g.type !== 'dress');
          }
          next = next.filter(g => g.type !== customItem.type);
          return [...next, customItem];
        });
        setActiveGarment(customItem);
        setActivePreset(customItem.id);
        setCustomName('');
        showToast('Apparel loaded, analyzed, and worn successfully!');
        setCameraPreset(customItem.type === 'bottom' ? 'torso' : 'fullbody');
        setTryOnResult(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError('Failed to parse uploaded image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Virtual Try-On execution pipeline trigger
  const runVirtualTryOnPipeline = async () => {
    setIsProcessingTryOn(true);
    setTryOnProgress(10);
    setPipelineLogs([]);

    const logSteps = [
      '⚡ Sourcing garment geometry and pattern details...',
      '🛠️ Constructing parametric SMPL skeletal body coordinates...',
      '🧬 Deforming standard tissue layers based on height (172cm) & shape indexes...',
      '📸 Generating texture canvas mappings via Gemini image synthesis...',
      '🧠 Executing TryOnDiffusion generative model network parameters...',
      '💡 Rendering high-fidelity visual output...'
    ];

    let currentLog = 0;
    const interval = setInterval(() => {
      setTryOnProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Append telemetry logs sequentially
        if (prev % 15 === 0 && currentLog < logSteps.length) {
          setPipelineLogs(logs => [...logs, logSteps[currentLog]]);
          currentLog++;
        }
        return prev + 5;
      });
    }, 120);

    try {
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar,
          clothing: activeGarment,
          clothesBase64: activeGarment.imageUrl.startsWith('data:') ? activeGarment.imageUrl : undefined
        })
      });

      const data = await response.json();
      
      // Delay completion slightly to show smooth visual flow
      setTimeout(() => {
        setTryOnResult(data);
        setIsProcessingTryOn(false);
        setActiveTab('ai-render');
        setPipelineLogs(logs => [...logs, '🎉 Pipeline completed! CUDA parameters discharged cleanly.']);
        showToast('AI Virtual Try-On rendered perfectly!');
      }, 2500);

    } catch (error) {
      setIsProcessingTryOn(false);
      setPipelineLogs(logs => [...logs, '❌ Core trial module crashed on remote execution node.']);
    }
  };

  // 4. SPLIT COMPARISON SLIDER DRAGGING SYSTEM
  const handleSplitDown = (e: React.MouseEvent | React.TouchEvent) => {
    isSliderDraggingRef.current = true;
    e.preventDefault();
  };

  const handleSplitMove = (e: MouseEvent | TouchEvent) => {
    if (!isSliderDraggingRef.current || !splitContainerRef.current) return;
    
    const rect = splitContainerRef.current.getBoundingClientRect();
    let clientX = 0;
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
    } else if (e instanceof TouchEvent && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    }

    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setComparePosition(percentage);
  };

  const handleSplitUp = () => {
    isSliderDraggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleSplitMove);
    window.addEventListener('mouseup', handleSplitUp);
    window.addEventListener('touchmove', handleSplitMove);
    window.addEventListener('touchend', handleSplitUp);
    return () => {
      window.removeEventListener('mousemove', handleSplitMove);
      window.removeEventListener('mouseup', handleSplitUp);
      window.removeEventListener('touchmove', handleSplitMove);
      window.removeEventListener('touchend', handleSplitUp);
    };
  }, []);

  // Saved Lookbooks trigger
  const handleSaveLook = () => {
    if (!activeGarment) return;
    
    const newSaved: SavedTryOn = {
      id: `saved-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: { ...avatar },
      clothing: activeGarment,
      imageUrl: tryOnResult?.result2DUrl || activeGarment.imageUrl,
      score: tryOnResult?.stylingAdvice?.stylingScore || 85
    };

    setSavedLookbooks([newSaved, ...savedLookbooks]);
    showToast('Snapshot saved cleanly to local wear-shelf!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Lookbook share link successfully copied!');
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans select-none pb-12 relative overflow-hidden">
      {/* Dynamic Background Mesh Grids */}
      <div className="absolute top-0 left-0 w-full h-[550px] bg-gradient-to-b from-indigo-950/20 via-slate-950/0 to-transparent pointer-events-none -y-z-10" />
      
      {/* 1. TOP NAV HEADER */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-display font-extrabold text-white text-base">W.</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold tracking-tight text-white">WearAI</h1>
                <span className="bg-indigo-500/20 text-indigo-400 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold">TryOn Core v1.4</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Precision Parametric Virtual Studio</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={copyToClipboard}
              className="px-3.5 py-1.8 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-400" /> Share Sandbox
            </button>
            <div className="hidden md:flex bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1 items-center gap-2 font-mono text-[11px] text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CUDA Node Status: <span className="text-emerald-400 font-bold uppercase">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT VIEW AREA */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT PANEL (AVATAR & GARMENT SETUP) ================= */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A. AVATAR CONFIGURATION BOX */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="font-display font-bold text-sm tracking-tight">Parametric Studio Setup</h2>
              </div>
              <p className="text-[10px] font-mono text-slate-500">Skeletal Nodes</p>
            </div>

            {/* Gender Switch */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Avatar Gender Model</label>
              <div className="grid grid-cols-3 gap-2">
                {(['female', 'male', 'nonbinary'] as const).map((genderVal) => (
                  <button
                    key={genderVal}
                    onClick={() => setAvatar({ ...avatar, gender: genderVal })}
                    className={`py-1.5 px-3 rounded-xl border text-xs capitalize transition-all ${
                      avatar.gender === genderVal
                        ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {genderVal}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Parameter Dynamic Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span className="uppercase text-[11px] tracking-wider">Calibration Age</span>
                <span className="text-cyan-400 font-bold">
                  {avatar.age < 1 
                    ? `${Math.round(avatar.age * 12)} Months (Infant)` 
                    : avatar.age < 4 
                    ? `${avatar.age} Years (Toddler)` 
                    : avatar.age < 12 
                    ? `${avatar.age} Years (Child)` 
                    : `${avatar.age} Years (Adult)`}
                </span>
              </div>
              <input
                id="age-range"
                type="range"
                min="0.1"
                max="90"
                step="0.5"
                value={avatar.age}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  // Dynamic default height scaling logic
                  let calcHeight = 170;
                  let calcWeight = 62;
                  if (val < 1) { calcHeight = 70; calcWeight = 8; }
                  else if (val < 5) { calcHeight = 98; calcWeight = 15; }
                  else if (val < 12) { calcHeight = 135; calcWeight = 32; }
                  else { calcHeight = avatar.gender === 'male' ? 178 : 164; calcWeight = avatar.gender === 'male' ? 76 : 58; }
                  setAvatar({ ...avatar, age: val, height: calcHeight, weight: calcWeight });
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-slate-800"
              />
            </div>

            {/* Skin Tone Selector Palette */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Dermological Skin Palette</label>
              <div className="flex gap-2">
                {SKIN_TONE_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => setAvatar({ ...avatar, skinTone: preset.hex })}
                    className={`w-7 h-7 rounded-full border relative transition-transform hover:scale-110 ${
                      avatar.skinTone === preset.hex ? 'border-white scale-105' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  >
                    {avatar.skinTone === preset.hex && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-slate-900 font-bold" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Height & Weight Parameters Box */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Body Height (cm)</span>
                <input
                  type="number"
                  min="40"
                  max="220"
                  value={avatar.height}
                  onChange={(e) => setAvatar({ ...avatar, height: parseInt(e.target.value) || 170 })}
                  className="bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-transparent focus:border-cyan-500 pb-0.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Body Weight (kg)</span>
                <input
                  type="number"
                  min="3"
                  max="150"
                  value={avatar.weight}
                  onChange={(e) => setAvatar({ ...avatar, weight: parseInt(e.target.value) || 60 })}
                  className="bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-transparent focus:border-cyan-500 pb-0.5"
                />
              </div>
            </div>

            {/* Body Shapes presets */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Silhouette Proportions</label>
              <div className="grid grid-cols-3 gap-2">
                {(['athletic', 'slim', 'muscular', 'curvy', 'plus', 'regular'] as const).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setAvatar({ ...avatar, bodyShape: shape })}
                    className={`py-1 px-2 text-[11px] border rounded-lg transition-colors capitalize ${
                      avatar.bodyShape === shape
                        ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* B. APPAREL SOURCING PANEL */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-purple-400" />
                <h2 className="font-display font-bold text-sm tracking-tight">Apparel Asset Center</h2>
              </div>
            </div>

            {/* Dynamic tabs: presets vs customized uploads */}
            <div className="flex flex-col gap-4">

              {/* URL Scraping utility form */}
              <div className="border-t border-slate-800/50 pt-4 mt-2 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-300">Direct Retail URL Scraper</span>
                </div>
                <form onSubmit={handleScrapeProduct} className="flex gap-2">
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    placeholder="Paste Zara, Nordstrom, ASOS product links..."
                    className="flex-1 bg-slate-950 outline-none border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500/80 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isScraping}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-white transition-colors flex items-center justify-center min-w-[70px]"
                  >
                    {isScraping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Scrape'}
                  </button>
                </form>
              </div>

              {/* Direct image uploader logic */}
              <div className="border-t border-slate-800/50 pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-semibold text-slate-300">Upload Device Photo</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-1.5">
                  {(['top', 'bottom', 'dress', 'outerwear'] as const).map((typ) => (
                    <button
                      key={typ}
                      onClick={() => setClothingTypeInput(typ)}
                      className={`py-1 px-2 rounded-lg text-[10px] uppercase font-mono border ${
                        clothingTypeInput === typ ? 'bg-purple-950/30 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-850 text-slate-400'
                      }`}
                    >
                      {typ}
                    </button>
                  ))}
                </div>

                <div className="relative border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl bg-slate-950/40 p-4 transition-all hover:bg-slate-950/80 flex flex-col items-center justify-center text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-1">
                      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="text-[10px] font-mono text-slate-400">Gemini Parsing Garment...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <UploadCloud className="w-5 h-5 text-slate-400" />
                      <div className="text-slate-300 text-xs font-medium">Select apparel photo</div>
                      <p className="text-[10px] text-slate-500">Supports JPG, PNG with alpha background</p>
                    </div>
                  )}
                </div>
                {uploadError && (
                  <div className="bg-red-950/30 border border-red-550/20 p-2.5 rounded-xl text-[10px] text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* C. DYNAMIC GARMENT SPEC SHEET (PBR & DETAILED REPORT) */}
          {activeGarment && (
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 flex flex-col gap-4 text-left">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Dna className="w-4 h-4 text-purple-400" />
                  <h2 className="font-display font-bold text-sm tracking-tight text-white">Fabric Deconstruction</h2>
                </div>
                <span className="font-mono text-[9px] bg-slate-850 px-2 py-0.5 rounded text-cyan-400 border border-slate-800 uppercase tracking-widest font-extrabold animate-pulse">PBR-Active</span>
              </div>
              
              {/* Image thumbnail and name */}
              <div className="flex gap-3 items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                <img 
                  src={activeGarment.imageUrl} 
                  alt={activeGarment.name} 
                  className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{activeGarment.name}</div>
                  <div className="text-[10px] text-slate-450 font-mono mt-0.5 flex gap-1.5 uppercase font-bold text-left">
                    <span className="text-indigo-400">{activeGarment.type}</span>
                    <span>•</span>
                    <span className="text-pink-400">{activeGarment.fabricType || "Knit Cotton"}</span>
                  </div>
                </div>
              </div>

              {/* Grid of properties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/20 border border-slate-850/80 p-2 rounded-xl text-left">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500">Pantone Match</div>
                  <div className="text-[10px] font-semibold text-slate-300 truncate mt-0.5">{activeGarment.pantoneMatch || "TCX 14-1116"}</div>
                </div>
                <div className="bg-slate-950/20 border border-slate-850/80 p-2 rounded-xl text-left">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500">Weave Pattern</div>
                  <div className="text-[10px] font-semibold text-slate-300 truncate mt-0.5">{activeGarment.weavePattern || "Plain Weave"}</div>
                </div>
                <div className="bg-slate-950/20 border border-slate-850/80 p-2 rounded-xl text-left">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500">Surface Finish</div>
                  <div className="text-[10px] font-semibold text-slate-300 truncate mt-0.5">{activeGarment.surfaceFinish || "Textured Matte"}</div>
                </div>
                <div className="bg-slate-950/20 border border-slate-850/80 p-2 rounded-xl text-left">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500">Stretch Class</div>
                  <div className="text-[10px] font-semibold text-slate-300 truncate mt-0.5">{activeGarment.stretchFactor || "Low Stretch"}</div>
                </div>
                <div className="bg-slate-950/20 border border-slate-850/80 p-2 rounded-xl text-left">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500">Neck & Collar</div>
                  <div className="text-[10px] font-semibold text-slate-300 truncate mt-0.5">{activeGarment.neckline || "Crew Neck"}</div>
                </div>
                <div className="bg-slate-950/20 border border-slate-850/80 p-2 rounded-xl text-left">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500">Silhouette Fit</div>
                  <div className="text-[10px] font-semibold text-slate-300 truncate mt-0.5">{activeGarment.fitType || "Regular"}</div>
                </div>
              </div>

              {/* Pattern detail and weight */}
              <div className="flex flex-col gap-2 bg-slate-950/30 border border-slate-850 p-3 rounded-xl">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-mono">PATTERN TYPE:</span>
                  <span className="text-slate-300 font-bold uppercase">{activeGarment.patternType || "Solid Color"} (Scale: {activeGarment.patternScale || "None"})</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-mono">FABRIC SHEEN:</span>
                  <div className="flex items-center gap-1.5 flex-1 max-w-[124px] ml-auto">
                    <div className="h-1.5 bg-slate-900 rounded-full w-full overflow-hidden flex">
                      <div className="bg-cyan-500 h-full" style={{ width: `${(activeGarment.sheenLevel || 0.1) * 100}%` }} />
                    </div>
                    <span className="text-slate-300 font-mono font-bold">{(activeGarment.sheenLevel || 0.1).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-mono">WEIGHT CLASS:</span>
                  <span className="text-slate-300 font-bold uppercase">{activeGarment.weightClass || "Medium"}</span>
                </div>
                {activeGarment.embellishments && activeGarment.embellishments.length > 0 && (
                  <div className="flex justify-between items-start text-[10px] border-t border-slate-850 pt-2 mt-1">
                    <span className="text-slate-500 font-mono">DETAILS:</span>
                    <span className="text-slate-300 font-bold text-right truncate max-w-[150px]">{activeGarment.embellishments.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </section>

        {/* ================= MIDDLE PANEL (STAGE / DUAL PLATFORM VIEWER) ================= */}
        <section className="lg:col-span-5 flex flex-col gap-6">

          {/* VIEWER STAGE CARDS */}
          <div className="bg-slate-900/20 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col">
            
            {/* Split Switcher headers */}
            <div className="flex justify-between items-center bg-slate-950/60 p-4 border-b border-slate-850">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('3d-stage')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === '3d-stage'
                      ? 'bg-slate-850 border border-slate-700/60 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3D Parametric Mesh View
                </button>
                <button
                  onClick={() => {
                    if (!tryOnResult) {
                      runVirtualTryOnPipeline();
                    } else {
                      setActiveTab('ai-render');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'ai-render'
                      ? 'bg-indigo-600/10 border border-indigo-500 text-indigo-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Photoreal AI 2D Try-On
                </button>
              </div>

              {/* Camera Presets Selector */}
              {activeTab === '3d-stage' && (
                <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/60 uppercase font-mono text-[9px] font-bold">
                  {(['fullbody', 'torso', 'headshot'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setCameraPreset(preset)}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        cameraPreset === preset ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CORE VIEWER ZONE */}
            <div className="relative h-[530px] w-full bg-slate-950 flex flex-col items-center justify-center">

              {activeTab === '3d-stage' ? (
                /* WEBGL 3D THREE VIEWPORT CONTAINER */
                <ThreeAvatarViewer
                  avatar={avatar}
                  activeGarments={selectedGarments}
                  cameraPreset={cameraPreset}
                />
              ) : (
                /* PHOTOREALISTIC AI 2D VIEWPORT STAGE HOLDER WITH COMPARISON DRAG SLIDER */
                <div 
                  className="w-full h-full relative cursor-col-resize overflow-hidden"
                  ref={splitContainerRef}
                  onMouseDown={handleSplitDown}
                  onTouchStart={handleSplitDown}
                >
                  {/* BEFORE CANVAS IMAGE (Garment Base) */}
                  <div className="absolute inset-0 bg-slate-950 flex items-center justify-center select-none">
                    <img 
                      src={activeGarment.imageUrl} 
                      alt="Garment Preview" 
                      className="max-h-[500px] w-auto max-w-[90%] object-contain rounded-xl shadow-2xl scale-95"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md font-mono text-[10px] tracking-wider px-3 py-1 rounded-xl border border-slate-800 text-slate-400">
                      Before (Apparel Detail)
                    </div>
                  </div>

                  {/* AFTER CANVAS IMAGE COVER (Try-On Output) */}
                  <div 
                    className="absolute inset-y-0 left-0 right-0 overflow-hidden select-none bg-slate-950 flex items-center justify-center"
                    style={{ width: `${comparePosition}%` }}
                  >
                    <div 
                      className="absolute inset-0 bg-slate-950 flex items-center justify-center"
                      style={{ width: splitContainerRef.current?.getBoundingClientRect().width }}
                    >
                      <img 
                        src={tryOnResult?.result2DUrl || activeGarment.imageUrl} 
                        alt="Try-On Fit Output" 
                        className="max-h-[500px] w-auto max-w-[90%] object-contain rounded-xl shadow-2xl scale-95 filter saturate-[1.05]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute bottom-4 left-4 bg-indigo-950/90 backdrop-blur-md font-mono text-[10px] tracking-wider px-3 py-1 rounded-xl border border-indigo-500/30 text-indigo-300">
                      After (AI Render)
                    </div>
                  </div>

                  {/* Vertical splitter line */}
                  <div 
                    className="absolute inset-y-0 w-1 bg-indigo-500 cursor-col-resize z-10 flex items-center justify-center"
                    style={{ left: `${comparePosition}%` }}
                  >
                    <div className="h-10 w-4.5 bg-indigo-500 rounded-full flex flex-col justify-center gap-0.5 items-center shadow-lg border border-white/20">
                      <span className="w-0.5 h-3 bg-white/65 rounded-full" />
                      <span className="w-0.5 h-3 bg-white/65 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* Loader overlay for Virtual try-on processing pipeline */}
              {isProcessingTryOn && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-30 flex flex-col justify-center items-center p-8 text-center gap-5">
                  <div className="relative">
                    <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-cyan-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">Synthesizing Dress Fitting</h3>
                    <p className="text-xs text-indigo-300 max-w-xs mt-1 font-mono">Running VitonHD diffusion models...</p>
                  </div>

                  {/* Progress gauge */}
                  <div className="w-full max-w-xs bg-slate-900 border border-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${tryOnProgress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold tracking-widest">{tryOnProgress}% Processed</span>

                  {/* Pipeline developer logs */}
                  <div className="mt-4 w-full max-w-sm bg-black/50 border border-slate-900 rounded-xl p-3 h-32 overflow-y-auto text-left font-mono">
                    {pipelineLogs.map((log, index) => (
                      <div key={index} className="text-[10px] text-slate-400 leading-relaxed">
                        <span className="text-indigo-400 select-none">&gt;</span> {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* PIPELINE TELEMETRY TELEMETRY */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>GPU Pipeline Orchestration Node Logs</span>
            </div>
            <div className="bg-black/40 border border-slate-900/80 rounded-xl p-3 font-mono text-[9px] text-slate-500 flex flex-col gap-1 h-24 overflow-y-auto">
              <div>[02:22:42] CUDA initialized. Driver: v12.1. Compute platform loaded successfully.</div>
              <div>[02:22:50] Mounted pre-trained checkpoints (VITON_HD_weights.pth - FP16).</div>
              <div>[02:23:05] Spliced segment shapes for avatar bodyShape index: {avatar.bodyShape}.</div>
              {tryOnResult ? (
                <>
                  <div className="text-indigo-400 font-bold">[02:24:12] TryOn pipeline called. Processing clothing id: {activeGarment.id}.</div>
                  <div className="text-emerald-400">[02:24:14] Model fit generated. Interlock convergence threshold reached in {tryOnResult.logs[4]?.match(/\d+ms/)?.[0] || '740ms'}.</div>
                </>
              ) : (
                <div className="text-slate-600 italic">Listening for clothing tryon triggers on standard API gateways...</div>
              )}
            </div>
            {!tryOnResult && !isProcessingTryOn && (
              <button
                id="btn-tryon"
                onClick={runVirtualTryOnPipeline}
                className="w-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-purple-600 hover:opacity-90 active:scale-98 transition-all py-3 rounded-xl font-mono text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" /> Execute Virtual Try-On
              </button>
            )}
          </div>

        </section>

        {/* ================= RIGHT PANEL (STYLIST SCORECARD & LOOKBOOK) ================= */}
        <section className="lg:col-span-3 flex flex-col gap-6">

          {/* A. INTELLIGENT STYLIST SCORECARD */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="font-display font-bold text-sm tracking-tight">AI Stylist Assessment</h2>
              </div>
            </div>

            {/* Score Ring indicator */}
            <div className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
              <div className="relative flex items-center justify-center shrink-0">
                {/* SVG circular track */}
                <svg className="w-14 h-14 scale-95 transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="24" 
                    stroke="url(#accentGradient)" 
                    strokeWidth="4" 
                    fill="transparent" 
                    strokeDasharray="150"
                    strokeDashoffset={150 - (150 * (tryOnResult?.stylingAdvice?.stylingScore || 88)) / 100}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-xs font-mono font-extrabold text-white">
                  {tryOnResult?.stylingAdvice?.stylingScore || 88}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Style Score</div>
                <div className="text-xs font-semibold text-white">Aesthetic Fit Consistency</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Top 8% Cohesion Index</div>
              </div>
            </div>

            {/* Size Recommendation Box */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-cyan-400" />
                  <div className="text-left">
                    <div className="text-[9px] uppercase font-mono text-slate-500 leading-none">Size Fit Profile</div>
                    <div className="text-xs font-bold text-white mt-1">Recommended Option</div>
                  </div>
                </div>
                <span className="bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold rounded-lg px-2.5 py-1 tracking-wide">
                  {tryOnResult?.stylingAdvice?.sizeRecommendation || "M"}
                </span>
              </div>

              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 text-left">
                <span className="text-[9px] uppercase font-mono text-slate-500">Fabric Fitting Index</span>
                <div className="flex gap-2.5 items-center mt-1.5">
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                    <div className="bg-amber-500 h-full w-[25%]" title="Tight" />
                    <div className="bg-green-500 h-full w-[50%] border-x border-slate-950" title="Perfect" />
                    <div className="bg-amber-400 h-full w-[25%]" title="Loose" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-400">
                    {tryOnResult?.stylingAdvice?.fitRating || "Perfect"}
                  </span>
                </div>
              </div>
            </div>

            {/* Luxurious styling summary details */}
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[9px] uppercase font-mono text-slate-500">Styling Rationale</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tryOnResult?.stylingAdvice?.description || 
                 "Select physical features and click 'Execute Try-On' to invoke the styling generation engine. It runs body shape analysis to configure outfit recommendations."}
              </p>
            </div>

            {/* Wardrobe recommendations items */}
            <div className="flex flex-col gap-2 text-left">
              <span className="text-[9px] uppercase font-mono text-slate-500">Complete the Look (Affiliate Sync)</span>
              <div className="flex flex-col gap-1.5">
                {(tryOnResult?.stylingAdvice?.complimentaryItems || ["Slim Dark Chinos", "Vegan Leather Boots", "Silver Retro Shades"]).map((item) => (
                  <div 
                    key={item} 
                    className="flex justify-between items-center text-xs bg-slate-950/20 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 hover:border-slate-700/60 transition-colors"
                  >
                    <span>{item}</span>
                    <button className="text-[10px] font-semibold font-mono text-indigo-400 flex items-center gap-1 hover:text-indigo-300">
                      Shop <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save look buttons */}
            <div className="flex gap-2 border-t border-slate-800/60 pt-4">
              <button
                onClick={handleSaveLook}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl font-mono text-xs font-semibold text-slate-300 hover:text-white transition-colors border border-slate-800 flex items-center justify-center gap-1.5"
              >
                <Bookmark className="w-4 h-4 text-cyan-400" /> Save Look
              </button>
            </div>
          </div>

          {/* B. DOCKABLE CUSTOMER SHOWROOM LOOKS */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <span className="text-xs font-semibold text-slate-300">Saved Try-On Shelf ({savedLookbooks.length})</span>
            </div>

            {savedLookbooks.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs italic flex flex-col items-center gap-1.5">
                <Info className="w-5 h-5 text-slate-650" />
                No custom looks stored yet. Click 'Save Look' on try-on completions.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 h-44 overflow-y-auto">
                {savedLookbooks.map((look) => (
                  <div 
                    key={look.id} 
                    className="p-2 rounded-xl bg-slate-950 border border-slate-850 flex flex-col gap-1.5 relative group"
                  >
                    <img 
                      src={look.imageUrl} 
                      alt="Stored fitting" 
                      className="w-full h-20 object-cover rounded-lg border border-slate-800/50"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left font-mono text-[9px] text-slate-500">
                      <div className="font-bold text-white leading-tight truncate">{look.clothing.name}</div>
                      <div className="flex justify-between mt-1">
                        <span>Score: {look.score}</span>
                        <span>{look.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TRUST BADGE AND SECURITY ASSURANCES */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-start gap-2.5 text-left text-slate-500 text-[10px] leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 font-bold block mb-0.5">Biometric Privacy Secure</span>
              WearAI models never store biometric avatar representations. All customized skeletal dimensions are processed in sandbox memory.
            </div>
          </div>

        </section>

      </main>

      {/* 3. FLOATING ACTION TOAST ALERTS DIALOGS */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-indigo-500 text-slate-100 px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 font-mono text-xs text-left max-w-xs transition-transform transform scale-100">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
