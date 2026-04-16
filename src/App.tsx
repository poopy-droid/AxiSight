/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Lock, Upload, Download, Crosshair, ImagePlus, Maximize, CircleHelp, X, MonitorPlay, Palette, Github, ChevronDown, Type } from 'lucide-react';

const APP_NAME = "AxiSight: True Overlay Edition";

const hexToRgbVals = (hex: string) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  return {
    r: isNaN(num) ? 255 : (num >> 16) & 255,
    g: isNaN(num) ? 255 : (num >> 8) & 255,
    b: isNaN(num) ? 255 : num & 255
  };
};

const rgbToHexStr = (r: number, g: number, b: number) => {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).padStart(6, '0').toUpperCase();
};

const SteamIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M.329 10.333A8.01 8.01 0 0 0 7.99 16C12.414 16 16 12.418 16 8s-3.586-8-8.01-8A8.006 8.006 0 0 0 0 7.468l.003.006 4.304 1.769A2.198 2.198 0 0 1 5.62 8.88l1.96-2.844-.001-.04a3.046 3.046 0 0 1 3.042-3.043 3.046 3.046 0 0 1 3.042 3.043 3.047 3.047 0 0 1-3.111 3.044l-2.804 2a2.223 2.223 0 0 1-3.075 2.11 2.217 2.217 0 0 1-1.312-1.568L.33 10.333Z"/>
    <path d="M4.868 12.683a1.715 1.715 0 0 0 1.318-3.165 1.705 1.705 0 0 0-1.263-.02l1.023.424a1.261 1.261 0 1 1-.97 2.33l-.99-.41a1.7 1.7 0 0 0 .882.84Zm3.726-6.687a2.03 2.03 0 0 0 2.027 2.029 2.03 2.03 0 0 0 2.027-2.029 2.03 2.03 0 0 0-2.027-2.027 2.03 2.03 0 0 0-2.027 2.027Zm2.03-1.527a1.524 1.524 0 1 1-.002 3.048 1.524 1.524 0 0 1 .002-3.048Z"/>
  </svg>
);

const buildDynamicCrosshair = (
  color: string, 
  thickness: number, 
  length: number, 
  distance: number, 
  dot: boolean, 
  outline: boolean, 
  circle: boolean, 
  circleRadius: number
) => {
  const c = 50; // Center
  
  const drawLayer = (isOutline: boolean) => {
    if (isOutline && !outline) return "";
    
    const strokeCol = isOutline ? "#000" : color;
    const fillCol = isOutline ? "#000" : color;
    const strW = isOutline ? thickness + 2 : thickness;
    
    let shapes = "";
    
    if (dot) {
      const r = isOutline ? (thickness)/2 + 1 : (thickness)/2;
      shapes += `<rect x='${c - r}' y='${c - r}' width='${r*2}' height='${r*2}' fill='${fillCol}' />`;
    }
    
    if (circle) {
      shapes += `<circle cx='${c}' cy='${c}' r='${circleRadius}' fill='none' stroke='${strokeCol}' stroke-width='${strW}' />`;
    }
    
    if (length > 0) {
      shapes += `<line x1='${c}' y1='${c - distance}' x2='${c}' y2='${c - distance - length}' stroke='${strokeCol}' stroke-width='${strW}' stroke-linecap='butt' />`;
      shapes += `<line x1='${c}' y1='${c + distance}' x2='${c}' y2='${c + distance + length}' stroke='${strokeCol}' stroke-width='${strW}' stroke-linecap='butt' />`;
      shapes += `<line x1='${c - distance}' y1='${c}' x2='${c - distance - length}' y2='${c}' stroke='${strokeCol}' stroke-width='${strW}' stroke-linecap='butt' />`;
      shapes += `<line x1='${c + distance}' y1='${c}' x2='${c + distance + length}' y2='${c}' stroke='${strokeCol}' stroke-width='${strW}' stroke-linecap='butt' />`;
    }
    
    return shapes;
  };

  const svgString = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    ${drawLayer(true)}
    ${drawLayer(false)}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
};


export default function App() {
  const [isLocked, setIsLocked] = useState(false);
  
  const [resW, setResW] = useState(1920);
  const [resH, setResH] = useState(1080);
  
  const [yPos, setYPos] = useState(50); 
  const [spread, setSpread] = useState(300);
  const [fontSize, setFontSize] = useState(48);
  const [crosshairSize, setCrosshairSize] = useState(64);
  
  const [textColor, setTextColor] = useState('#D0D0D0');
  const [crosshairColor, setCrosshairColor] = useState('#00FF00'); 
  const [textOpacity, setTextOpacity] = useState(80);
  const [crosshairOpacity, setCrosshairOpacity] = useState(80);
  
  const [showIndicators, setShowIndicators] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);

  const [chThickness, setChThickness] = useState(2);
  const [chLength, setChLength] = useState(12);
  const [chDistance, setChDistance] = useState(6);
  const [chDot, setChDot] = useState(false);
  const [chOutline, setChOutline] = useState(true);
  const [chCircle, setChCircle] = useState(false);
  const [chCircleRadius, setChCircleRadius] = useState(15);
  
  const defaultList = [
    { id: 'default', name: 'Generative Crosshair (Editable)' }
  ];
  const [savedCrosshairs, setSavedCrosshairs] = useState<{id: string, name: string, url?: string}[]>(defaultList);
  const [activeCrosshairId, setActiveCrosshairId] = useState('default');
  
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpOS, setHelpOS] = useState<'windows' | 'linux' | 'mac'>('windows');
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

  const getActiveCrosshairUrl = () => {
    const active = savedCrosshairs.find(c => c.id === activeCrosshairId) || savedCrosshairs[0];
    if (active.id === 'default' || !active.url) {
      return buildDynamicCrosshair(
        crosshairColor, chThickness, chLength, chDistance, chDot, chOutline, chCircle, chCircleRadius
      );
    }
    return active.url;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('AxiSightConfig');
      if (stored) {
        const conf = JSON.parse(stored);
        if (conf.resW !== undefined) setResW(conf.resW);
        if (conf.resH !== undefined) setResH(conf.resH);
        if (conf.textColor !== undefined) setTextColor(conf.textColor);
        if (conf.crosshairColor !== undefined) setCrosshairColor(conf.crosshairColor);
        if (conf.textOpacity !== undefined) setTextOpacity(conf.textOpacity);
        if (conf.crosshairOpacity !== undefined) setCrosshairOpacity(conf.crosshairOpacity);
        if (conf.yPos !== undefined) setYPos(conf.yPos);
        if (conf.spread !== undefined) setSpread(conf.spread);
        if (conf.fontSize !== undefined) setFontSize(conf.fontSize);
        if (conf.crosshairSize !== undefined) setCrosshairSize(conf.crosshairSize);
        if (conf.showIndicators !== undefined) setShowIndicators(conf.showIndicators);
        if (conf.showCrosshair !== undefined) setShowCrosshair(conf.showCrosshair);
        
        if (conf.chThickness !== undefined) setChThickness(conf.chThickness);
        if (conf.chLength !== undefined) setChLength(conf.chLength);
        if (conf.chDistance !== undefined) setChDistance(conf.chDistance);
        if (conf.chDot !== undefined) setChDot(conf.chDot);
        if (conf.chOutline !== undefined) setChOutline(conf.chOutline);
        if (conf.chCircle !== undefined) setChCircle(conf.chCircle);
        if (conf.chCircleRadius !== undefined) setChCircleRadius(conf.chCircleRadius);

        if (conf.savedCrosshairs) {
          const mapped = conf.savedCrosshairs.map((c: any, i: number) => {
             if (c.id === 'default' || c.name.includes('Generative Crosshair') || c.name.includes('Default Cross')) return defaultList[0];
             return { id: c.id || `custom-${i}`, name: c.name, url: c.url };
          });
          setSavedCrosshairs(mapped);

          let newActiveId = conf.activeCrosshairId || 'default';
          if (conf.activeCrosshairUrl && !conf.activeCrosshairId) {
            const found = mapped.find((m: any) => m.url === conf.activeCrosshairUrl);
            if (found) newActiveId = found.id;
          }
          setActiveCrosshairId(newActiveId);
        }
      }
    } catch (e) {
      console.error("Failed to load local config.", e);
    }
  }, []);

  useEffect(() => {
    const conf = { 
      resW, resH, textColor, crosshairColor, textOpacity, crosshairOpacity, 
      yPos, spread, fontSize, crosshairSize, showIndicators, showCrosshair, 
      chThickness, chLength, chDistance, chDot, chOutline, chCircle, chCircleRadius,
      savedCrosshairs, activeCrosshairId 
    };
    localStorage.setItem('AxiSightConfig', JSON.stringify(conf));
  }, [
    resW, resH, textColor, crosshairColor, textOpacity, crosshairOpacity, 
    yPos, spread, fontSize, crosshairSize, showIndicators, showCrosshair, 
    chThickness, chLength, chDistance, chDot, chOutline, chCircle, chCircleRadius,
    savedCrosshairs, activeCrosshairId
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Insert' || e.key === 'Home') {
        setIsLocked(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newUrl = event.target?.result as string;
      const newId = `custom-${Date.now()}`;
      const newCrosshair = { id: newId, name: file.name, url: newUrl };
      setSavedCrosshairs([...savedCrosshairs, newCrosshair]);
      setActiveCrosshairId(newId);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const exportConfig = () => {
    const conf = { 
      resW, resH, textColor, crosshairColor, textOpacity, crosshairOpacity, 
      yPos, spread, fontSize, crosshairSize, showIndicators, showCrosshair,
      chThickness, chLength, chDistance, chDot, chOutline, chCircle, chCircleRadius, 
      savedCrosshairs, activeCrosshairId 
    };
    const blob = new Blob([JSON.stringify(conf, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AxiSight_Config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conf = JSON.parse(event.target?.result as string);
        if (conf.resW !== undefined) setResW(conf.resW);
        if (conf.resH !== undefined) setResH(conf.resH);
        if (conf.textColor !== undefined) setTextColor(conf.textColor);
        if (conf.crosshairColor !== undefined) setCrosshairColor(conf.crosshairColor);
        if (conf.textOpacity !== undefined) setTextOpacity(conf.textOpacity);
        if (conf.crosshairOpacity !== undefined) setCrosshairOpacity(conf.crosshairOpacity);
        if (conf.yPos !== undefined) setYPos(conf.yPos);
        if (conf.spread !== undefined) setSpread(conf.spread);
        if (conf.fontSize !== undefined) setFontSize(conf.fontSize);
        if (conf.crosshairSize !== undefined) setCrosshairSize(conf.crosshairSize);
        if (conf.showIndicators !== undefined) setShowIndicators(conf.showIndicators);
        if (conf.showCrosshair !== undefined) setShowCrosshair(conf.showCrosshair);
        
        if (conf.chThickness !== undefined) setChThickness(conf.chThickness);
        if (conf.chLength !== undefined) setChLength(conf.chLength);
        if (conf.chDistance !== undefined) setChDistance(conf.chDistance);
        if (conf.chDot !== undefined) setChDot(conf.chDot);
        if (conf.chOutline !== undefined) setChOutline(conf.chOutline);
        if (conf.chCircle !== undefined) setChCircle(conf.chCircle);
        if (conf.chCircleRadius !== undefined) setChCircleRadius(conf.chCircleRadius);

        if (conf.savedCrosshairs) setSavedCrosshairs(conf.savedCrosshairs);
        if (conf.activeCrosshairId) setActiveCrosshairId(conf.activeCrosshairId);
      } catch (err) {
        alert("Invalid Config File");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to true-fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const osLabel = (os: string) => {
    switch (os) {
      case 'windows': return <><span className="text-[10px] uppercase font-light mr-[1px]">micro</span>SLOP binbows</>;
      case 'mac': return "macOS";
      case 'linux': return "Linux";
      default: return "";
    }
  };

  return (
    <div 
      className={`fixed inset-0 w-screen h-screen overflow-hidden font-sans text-white ${isLocked ? 'pointer-events-none' : ''}`}
      style={{ backgroundColor: isLocked ? 'transparent' : 'rgba(0,0,0,0.85)' }}
    >
      <div className="zoolander-easter-egg opacity-0 absolute pointer-events-none -z-50 shrink-0 w-0 h-0 overflow-hidden" aria-hidden="true">
        "I'm not an ambiturner. I can't turn left." - Derek Zoolander
      </div>

      {!isLocked && (
        <div className="absolute top-4 left-4 bg-[#18191a] border border-[#2d88ff] p-5 rounded-lg shadow-2xl z-50 w-[420px] pointer-events-auto overflow-y-auto max-h-[90vh] custom-scrollbar">
          
          <div className="flex flex-col mb-4 pb-3 border-b border-[#3a3b3c]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-[#2d88ff] flex items-center gap-2">
                  <MonitorPlay size={20} />
                  {APP_NAME}
                </h2>
                <p className="text-xs text-[#b0b3b8] mt-1">True Transparent Overlay Architecture</p>
              </div>
              <button onClick={() => setShowHelpModal(true)} className="text-[#b0b3b8] hover:text-white transition-colors p-1" title="How to use as a real overlay">
                <CircleHelp size={20} />
              </button>
            </div>
          </div>
          
          <div className="space-y-4 text-xs">

            <div className="bg-[#242526] p-4 rounded border border-[#3a3b3c] flex flex-col gap-3 shadow-inner">
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowCrosshair(!showCrosshair)} 
                  className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 font-bold text-xs transition-colors ${showCrosshair ? 'bg-[#2d88ff] text-white' : 'bg-[#3a3b3c] text-[#b0b3b8] hover:bg-[#4e4f50]'}`}
                >
                  <Crosshair size={14} /> {showCrosshair ? 'ON' : 'OFF'}
                </button>
                <button 
                  onClick={() => setShowIndicators(!showIndicators)} 
                  className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 font-bold text-xs transition-colors ${showIndicators ? 'bg-[#2d88ff] text-white' : 'bg-[#3a3b3c] text-[#b0b3b8] hover:bg-[#4e4f50]'}`}
                >
                  <Type size={14} /> {showIndicators ? 'ON' : 'OFF'}
                </button>
                <button 
                  onClick={toggleFullscreen} 
                  className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 font-bold text-xs transition-colors ${document.fullscreenElement ? 'bg-[#2d88ff] text-white' : 'bg-[#3a3b3c] text-[#b0b3b8] hover:bg-[#4e4f50]'}`}
                  title="Toggle True Fullscreen Overlay Mode"
                >
                  <Maximize size={14} /> FS {document.fullscreenElement ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="bg-[#242526] p-3 rounded border border-[#3a3b3c]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[#e4e6eb] text-sm">1. Screen Workspace Size (px)</h3>
                <button 
                  onClick={() => { setResW(window.innerWidth); setResH(window.innerHeight); }}
                  className="text-[10px] bg-[#3a3b3c] hover:bg-[#4e4f50] text-[#2d88ff] px-2 py-0.5 rounded font-bold border border-[#4e4f50]"
                >
                  AUTO-SYNC
                </button>
              </div>
              <p className="text-[10px] text-[#b0b3b8] mb-2 leading-tight">Match this to your monitor resolution (e.g. 1920x1080). If left/right feels off, hit AUTO-SYNC to snap to current window.</p>
              <div className="flex gap-4">
                <label className="flex-1 block">
                  <span className="text-[#b0b3b8]">Width (X)</span>
                  <input type="number" value={resW} onChange={e => setResW(Number(e.target.value))} className="w-full bg-[#3a3b3c] border border-[#4e4f50] rounded p-1.5 text-center font-mono mt-1 text-white"/>
                </label>
                <div className="flex items-center justify-center pt-5 text-[#b0b3b8] font-bold">x</div>
                <label className="flex-1 block">
                  <span className="text-[#b0b3b8]">Height (Y)</span>
                  <input type="number" value={resH} onChange={e => setResH(Number(e.target.value))} className="w-full bg-[#3a3b3c] border border-[#4e4f50] rounded p-1.5 text-center font-mono mt-1 text-white"/>
                </label>
              </div>
              <button 
                onClick={toggleFullscreen}
                className="w-full mt-3 py-1.5 bg-[#3a3b3c] hover:bg-[#4e4f50] border border-[#4e4f50] rounded text-white flex items-center justify-center gap-2 transition font-medium"
              >
                <Maximize size={14} /> Fullscreen alignment mode
              </button>
            </div>

            <div className="bg-[#242526] p-3 rounded border border-[#3a3b3c]">
              <h3 className="font-bold text-[#e4e6eb] mb-3 flex items-center gap-2 text-sm">
                <Palette size={16}/> 2. Colors & Transparency
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col items-center justify-center bg-[#3a3b3c] py-3 rounded border border-[#4e4f50] shadow-sm hover:border-[#2d88ff] transition-colors relative">
                  <h4 className="text-[10px] text-[#e4e6eb] font-bold mb-2 tracking-wider uppercase text-center leading-tight">Color picker<br/>for <span className="text-[#2d88ff]">Text</span></h4>
                  <input 
                    type="color" 
                    value={textColor} 
                    onChange={e => setTextColor(e.target.value)}
                    className="w-14 h-14 rounded cursor-pointer border-0 bg-transparent p-0 absolute inset-0 opacity-0 w-full h-full"
                    title="Pick Text Color"
                  />
                  <div className="w-10 h-10 rounded border border-gray-900 pointer-events-none" style={{ backgroundColor: textColor }}></div>
                </div>

                <div className="flex flex-col items-center justify-center bg-[#3a3b3c] py-3 rounded border border-[#4e4f50] shadow-sm hover:border-[#2d88ff] transition-colors relative">
                  <h4 className="text-[10px] text-[#e4e6eb] font-bold mb-2 tracking-wider uppercase text-center leading-tight">Color picker<br/>for <span className="text-[#2d88ff]">Crosshair</span></h4>
                  <input 
                    type="color" 
                    value={crosshairColor} 
                    onChange={e => setCrosshairColor(e.target.value)}
                    className="w-14 h-14 rounded cursor-pointer border-0 bg-transparent p-0 absolute inset-0 opacity-0 w-full h-full"
                    title="Pick Crosshair Color"
                  />
                  <div className="w-10 h-10 rounded border border-gray-900 pointer-events-none" style={{ backgroundColor: crosshairColor }}></div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#3a3b3c] space-y-3">
                <label className="block">
                  <span className="flex justify-between text-[#b0b3b8] font-semibold mb-1">Left/Right Text Opacity <span className="font-mono text-[#2d88ff]">{textOpacity}%</span></span>
                  <input type="range" min="0" max="100" value={textOpacity} onChange={e => setTextOpacity(Number(e.target.value))} className="w-full accent-[#2d88ff]"/>
                </label>
                <label className="block mt-2">
                  <span className="flex justify-between text-[#b0b3b8] font-semibold mb-1">Center Crosshair Opacity <span className="font-mono text-[#2d88ff]">{crosshairOpacity}%</span></span>
                  <input type="range" min="0" max="100" value={crosshairOpacity} onChange={e => setCrosshairOpacity(Number(e.target.value))} className="w-full accent-[#2d88ff]"/>
                </label>
              </div>
            </div>

            <div className="bg-[#242526] p-3 rounded border border-[#3a3b3c] space-y-3">
              <h3 className="font-bold text-[#e4e6eb] text-sm">3. Text Layout</h3>
              
              <label className="block">
                <span className="flex justify-between text-[#b0b3b8]">Vertical Axis (Y) <span>{yPos}%</span></span>
                <input type="range" min="0" max="100" value={yPos} onChange={e => setYPos(Number(e.target.value))} className="w-full mt-1 accent-[#2d88ff]"/>
              </label>
              <label className="block">
                <span className="flex justify-between text-[#b0b3b8]">Horizontal Spread <span>{spread}px</span></span>
                <input type="range" min="0" max="1000" value={spread} onChange={e => setSpread(Number(e.target.value))} className="w-full mt-1 accent-[#2d88ff]"/>
              </label>
              <label className="block">
                <span className="flex justify-between text-[#b0b3b8]">Font Size <span>{fontSize}px</span></span>
                <input type="range" min="10" max="250" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full mt-1 accent-[#2d88ff]"/>
              </label>
            </div>
            
            <div className="bg-[#242526] p-3 rounded border border-[#3a3b3c] space-y-3">
              <h3 className="font-bold text-[#e4e6eb] flex items-center gap-2 text-sm"><Crosshair size={16}/> 4. Center Crosshair</h3>
              
              <div className="flex gap-2 mb-2">
                <select 
                  value={activeCrosshairId} 
                  onChange={(e) => setActiveCrosshairId(e.target.value)}
                  className="flex-1 bg-[#3a3b3c] border border-[#4e4f50] rounded p-2 text-white shadow-inner font-bold text-xs"
                >
                  {savedCrosshairs.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 bg-[#2d88ff] hover:bg-[#1877f2] rounded text-white flex items-center gap-2 transition shadow font-bold"
                  title="Load PNG/SVG"
                >
                  <ImagePlus size={16} /> Add 
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept=".png,.svg" className="hidden" />
              </div>

              {activeCrosshairId === 'default' && (
                <div className="p-3 bg-[#18191a] rounded border border-[#3a3b3c] space-y-3 shadow-inner my-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#e4e6eb] text-[11px] uppercase tracking-wide">Crosshair Builder</span>
                  </div>
                  
                  <label className="block">
                    <span className="flex justify-between text-[#b0b3b8] text-[11px]">Thickness <span>{chThickness}</span></span>
                    <input type="range" min="1" max="20" value={chThickness} onChange={e => setChThickness(Number(e.target.value))} className="w-full mt-1 accent-[#2d88ff]"/>
                  </label>
                  
                  <label className="block">
                    <span className="flex justify-between text-[#b0b3b8] text-[11px]">Length <span>{chLength}</span></span>
                    <input type="range" min="0" max="50" value={chLength} onChange={e => setChLength(Number(e.target.value))} className="w-full mt-1 accent-[#2d88ff]"/>
                  </label>
                  
                  <label className="block">
                    <span className="flex justify-between text-[#b0b3b8] text-[11px]">Center Gap <span>{chDistance}</span></span>
                    <input type="range" min="0" max="50" value={chDistance} onChange={e => setChDistance(Number(e.target.value))} className="w-full mt-1 accent-[#2d88ff]"/>
                  </label>

                  <div className="flex gap-4 pt-2 border-t border-[#3a3b3c]">
                    <label className="flex items-center gap-2 cursor-pointer text-[#e4e6eb] font-semibold text-[11px]">
                      <input type="checkbox" checked={chDot} onChange={e => setChDot(e.target.checked)} className="accent-[#2d88ff] w-3.5 h-3.5"/> Dot
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#e4e6eb] font-semibold text-[11px]">
                      <input type="checkbox" checked={chOutline} onChange={e => setChOutline(e.target.checked)} className="accent-[#2d88ff] w-3.5 h-3.5"/> Outline
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#e4e6eb] font-semibold text-[11px]">
                      <input type="checkbox" checked={chCircle} onChange={e => setChCircle(e.target.checked)} className="accent-[#2d88ff] w-3.5 h-3.5"/> Circle
                    </label>
                  </div>
                  
                  {chCircle && (
                    <label className="block pt-2">
                      <span className="flex justify-between text-[#b0b3b8] text-[11px]">Circle Radius <span>{chCircleRadius}</span></span>
                      <input type="range" min="5" max="50" value={chCircleRadius} onChange={e => setChCircleRadius(Number(e.target.value))} className="w-full mt-1 accent-[#2d88ff]"/>
                    </label>
                  )}
                </div>
              )}

              <label className="block pt-1">
                <span className="flex justify-between text-[#b0b3b8]">Global Scale Size <span>{crosshairSize}px</span></span>
                <input type="range" min="4" max="500" value={crosshairSize} onChange={e => setCrosshairSize(Number(e.target.value))} className="w-full mt-2 accent-[#2d88ff]"/>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => setIsLocked(true)}
                className="col-span-2 py-3 bg-[#2d88ff] hover:bg-[#1877f2] flex items-center justify-center gap-2 rounded font-black text-white shadow-[0_0_15px_rgba(45,136,255,0.4)] transition transform active:scale-[0.98]"
              >
                <Lock size={18} /> Hide Menu & Start Overlay
              </button>
              
              <button onClick={exportConfig} className="bg-[#3a3b3c] hover:bg-[#4e4f50] border border-[#4e4f50] py-2 rounded flex items-center justify-center gap-2 text-[#e4e6eb] font-semibold">
                <Download size={16}/> Save JSON
              </button>
              <button onClick={() => configInputRef.current?.click()} className="bg-[#3a3b3c] hover:bg-[#4e4f50] border border-[#4e4f50] py-2 rounded flex items-center justify-center gap-2 text-[#e4e6eb] font-semibold">
                <Upload size={16}/> Load JSON
              </button>
              <input type="file" ref={configInputRef} onChange={importConfig} accept=".json" className="hidden" />
            </div>

            <p className="text-[11px] text-[#b0b3b8] text-center font-bold">
              Unlock Hotkeys: Press "INSERT" or "HOME"
            </p>

            <div className="pt-5 mt-2 border-t border-[#3a3b3c] flex flex-col items-center gap-2 pb-2">
              <p className="text-[9px] text-[#8a8d91] font-bold uppercase tracking-widest">Built By</p>
              <div className="flex items-center gap-4">
                <a href="https://github.com/poopy-droid" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#b0b3b8] hover:text-[#2d88ff] text-[11px] font-bold transition-colors">
                  <Github className="w-4 h-4" /> poopy-droid
                </a>
                <span className="text-[#8a8d91] font-bold text-[10px]">A.K.A</span>
                <a href="https://steamcommunity.com/id/Smug-Cat/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#b0b3b8] hover:text-[#2d88ff] text-[11px] font-bold transition-colors">
                  <SteamIcon /> Smug-Cat
                </a>
              </div>
              <p className="text-[10px] text-[#e4e6eb] font-semibold mt-1">
                100% with the help of vibe coding
              </p>
            </div>

          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100] pointer-events-auto p-4 backdrop-blur-sm">
          <div className="bg-[#242526] border border-[#2d88ff] p-6 rounded-lg max-w-lg shadow-2xl relative w-full">
            <button onClick={() => setShowHelpModal(false)} className="absolute top-4 right-4 text-[#b0b3b8] hover:text-white transition">
              <X size={24}/>
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#e4e6eb]">Using this outside the browser</h2>
            <p className="text-[#b0b3b8] text-sm mb-4 leading-relaxed">
              When you lock this program, the <em>background becomes entirely transparent</em>. To make it sit over a game while passing clicks entirely:
            </p>
            
            <div className="mb-6 relative">
              <div className="bg-[#18191a] border border-[#3a3b3c] rounded p-1 flex">
                <button 
                  onClick={() => setIsHelpDropdownOpen(!isHelpDropdownOpen)}
                  className="w-full flex justify-between items-center bg-[#242526] hover:bg-[#3a3b3c] p-2 rounded text-[#e4e6eb] font-bold text-sm transition"
                >
                  <span>Select OS: {osLabel(helpOS)}</span>
                  <ChevronDown size={16} />
                </button>
              </div>

              {isHelpDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#242526] border border-[#3a3b3c] rounded overflow-hidden shadow-xl z-50">
                  <button onClick={() => { setHelpOS('windows'); setIsHelpDropdownOpen(false); }} className="w-full text-left p-3 hover:bg-[#3a3b3c] text-[#e4e6eb] font-bold text-sm border-b border-[#3a3b3c] flex items-center gap-2">
                    <span className="text-[10px] uppercase font-light">micro</span>SLOP binbows
                  </button>
                  <button onClick={() => { setHelpOS('mac'); setIsHelpDropdownOpen(false); }} className="w-full text-left p-3 hover:bg-[#3a3b3c] text-[#e4e6eb] font-bold text-sm border-b border-[#3a3b3c]">
                    macOS
                  </button>
                  <button onClick={() => { setHelpOS('linux'); setIsHelpDropdownOpen(false); }} className="w-full text-left p-3 hover:bg-[#3a3b3c] text-[#e4e6eb] font-bold text-sm">
                    Linux
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#18191a] border border-[#3a3b3c] p-4 rounded text-[#b0b3b8] text-sm space-y-4 mb-6 min-h-[140px] max-h-[40vh] overflow-y-auto custom-scrollbar">
              {helpOS === 'windows' && (
                <>
                  <p><strong><span className="text-[10px] uppercase font-light mr-[1px]">micro</span>SLOP binbows:</strong></p>
                  <div className="space-y-3 pl-2">
                    <div className="p-3 bg-[#2d88ff15] border-l-4 border-[#2d88ff] rounded-r text-[#e4e6eb] text-xs leading-relaxed">
                      <p className="font-black uppercase mb-1">🔥 THE BEST METHOD: STEAM OVERLAY</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Launch your Steam game.</li>
                        <li>Press <strong>SHIFT + TAB</strong> to open the overlay.</li>
                        <li>Open the small <strong>Web Browser</strong> button at the bottom.</li>
                        <li>Paste your AxiSight URL into it.</li>
                        <li><strong>MANDATORY:</strong> Click the <strong>PIN</strong> icon (top right of browser window). Without this, it won't stay active in-game.</li>
                        <li>Set <strong>Opacity</strong> to your liking.</li>
                      </ol>
                      <div className="mt-2 p-2 bg-[#ffc10720] border border-[#ffc10740] rounded text-[10px] text-[#ffc107]">
                        <strong>⚠️ WARNING:</strong> If you increase the Steam Overlay's global opacity, the browser background may become visible even if pinned. Keep the browser window pinned and adjust window-specific opacity for best results.
                      </div>
                    </div>

                    <p><strong>Solution 1: Steam Overlay Injection</strong><br/>
                    As detailed above. This is the #1 solution for Windows users. It's built into every Steam game.</p>
                    
                    <p><strong>Solution 2: Xbox Game Bar (Win+G)</strong><br/>
                    Press Win+G to open the Windows Game Bar. Go to the Widget Store, install a "Browser" widget. Set the URL to this app, click the "Pin" button. It natively layers over games with pass-through.</p>

                    <p><strong>Solution 3: 3rd-Party Click-Through Apps</strong><br/>
                    Download a dedicated tool like <strong>WindowTop</strong>, <strong>Ghoster</strong>, or a custom AutoHotkey script. Run this app in a normal borderless browser window, then toggle "Always on Top" and "Ignore Mouse Events".</p>
                  </div>
                </>
              )}
              {helpOS === 'mac' && (
                <>
                  <p><strong>macOS:</strong></p>
                  <div className="space-y-3 pl-2">
                    <p><strong>Solution 1: Helium App</strong><br/>
                    Download the app "Helium" for macOS. It's a lightweight browser built specifically for floating web content. Load this URL, adjust transparency, and toggle mouse interaction off.</p>
                    
                    <p><strong>Solution 2: Electron Wrapper Script</strong><br/>
                    Create a tiny ElectronJS script. In `main.js`, load this URL and set `transparent: true`, `frame: false`. Most importantly, call `win.setIgnoreMouseEvents(true)` to natively pass clicks through to your game.</p>
                    
                    <p><strong>Solution 3: Plash Desktop Overlay</strong><br/>
                    Use the "Plash" app (or similar desktop-overlay utilities on macOS) to set the URL as an overlay layer. This works best if you are running games in windowed borderless mode rather than exclusive full-screen.</p>
                  </div>
                </>
              )}
              {helpOS === 'linux' && (
                <>
                  <p><strong>Linux:</strong></p>
                  <div className="space-y-3 pl-2">
                    <p><strong>Solution 1: Wayland / Gamescope Layering</strong><br/>
                    Run your game inside Gamescope. You can launch the browser with this overlay inside the same session or composite it tightly, taking advantage of Wayland's layer-shell extensions if supported by your compositor.</p>
                    
                    <p><strong>Solution 2: X11 xprop / xshape Hacks</strong><br/>
                    Open this app in Chrome/Firefox. Find the Window ID using `xwininfo`. Use `xprop` to force "Always on Top". Use `xshape` to configure input regions to pass clicks physically to the game below.</p>
                    
                    <p><strong>Solution 3: Custom Widget Wrapper (Eww / Waybar)</strong><br/>
                    Build a custom Eww, Waybar, or AGS widget configuration that embeds this web overlay. These widget systems run on the outermost compositing layer and can be trivially set to ignore pointer events natively.</p>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => setShowHelpModal(false)} className="w-full bg-[#2d88ff] hover:bg-[#1877f2] text-white font-bold py-2.5 rounded transition">
              Understood
            </button>
          </div>
        </div>
      )}

      <div 
        className="fixed pointer-events-none select-none"
        style={{ 
          width: `${resW}px`, 
          height: `${resH}px`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {showCrosshair && (
          <div 
            className="absolute flex items-center justify-center z-10"
            style={{ 
              top: '50%', left: '50%', 
              transform: 'translate(-50%, -50%)', 
              opacity: crosshairOpacity / 100 
            }}
          >
            <img 
              src={getActiveCrosshairUrl()} 
              alt="crosshair" 
              className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
              style={{ 
                width: `${crosshairSize}px`,
                height: `${crosshairSize}px`,
                objectFit: 'contain'
               }} 
            />
          </div>
        )}

        {showIndicators && (
          <div 
            className="absolute font-black tracking-widest"
            style={{ 
              top: `${yPos}%`, 
              left: '50%',
              transform: `translate(calc(-50% - ${spread}px), -50%)`, 
              fontSize: `${fontSize}px`, 
              color: textColor,
              textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 4px 4px 10px rgba(0,0,0,0.8)',
              opacity: textOpacity / 100 
            }}
          >
            LEFT
          </div>
        )}

        {showIndicators && (
          <div 
            className="absolute font-black tracking-widest"
            style={{ 
              top: `${yPos}%`, 
              left: '50%',
              transform: `translate(calc(-50% + ${spread}px), -50%)`, 
              fontSize: `${fontSize}px`, 
              color: textColor,
              textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 4px 4px 10px rgba(0,0,0,0.8)',
              opacity: textOpacity / 100 
            }}
          >
            RIGHT
          </div>
        )}
      </div>

    </div>
  );
}
