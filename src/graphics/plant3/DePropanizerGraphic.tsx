import React, { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useDCSStore } from '../../stores/dcsStore';
import { ControlGroupView } from '../../components/dcs/ControlGroupView';
import { DraggableTag } from '../../components/dcs/layout/DraggableTag';
import { DraggableAnnotation } from '../../components/dcs/layout/DraggableAnnotation';
import { DraggableProcessLine } from '../../components/dcs/layout/DraggableProcessLine';
import { DraggableInstrumentSymbol } from '../../components/dcs/layout/DraggableInstrumentSymbol';
import { ProcessLineDrawer } from '../../components/dcs/layout/ProcessLineDrawer';
import { LayoutEditorToolbar } from '../../components/dcs/layout/LayoutEditorToolbar';
import { useLayoutStore } from '../../stores/useLayoutStore';
import {
  DCS_COLORS as C,
  DcsTag,
  DcsPump,
  DcsControlValve,
  DcsBlockValve,
  DcsShellTubeExchanger,
  DcsKettleReboiler,
  DcsHorizontalDrum,
  DcsVerticalColumn,
  DcsButtonBar,
  DcsButtonDef,
} from './dcsKit';

type ActiveCG = { id: string; tags: string[]; title: string } | null;

export const DePropanizerGraphic: React.FC = () => {
  const { tags, pumps, setControllerMV, setControllerMode } = useSimulationStore();
  const { openFaceplate, openPumpPopup } = useDCSStore();

  const [activeCG, setActiveCG] = useState<ActiveCG>(null);
  const allAnnotations = useLayoutStore((s) => s.annotations);
  const annotations = React.useMemo(() => allAnnotations.filter((a) => a.screenId === 'DE_PROPANIZER'), [allAnnotations]);
  const allLines = useLayoutStore((s) => s.lines);
  const lines = React.useMemo(() => allLines.filter((l) => l.screenId === 'DE_PROPANIZER'), [allLines]);
  const allSymbols = useLayoutStore((s) => s.symbols);
  const symbols = React.useMemo(() => allSymbols.filter((s) => s.screenId === 'DE_PROPANIZER'), [allSymbols]);
  const isEditMode = useLayoutStore((s) => s.isEditMode);

  /* ── Tag measured value helper ── */
  const measured = (tagId: string, fallback = 0) => {
    const v = tags[tagId]?.measuredValue;
    return typeof v === 'number' && isFinite(v) ? v : fallback;
  };

  /* ── Dynamic process variables ── */
  const sumpLevel = measured('LIC9', 51.7);
  const drumLevel = measured('LIC10', 57.7);

  const hic17MV = tags['HIC17']?.mv ?? 0.0;
  const isHic17Open = hic17MV > 0;

  const handleToggleHic17 = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) return;
    const nextMV = isHic17Open ? 0 : 100;
    setControllerMode('HIC17', 'MAN');
    setControllerMV('HIC17', nextMV);
  };

  /* ── Buttons definition for bottom bar ── */
  const buttons: DcsButtonDef[] = [
    {
      label: 'CG0119',
      x: 60,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0119',
        tags: ['PIC5', 'PDIC6', 'TI167', 'TI308', 'TI165', 'TIC5', 'TI164', 'TI309'],
        title: '3C-6 TEMPERATURE PROFILE & PRESSURE'
      })
    },
    {
      label: 'CG0120',
      x: 160,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0120',
        tags: ['TIC5', 'TI164', 'TI309', 'TI166', 'LIC9', 'FIC14', 'FIC95', 'FIC13'],
        title: '3E-6 REBOILER & 3C-6 SUMP'
      })
    },
    {
      label: 'CG0121',
      x: 260,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0121',
        tags: ['PIC5', 'PIC5B', 'PDIC6', 'LIC10', 'FIC12', 'FIC95', 'FIC13', 'HIC17'],
        title: '3E-7 CONDENSER & 3C-7 DRUM'
      })
    },
    {
      label: 'CG0122',
      x: 360,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0122',
        tags: ['FIC12', 'FIC13', 'FIC83', 'FIC9', 'FIC94', 'LIC10', 'PAL171', 'HIC17'],
        title: '3G-6 PUMPS & REFLUX / C3 DRAWS'
      })
    },
    {
      label: 'CG0123',
      x: 460,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0123',
        tags: ['AI21_C2', 'AI21_C3', 'AI21_IC4', 'AI21_NC4', 'FIC12', 'TIC5', 'PIC5', 'FIC95'],
        title: 'AI21 PROPANE PURITY & CONTROLS'
      })
    },
    {
      label: 'TG0006',
      x: 600,
      width: 80,
      onClick: () => useDCSStore.getState().setActiveScreen('TREND')
    },
    {
      label: 'TG0112',
      x: 690,
      width: 80,
      onClick: () => useDCSStore.getState().setActiveScreen('TREND')
    },
    {
      label: 'TG0113',
      x: 780,
      width: 80,
      onClick: () => useDCSStore.getState().setActiveScreen('TREND')
    }
  ];

  /* ── 3C-6 Column geometry ── */
  const colX = 280;
  const colY = 130;
  const colW = 60;
  const colH = 265;

  /* ── 3C-7 Drum geometry ── */
  const drumX = 530;
  const drumY = 195;
  const drumW = 165;
  const drumH = 46;

  return (
    <div className="h-full w-full relative bg-black flex flex-col justify-between select-none">
      <div className="flex-1 min-h-0 flex items-center justify-center p-1">
        <svg
          viewBox="0 0 1000 560"
          className="w-full h-full max-h-[85vh] font-mono"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="1000" height="560" fill={C.bg} />

          {/* ═══════════════════════════════════════════════════════════════
              TITLE (Yokogawa Centum Header)
              ═══════════════════════════════════════════════════════════════ */}
          <text
            x="500"
            y="28"
            fill={C.white}
            fontSize="16"
            fontFamily={C.font}
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="3"
          >
            DE - PROPANIZER COLUMN
          </text>

          {/* ═══════════════════════════════════════════════════════════════
              1. FEED & OVERHEAD CROSSOVER LINES (LEFT / TOP)
              ═══════════════════════════════════════════════════════════════ */}
          {/* 4C-1 Line at top left (magenta) */}
          <text x="145" y="68" fill={C.magenta} fontSize="9" fontFamily={C.font} fontWeight="bold">
            4C-1
          </text>
          <line x1="175" y1="65" x2="195" y2="65" stroke={C.magenta} strokeWidth="1.5" />
          <polygon points="175,65 181,62 181,68" fill={C.magenta} />
          <line x1="195" y1="65" x2="195" y2="125" stroke={C.magenta} strokeWidth="1.5" />
          <DcsBlockValve x={195} y={95} color={C.magenta} rotation={90} scale={0.8} />

          {/* C3 STG header across top (magenta) */}
          <line x1="195" y1="50" x2="780" y2="50" stroke={C.magenta} strokeWidth="1.5" />
          <polygon points="780,50 774,47 774,53" fill={C.magenta} />
          <text x="795" y="53" fill={C.magenta} fontSize="9" fontFamily={C.font} fontWeight="bold">
            C3 STG
          </text>

          {/* FIC95 Recycle branch (magenta) */}
          <line x1="195" y1="65" x2="445" y2="65" stroke={C.magenta} strokeWidth="1.5" />
          <line x1="210" y1="65" x2="210" y2="140" stroke={C.magenta} strokeWidth="1.5" />
          <line x1="210" y1="140" x2={colX} y2="140" stroke={C.magenta} strokeWidth="1.5" />
          <DcsControlValve x={235} y={140} color={C.magenta} scale={0.85} />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="FIC95"
            x={220}
            y={105}
            label="FIC95"
            unit="M3/H"
            decimals={3}
            tagState={tags['FIC95']}
            onOpenFaceplate={openFaceplate}
          />

          {/* 3C-4 Feed line (cyan) entering column */}
          <text x="145" y="173" fill={C.cyan} fontSize="9" fontFamily={C.font} fontWeight="bold">
            3C-4
          </text>
          <line x1="175" y1="170" x2={colX} y2="170" stroke={C.cyan} strokeWidth="1.6" />
          <polygon points="270,170 264,167 264,173" fill={C.cyan} />

          {/* ═══════════════════════════════════════════════════════════════
              2. 3C-6 DISTILLATION COLUMN (Tall Vertical Fractionator)
              ═══════════════════════════════════════════════════════════════ */}
          <DcsVerticalColumn
            x={colX}
            y={colY}
            width={colW}
            height={colH}
            tag="3C-6"
            sumpLevelPercent={sumpLevel}
          />

          {/* Left Column Profile & Reboiler Control Tags */}
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="TIC5"
            x={185}
            y={225}
            label="TIC5"
            unit="°C"
            decimals={1}
            tagState={tags['TIC5']}
            onOpenFaceplate={openFaceplate}
          />
          {/* Signal dashed line from TIC5 to LP steam control valve */}
          <line x1="205" y1="245" x2="205" y2="330" stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="205" y1="330" x2="165" y2="330" stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />

          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="TI164"
            x={210}
            y={295}
            label="TI164"
            unit="°C"
            decimals={1}
            tagState={tags['TI164']}
            onOpenFaceplate={openFaceplate}
          />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="TI309"
            x={210}
            y={335}
            label="TI309"
            unit="°C"
            decimals={1}
            tagState={tags['TI309']}
            onOpenFaceplate={openFaceplate}
          />

          {/* Right Column Profile Tags */}
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="TI167"
            x={395}
            y={105}
            label="TI167"
            unit="°C"
            decimals={1}
            tagState={tags['TI167']}
            onOpenFaceplate={openFaceplate}
          />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="TI308"
            x={395}
            y={145}
            label="TI308"
            unit="°C"
            decimals={1}
            tagState={tags['TI308']}
            onOpenFaceplate={openFaceplate}
          />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="TI165"
            x={395}
            y={185}
            label="TI165"
            unit="°C"
            decimals={1}
            tagState={tags['TI165']}
            onOpenFaceplate={openFaceplate}
          />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="FIC12"
            x={395}
            y={225}
            label="FIC12"
            unit="M3/H"
            decimals={1}
            tagState={tags['FIC12']}
            onOpenFaceplate={openFaceplate}
          />

          {/* Sump Level Tag LIC9 */}
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="LIC9"
            x={355}
            y={315}
            label="LIC9"
            unit="%"
            decimals={1}
            tagState={tags['LIC9']}
            onOpenFaceplate={openFaceplate}
          />
          {/* Signal from LIC9 to bottoms discharge valve */}
          <line x1="375" y1="335" x2="375" y2="400" stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="375" y1="400" x2="425" y2="400" stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />

          {/* ═══════════════════════════════════════════════════════════════
              3. 3E-6 REBOILER LOOP & BOTTOMS PRODUCT TO 3C-8
              ═══════════════════════════════════════════════════════════════ */}
          {/* 3E-6 Reboiler (kettle symbol) */}
          <DcsKettleReboiler x={135} y={350} width={80} height={35} tag="3E-6" />

          {/* LP STM utility line (yellow) with control valve */}
          <text x="145" y="278" fill={C.yellow} fontSize="9" fontFamily={C.font} fontWeight="bold">
            LP
          </text>
          <text x="145" y="290" fill={C.yellow} fontSize="9" fontFamily={C.font} fontWeight="bold">
            STM
          </text>
          <line x1="165" y1="275" x2="165" y2="350" stroke={C.yellow} strokeWidth="1.5" />
          <DcsControlValve x={165} y={315} color={C.yellow} rotation={90} scale={0.85} />

          {/* COND condensate drainage line (orange) */}
          <line x1="165" y1="385" x2="165" y2="420" stroke={C.orange} strokeWidth="1.5" />
          <text x="150" y="432" fill={C.orange} fontSize="9" fontFamily={C.font} fontWeight="bold">
            COND
          </text>

          {/* Bottom liquid into 3E-6 reboiler */}
          <line x1="310" y1={colY + colH} x2="310" y2="400" stroke={C.cyan} strokeWidth="1.6" />
          <line x1="310" y1="400" x2="200" y2="400" stroke={C.cyan} strokeWidth="1.6" />
          <line x1="200" y1="400" x2="200" y2="385" stroke={C.cyan} strokeWidth="1.6" />

          {/* Vapor return from 3E-6 into column */}
          <line x1="215" y1="355" x2="260" y2="355" stroke={C.cyan} strokeWidth="1.6" />
          <line x1="260" y1="355" x2="260" y2="285" stroke={C.cyan} strokeWidth="1.6" />
          <line x1="260" y1="285" x2={colX} y2="285" stroke={C.cyan} strokeWidth="1.6" />

          {/* Bottoms draw line to 3C-8 */}
          <line x1="310" y1="400" x2="475" y2="400" stroke={C.cyan} strokeWidth="1.6" />
          <polygon points="475,400 469,397 469,403" fill={C.cyan} />
          <text x="485" y="403" fill={C.cyan} fontSize="9" fontFamily={C.font} fontWeight="bold">
            3C-8
          </text>
          <DcsControlValve x={425} y={400} color={C.cyan} scale={0.9} />

          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="FIC14"
            x={355}
            y={365}
            label="FIC14"
            unit="M3/H"
            decimals={1}
            tagState={tags['FIC14']}
            onOpenFaceplate={openFaceplate}
          />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="TI166"
            x={355}
            y={425}
            label="TI166"
            unit="°C"
            decimals={1}
            tagState={tags['TI166']}
            onOpenFaceplate={openFaceplate}
          />

          {/* ═══════════════════════════════════════════════════════════════
              4. OVERHEAD CONDENSER 3E-7 & REFLUX DRUM 3C-7
              ═══════════════════════════════════════════════════════════════ */}
          {/* Overhead vapor line from top dome */}
          <line x1="310" y1={colY} x2="310" y2="90" stroke={C.magenta} strokeWidth="1.6" />
          <line x1="310" y1="90" x2="710" y2="90" stroke={C.magenta} strokeWidth="1.6" />

          {/* PDIC6 Differential Pressure across 3C-6 */}
          <line x1="310" y1="110" x2="480" y2="110" stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="PDIC6"
            x={475}
            y={120}
            label="PDIC6"
            unit="KGC2"
            decimals={3}
            tagState={tags['PDIC6']}
            onOpenFaceplate={openFaceplate}
          />

          {/* PIC5A/B Pressure Controller */}
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="PIC5"
            x={570}
            y={120}
            label="PIC5A/B"
            unit="KGC2G"
            decimals={2}
            tagState={tags['PIC5']}
            onOpenFaceplate={openFaceplate}
          />
          {/* Split range bypass valve to drum */}
          <line x1="520" y1="90" x2="520" y2="150" stroke={C.magenta} strokeWidth="1.5" />
          <DcsBlockValve x={520} y={135} color={C.magenta} rotation={90} scale={0.85} />
          <line x1="520" y1="150" x2="580" y2="150" stroke={C.magenta} strokeWidth="1.5" />
          <line x1="580" y1="150" x2="580" y2={drumY} stroke={C.magenta} strokeWidth="1.5" />
          <polygon points="580,195 577,189 583,189" fill={C.magenta} />

          {/* 3E-7 Overhead Condenser (Shell & Tube) */}
          <DcsShellTubeExchanger x={710} y={75} width={105} height={32} tag="3E-7" />
          {/* CW Cooling Water Line */}
          <line x1="785" y1="107" x2="785" y2="130" stroke={C.green} strokeWidth="1.2" />
          <line x1="785" y1="130" x2="810" y2="130" stroke={C.green} strokeWidth="1.2" />
          <polygon points="810,130 804,127 804,133" fill={C.green} />
          <text x="815" y="133" fill={C.green} fontSize="8" fontFamily={C.font} fontWeight="bold">
            CW
          </text>
          <line x1="815" y1="75" x2="815" y2="60" stroke={C.magenta} strokeWidth="1.2" />
          <line x1="815" y1="60" x2="830" y2="60" stroke={C.magenta} strokeWidth="1.2" />
          <polygon points="830,60 824,57 824,63" fill={C.magenta} />

          {/* Liquid drain from 3E-7 into 3C-7 Drum with Valve A */}
          <line x1="720" y1="107" x2="720" y2="175" stroke={C.magenta} strokeWidth="1.5" />
          <line x1="720" y1="175" x2="680" y2="175" stroke={C.magenta} strokeWidth="1.5" />
          <line x1="680" y1="175" x2="680" y2={drumY} stroke={C.magenta} strokeWidth="1.5" />
          <polygon points="680,195 677,189 683,189" fill={C.magenta} />
          <DcsBlockValve x={680} y={160} color={C.magenta} rotation={90} scale={0.8} />
          <text x="668" y="152" fill={C.cyan} fontSize="8" fontFamily={C.font}>
            A
          </text>

          {/* 3C-7 Reflux Drum */}
          <DcsHorizontalDrum
            x={drumX}
            y={drumY}
            width={drumW}
            height={drumH}
            tag="3C-7"
            levelPercent={drumLevel}
            levelColor={C.pink}
          />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="LIC10"
            x={545}
            y={260}
            label="LIC10"
            unit="%"
            decimals={1}
            tagState={tags['LIC10']}
            onOpenFaceplate={openFaceplate}
          />

          {/* Off-gas Vent Line to FG with Valve B */}
          <line x1="615" y1={drumY} x2="615" y2="140" stroke={C.white} strokeWidth="1.2" />
          <polygon points="615,140 612,146 618,146" fill={C.white} />
          <text x="608" y="132" fill={C.white} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            FG
          </text>
          <DcsBlockValve x={615} y={170} color={C.white} rotation={90} scale={0.85} />
          <text x="602" y="165" fill={C.cyan} fontSize="8" fontFamily={C.font}>
            B
          </text>

          {/* Spillback line with FIC13 */}
          <line x1="445" y1="65" x2="445" y2="185" stroke={C.magenta} strokeWidth="1.5" />
          <line x1="445" y1="185" x2="520" y2="185" stroke={C.magenta} strokeWidth="1.5" />
          <DcsControlValve x={485} y={185} color={C.magenta} scale={0.85} />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="FIC13"
            x={485}
            y={150}
            label="FIC13"
            unit="M3/H"
            decimals={3}
            tagState={tags['FIC13']}
            onOpenFaceplate={openFaceplate}
          />

          {/* Drum right dashed signal connections */}
          <line x1={drumX + drumW} y1={drumY + 20} x2={drumX + drumW + 25} y2={drumY + 20} stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />
          <text x={drumX + drumW + 30} y={drumY + 23} fill={C.signal} fontSize="8" fontFamily={C.font} fontWeight="bold">
            FIC9
          </text>
          <line x1={drumX + drumW} y1={drumY + 34} x2={drumX + drumW + 25} y2={drumY + 34} stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />
          <text x={drumX + drumW + 30} y={drumY + 37} fill={C.signal} fontSize="8" fontFamily={C.font} fontWeight="bold">
            FIC94
          </text>

          {/* ═══════════════════════════════════════════════════════════════
              5. 3G-6A/B/C REFLUX PUMPS & DISCHARGE CIRCUITS
              ═══════════════════════════════════════════════════════════════ */}
          {/* Suction header from 3C-7 bottom */}
          <line x1={drumX + drumW * 0.55} y1={drumY + drumH} x2={drumX + drumW * 0.55} y2={410} stroke={C.pink} strokeWidth="1.6" />
          <line x1={drumX + drumW * 0.55} y1={300} x2={670} y2={300} stroke={C.pink} strokeWidth="1.5" />
          <line x1={drumX + drumW * 0.55} y1={355} x2={670} y2={355} stroke={C.pink} strokeWidth="1.5" />
          <line x1={drumX + drumW * 0.55} y1={410} x2={670} y2={410} stroke={C.pink} strokeWidth="1.5" />

          {/* Three Stacked Pumps: 3G-6A, 3G-6B, 3G-6C */}
          <DcsPump
            screenId="DE_PROPANIZER"
            pumpId="3G-6A"
            x={670}
            y={290}
            label="3G-6A"
            isRunning={pumps['3G-6A']?.running}
            isTripped={pumps['3G-6A']?.tripped}
            amps={pumps['3G-6A']?.amps}
            ampsLabel="II1"
            hasIall={!pumps['3G-6A']?.running}
            onOpenPumpPopup={openPumpPopup}
          />
          <DcsPump
            screenId="DE_PROPANIZER"
            pumpId="3G-6B"
            x={670}
            y={345}
            label="3G-6B"
            isRunning={pumps['3G-6B']?.running}
            isTripped={pumps['3G-6B']?.tripped}
            amps={pumps['3G-6B']?.amps}
            ampsLabel="II2"
            hasIall={!pumps['3G-6B']?.running}
            onOpenPumpPopup={openPumpPopup}
          />
          <DcsPump
            screenId="DE_PROPANIZER"
            pumpId="3G-6C"
            x={670}
            y={400}
            label="3G-6C"
            isRunning={pumps['3G-6C']?.running}
            isTripped={pumps['3G-6C']?.tripped}
            amps={pumps['3G-6C']?.amps}
            ampsLabel="II3"
            hasIall={!pumps['3G-6C']?.running}
            onOpenPumpPopup={openPumpPopup}
          />

          {/* Combined discharge header */}
          <line x1={625} y1={300} x2={625} y2={415} stroke={C.magenta} strokeWidth="1.6" />
          <line x1={655} y1={300} x2={625} y2={300} stroke={C.magenta} strokeWidth="1.6" />
          <line x1={655} y1={355} x2={625} y2={355} stroke={C.magenta} strokeWidth="1.6" />
          <line x1={655} y1={410} x2={625} y2={410} stroke={C.magenta} strokeWidth="1.6" />

          {/* Reflux line returning to 3C-6 column */}
          <line x1={625} y1={300} x2={625} y2={250} stroke={C.magenta} strokeWidth="1.6" />
          <line x1={625} y1={250} x2={340} y2={250} stroke={C.magenta} strokeWidth="1.6" />
          <polygon points="340,250 346,247 346,253" fill={C.magenta} />
          <DcsControlValve x={400} y={250} color={C.magenta} scale={0.9} />
          <text x="440" y="265" fill={C.yellow} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            PAL171
          </text>

          {/* Product rundown to 5C-1 via 3E-12 cooler */}
          <line x1={625} y1={370} x2={525} y2={370} stroke={C.magenta} strokeWidth="1.6" />
          <line x1={525} y1={370} x2={525} y2={425} stroke={C.magenta} strokeWidth="1.6" />
          <line x1={525} y1={425} x2={570} y2={425} stroke={C.magenta} strokeWidth="1.6" />
          <polygon points="570,425 564,422 564,428" fill={C.magenta} />
          <text x="575" y="428" fill={C.magenta} fontSize="9" fontFamily={C.font} fontWeight="bold">
            5C-1
          </text>
          <DcsControlValve x={525} y={395} color={C.magenta} rotation={90} scale={0.85} />
          <text x="445" y="375" fill={C.green} fontSize="9" fontFamily={C.font} fontWeight="bold">
            3E-12
          </text>
          <line x1={490} y1={370} x2={475} y2={370} stroke={C.magenta} strokeWidth="1.2" />
          <polygon points="475,370 481,367 481,373" fill={C.magenta} />
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="FIC83"
            x={570}
            y={380}
            label="FIC83"
            unit="M3/H"
            decimals={2}
            tagState={tags['FIC83']}
            onOpenFaceplate={openFaceplate}
          />

          {/* Drain line through HIC17 to LTCS HDR */}
          <line x1={625} y1={355} x2={830} y2={355} stroke={C.white} strokeWidth="1.4" />
          <polygon points="830,355 824,352 824,358" fill={C.white} />
          <text x="835" y="352" fill={C.white} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            LTCS
          </text>
          <text x="835" y="362" fill={C.white} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            HDR
          </text>
          <g transform="translate(760, 355)" className="cursor-pointer" onClick={handleToggleHic17}>
            <DcsBlockValve x={0} y={0} color={isHic17Open ? '#10b981' : C.white} scale={0.9} />
          </g>
          <DcsTag
            screenId="DE_PROPANIZER"
            tagId="HIC17"
            x={760}
            y={330}
            label="HIC17"
            unit="%"
            decimals={1}
            color={isHic17Open ? '#10b981' : C.cyan}
            tagState={tags['HIC17']}
            onOpenFaceplate={openFaceplate}
          />

          {/* ═══════════════════════════════════════════════════════════════
              6. AI21 ONLINE QUALITY ANALYZER BLOCK
              Propane Overhead Product Quality (Strictly bound to tags)
              ═══════════════════════════════════════════════════════════════ */}
          <g fontFamily={C.font} fontWeight="bold">
            <text x="525" y="300" fill={C.cyan} fontSize="9">
              AI21
            </text>
            {[
              { label: 'C2', val: measured('AI21_C2', measured('AI21A', 0.00)), dec: 2 },
              { label: 'C3', val: measured('AI21_C3', measured('AI21B', 0.0)), dec: 1 },
              { label: 'iC4', val: measured('AI21_IC4', measured('AI21C', 1.87)), dec: 2 },
              { label: 'nC4', val: measured('AI21_NC4', 0.00), dec: 2 },
            ].map((row, idx) => (
              <React.Fragment key={row.label}>
                <text x="495" y={314 + idx * 14} fill={C.cyan} fontSize="8.5">
                  {row.label}
                </text>
                <text x="545" y={314 + idx * 14} fill={C.white} fontSize="9">
                  {row.val.toFixed(row.dec)}
                </text>
                <text x="585" y={314 + idx * 14} fill={C.cyan} fontSize="8">
                  %
                </text>
              </React.Fragment>
            ))}
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              CUSTOMIZABLE LAYERS (drag-and-drop overlay)
              ═══════════════════════════════════════════════════════════════ */}
          {lines.map((l) => (
            <DraggableProcessLine key={l.id} line={l} />
          ))}
          {symbols.map((s) => (
            <DraggableInstrumentSymbol key={s.id} symbol={s} />
          ))}
          {annotations.map((ann) => (
            <DraggableAnnotation key={ann.id} annotation={ann} />
          ))}
          <ProcessLineDrawer screenId="DE_PROPANIZER" />

          {/* ═══════════════════════════════════════════════════════════════
              7. BOTTOM NAVIGATION BAR (Yokogawa 3D Bevelled Pushbuttons)
              ═══════════════════════════════════════════════════════════════ */}
          <DcsButtonBar buttons={buttons} />
        </svg>
      </div>

      {/* Floating Layout Editor Toolbar */}
      <LayoutEditorToolbar screenId="DE_PROPANIZER" />

      {activeCG && (
        <ControlGroupView
          groupId={activeCG.id}
          tagIds={activeCG.tags}
          title={activeCG.title}
          onClose={() => setActiveCG(null)}
        />
      )}
    </div>
  );
};
