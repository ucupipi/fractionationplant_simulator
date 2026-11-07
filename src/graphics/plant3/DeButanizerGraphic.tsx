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

export const DeButanizerGraphic: React.FC = () => {
  const { tags, pumps, setControllerMV, setControllerMode } = useSimulationStore();
  const { openFaceplate, openPumpPopup } = useDCSStore();

  const [activeCG, setActiveCG] = useState<ActiveCG>(null);
  const allAnnotations = useLayoutStore((s) => s.annotations);
  const annotations = React.useMemo(() => allAnnotations.filter((a) => a.screenId === 'DE_BUTANIZER'), [allAnnotations]);
  const allLines = useLayoutStore((s) => s.lines);
  const lines = React.useMemo(() => allLines.filter((l) => l.screenId === 'DE_BUTANIZER'), [allLines]);
  const allSymbols = useLayoutStore((s) => s.symbols);
  const symbols = React.useMemo(() => allSymbols.filter((s) => s.screenId === 'DE_BUTANIZER'), [allSymbols]);
  const isEditMode = useLayoutStore((s) => s.isEditMode);

  /* ── Tag measured value helper ── */
  const measured = (tagId: string, fallback = 0) => {
    const v = tags[tagId]?.measuredValue;
    return typeof v === 'number' && isFinite(v) ? v : fallback;
  };

  /* ── Dynamic process variables ── */
  const sumpLevel = measured('LIC11', 59.0);
  const drumLevel = measured('LIC12', 54.1);
  const columnPressure = measured('PIC7', 6.01);
  const isPsvRelieving = columnPressure >= 7.5;

  const hic31MV = tags['HIC31']?.mv ?? 0.0;
  const isHic31Open = hic31MV > 0;
  const pic7bMV = tags['PIC7B']?.mv ?? 0.0;
  const isPic7bOpen = pic7bMV > 0 || columnPressure > 6.10;

  const handleToggleHic31 = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) return;
    const nextMV = isHic31Open ? 0 : 100;
    setControllerMode('HIC31', 'MAN');
    setControllerMV('HIC31', nextMV);
  };

  /* ── Buttons definition for bottom bar ── */
  const buttons: DcsButtonDef[] = [
    {
      label: 'CG0128',
      x: 60,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0128',
        tags: ['PIC7', 'PIC7B', 'TIC6', 'LIC11', 'FI16', 'FIC15', 'FIC96', 'AI26'],
        title: '3C-8 TEMPERATURE PROFILE & PRESSURE'
      })
    },
    {
      label: 'CG0129',
      x: 160,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0129',
        tags: ['TIC6', 'TI184', 'TI182', 'LIC11', 'FIC15', 'FIC96', 'HIC31', '3C-8_DP'],
        title: '3E-8 REBOILER & 3C-8 SUMP'
      })
    },
    {
      label: 'CG0130',
      x: 260,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0130',
        tags: ['PIC7', 'PIC7B', 'PDIC8', 'TR310', 'LIC12', 'TI180', 'HIC31', 'PI35'],
        title: '3E-9 CONDENSER & 3C-9 DRUM'
      })
    },
    {
      label: 'CG0131',
      x: 360,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0131',
        tags: ['PI35', 'FIC15', 'FIC96', 'FI16', 'TI9', '3G-7A', '3G-7B', '3G-11A'],
        title: '3G-7 & 3G-11 PUMP OPERATIONS'
      })
    },
    {
      label: 'CG0132',
      x: 460,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0132',
        tags: ['AI24_C3', 'AI24_IC4', 'AI24_NC4', 'AI24_IC5', 'AI24_NC5', 'AI26', 'PAL157', 'UA006'],
        title: 'AI24 & AI26 GASOLINE QUALITY'
      })
    },
    {
      label: 'CG0133',
      x: 560,
      width: 90,
      onClick: () => setActiveCG({
        id: 'CG0133',
        tags: ['FIC15', 'LIC12', 'FIC92', 'FIC10', 'FIC34', 'TIC6', 'PIC7', 'FI16'],
        title: '3C-8 TOTAL RUNOUT CONTROL'
      })
    },
    {
      label: 'TG0114',
      x: 690,
      width: 80,
      onClick: () => useDCSStore.getState().setActiveScreen('TREND')
    },
    {
      label: 'TG0115',
      x: 780,
      width: 80,
      onClick: () => useDCSStore.getState().setActiveScreen('TREND')
    }
  ];

  /* ── Column & Drum coordinates ── */
  const colX = 280;
  const colY = 130;
  const colW = 60;
  const colH = 265;

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
            DE - BUTANIZER COLUMN
          </text>

          {/* ═══════════════════════════════════════════════════════════════
              1. FEED LINES & DRAIN RECYCLE
              ═══════════════════════════════════════════════════════════════ */}
          {/* Feed from 3C-6 BTM (cyan) */}
          <text x="145" y="198" fill={C.cyan} fontSize="9" fontFamily={C.font} fontWeight="bold">
            3C-6
          </text>
          <text x="145" y="210" fill={C.cyan} fontSize="9" fontFamily={C.font} fontWeight="bold">
            BTM
          </text>
          <line x1="175" y1="205" x2={colX} y2="205" stroke={C.cyan} strokeWidth="1.6" />
          <polygon points="270,205 264,202 264,208" fill={C.cyan} />

          {/* Drain Header line with FIC96 (grey/white) */}
          <text x="145" y="248" fill={C.white} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            DRAIN
          </text>
          <text x="145" y="258" fill={C.white} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            HDR
          </text>
          <line x1="280" y1="250" x2="185" y2="250" stroke={C.white} strokeWidth="1.4" />
          <polygon points="185,250 191,247 191,253" fill={C.white} />
          <DcsControlValve x={235} y={250} color={C.white} scale={0.85} />
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="FIC96"
            x={220}
            y={278}
            label="FIC96"
            unit="M3/H"
            decimals={2}
            tagState={tags['FIC96']}
            onOpenFaceplate={openFaceplate}
          />

          {/* Reflux return line from 3G-7 into top of 3C-8 */}
          <line x1={colX} y1={170} x2={195} y2={170} stroke={C.magenta} strokeWidth="1.6" />
          <line x1={195} y1={170} x2={195} y2={325} stroke={C.magenta} strokeWidth="1.6" />
          <polygon points="275,170 269,167 269,173" fill={C.magenta} />
          <DcsControlValve x={235} y={170} color={C.magenta} scale={0.85} />
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="FIC15"
            x={220}
            y={125}
            label="FIC15"
            unit="M3/H"
            decimals={1}
            tagState={tags['FIC15']}
            onOpenFaceplate={openFaceplate}
          />

          {/* ═══════════════════════════════════════════════════════════════
              2. 3C-8 FRACTIONATION COLUMN
              ═══════════════════════════════════════════════════════════════ */}
          <DcsVerticalColumn
            x={colX}
            y={colY}
            width={colW}
            height={colH}
            tag="3C-8"
            sumpLevelPercent={sumpLevel}
          />

          {/* Left Column Profile & Reboiler Control Tags */}
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="TIC6"
            x={185}
            y={225}
            label="TIC6"
            unit="°C"
            decimals={1}
            tagState={tags['TIC6']}
            onOpenFaceplate={openFaceplate}
          />
          <line x1="205" y1="245" x2="205" y2="330" stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="205" y1="330" x2="165" y2="330" stroke={C.signal} strokeWidth="1" strokeDasharray="3 3" />

          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="TI184"
            x={210}
            y={305}
            label="TI184"
            unit="°C"
            decimals={1}
            tagState={tags['TI184']}
            onOpenFaceplate={openFaceplate}
          />
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="TI182"
            x={395}
            y={425}
            label="TI182"
            unit="°C"
            decimals={1}
            tagState={tags['TI182']}
            onOpenFaceplate={openFaceplate}
          />
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="LIC11"
            x={385}
            y={305}
            label="LIC11"
            unit="%"
            decimals={1}
            tagState={tags['LIC11']}
            onOpenFaceplate={openFaceplate}
          />

          {/* ═══════════════════════════════════════════════════════════════
              3. 3E-8 REBOILER LOOP & SUMP PIPING
              ═══════════════════════════════════════════════════════════════ */}
          <DcsKettleReboiler x={135} y={350} width={80} height={35} tag="3E-8" />

          {/* LP Steam Line with Control Valve */}
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

          {/* Bottom liquid into 3E-8 */}
          <line x1={310} y1={colY + colH} x2={310} y2="400" stroke={C.cyan} strokeWidth="1.6" />
          <line x1={310} y1="400" x2="200" y2="400" stroke={C.cyan} strokeWidth="1.6" />
          <line x1="200" y1="400" x2="200" y2="385" stroke={C.cyan} strokeWidth="1.6" />

          {/* Vapor return from 3E-8 into column */}
          <line x1={215} y1={355} x2={260} y2={355} stroke={C.cyan} strokeWidth="1.6" />
          <line x1={260} y1={355} x2={260} y2={285} stroke={C.cyan} strokeWidth="1.6" />
          <line x1={260} y1={285} x2={colX} y2={285} stroke={C.cyan} strokeWidth="1.6" />

          {/* Bottoms liquid draw out to 3G-11A/B */}
          <line x1={310} y1="400" x2={500} y2="400" stroke={C.cyan} strokeWidth="1.6" />

          {/* ═══════════════════════════════════════════════════════════════
              4. AI24 GASOLINE QUALITY ANALYZER BLOCK (Right of 3C-8)
              ═══════════════════════════════════════════════════════════════ */}
          <g transform="translate(355, 205)" fontFamily={C.font} fontWeight="bold">
            <text x="0" y="0" fill={C.red} fontSize="8.5">
              UA002
            </text>
            <text x="0" y="14" fill={C.cyan} fontSize="9">
              AI24
            </text>
            {[
              { label: 'C3', val: measured('AI24A', 0.00), dec: 2 },
              { label: 'iC4', val: measured('AI24B', 0.0), dec: 1 },
              { label: 'nC4', val: measured('AI24C', 0.0), dec: 1 },
              { label: 'iC5', val: measured('AI24D', 0.0), dec: 1 },
              { label: 'nC5', val: measured('AI24E', 0.00), dec: 2 },
            ].map((row, idx) => (
              <React.Fragment key={row.label}>
                <text x="25" y={14 + idx * 12} fill={C.cyan} fontSize="8.5">
                  {row.label}
                </text>
                <text x="55" y={14 + idx * 12} fill={C.white} fontSize="9">
                  {row.val.toFixed(row.dec)}
                </text>
                <text x="85" y={14 + idx * 12} fill={C.cyan} fontSize="8">
                  %
                </text>
              </React.Fragment>
            ))}
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              5. OVERHEAD SYSTEM: 3E-9 CONDENSER, 3C-9 DRUM, 3G-7 PUMPS
              ═══════════════════════════════════════════════════════════════ */}
          {/* Overhead vapor from top dome of 3C-8 */}
          <line x1={310} y1={colY} x2={310} y2="90" stroke={C.magenta} strokeWidth="1.6" />
          <line x1={310} y1="90" x2={710} y2="90" stroke={C.magenta} strokeWidth="1.6" />

          {/* Draw to 3E-13 */}
          <line x1={360} y1="90" x2={360} y2="125" stroke={C.magenta} strokeWidth="1.4" />
          <line x1={360} y1="125" x2={410} y2="125" stroke={C.magenta} strokeWidth="1.4" />
          <polygon points="410,125 404,122 404,128" fill={C.magenta} />
          <text x="415" y="128" fill={C.magenta} fontSize="9" fontFamily={C.font} fontWeight="bold">
            3E-13
          </text>
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="TI183"
            x={395}
            y={105}
            label="TI183"
            unit="°C"
            decimals={1}
            tagState={tags['TI183']}
            onOpenFaceplate={openFaceplate}
          />

          {/* PDIC8 Differential Pressure */}
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="PDIC8"
            x={475}
            y={120}
            label="PDIC8"
            unit="KGC2"
            decimals={3}
            tagState={tags['PDIC8']}
            onOpenFaceplate={openFaceplate}
          />

          {/* PI35 Dual Transmitters (A & B) */}
          <g transform="translate(470, 165)" fontFamily={C.font} fontWeight="bold">
            <text x="0" y="0" fill={C.cyan} fontSize="9">
              PI35
            </text>
            <text x="0" y="12" fill={C.cyan} fontSize="8.5">
              A
            </text>
            <text x="25" y="12" fill={C.white} fontSize="9">
              {measured('PI35A', measured('PI35', 0.0)).toFixed(2)}
            </text>
            <text x="55" y="12" fill={C.cyan} fontSize="7.5">
              KGC2G
            </text>

            <text x="0" y="24" fill={C.cyan} fontSize="8.5">
              B
            </text>
            <text x="25" y="24" fill={C.white} fontSize="9">
              {measured('PI35', 0.0).toFixed(2)}
            </text>
            <text x="55" y="24" fill={C.cyan} fontSize="7.5">
              KGC2G
            </text>
          </g>

          {/* PIC7A/B Pressure Control */}
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="PIC7"
            x={570}
            y={120}
            label="PIC7A/B"
            unit="KGC2"
            decimals={2}
            tagState={tags['PIC7']}
            onOpenFaceplate={openFaceplate}
          />
          {/* Split range bypass to drum */}
          <line x1={520} y1="90" x2={520} y2="150" stroke={C.magenta} strokeWidth="1.5" />
          <DcsBlockValve x={520} y={135} color={C.magenta} rotation={90} scale={0.85} />
          <line x1={520} y1="150" x2={580} y2="150" stroke={C.magenta} strokeWidth="1.5" />
          <line x1={580} y1="150" x2={580} y2={drumY} stroke={C.magenta} strokeWidth="1.5" />
          <polygon points="580,195 577,189 583,189" fill={C.magenta} />

          {/* 3E-9 CW Overhead Condenser */}
          <DcsShellTubeExchanger x={710} y={75} width={105} height={32} tag="3E-9" />
          {/* CW Cooling Water */}
          <line x1={785} y1="107" x2={785} y2="130" stroke={C.green} strokeWidth="1.2" />
          <line x1={785} y1="130" x2={810} y2="130" stroke={C.green} strokeWidth="1.2" />
          <polygon points="810,130 804,127 804,133" fill={C.green} />
          <text x="815" y="133" fill={C.green} fontSize="8" fontFamily={C.font} fontWeight="bold">
            CW
          </text>
          {/* TR310 Cooling Water Return Temperature */}
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="TR310"
            x={760}
            y={120}
            label="TR310"
            unit="°C"
            decimals={2}
            tagState={tags['TR310']}
            onOpenFaceplate={openFaceplate}
          />

          {/* Condensate drain to 3C-9 drum with Valve A */}
          <line x1={720} y1="107" x2={720} y2="175" stroke={C.magenta} strokeWidth="1.5" />
          <line x1={720} y1="175" x2={680} y2="175" stroke={C.magenta} strokeWidth="1.5" />
          <line x1={680} y1="175" x2={680} y2={drumY} stroke={C.magenta} strokeWidth="1.5" />
          <polygon points="680,195 677,189 683,189" fill={C.magenta} />
          <DcsBlockValve x={680} y={160} color={C.magenta} rotation={90} scale={0.8} />
          <text x="668" y="152" fill={C.cyan} fontSize="8" fontFamily={C.font}>
            A
          </text>

          {/* 3C-9 Reflux Drum */}
          <DcsHorizontalDrum
            x={drumX}
            y={drumY}
            width={drumW}
            height={drumH}
            tag="3C-9"
            levelPercent={drumLevel}
            levelColor={C.magenta}
          />
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="LIC12"
            x={760}
            y={225}
            label="LIC12"
            unit="%"
            decimals={1}
            tagState={tags['LIC12']}
            onOpenFaceplate={openFaceplate}
          />

          {/* Vent line to FG with Valve B */}
          <line x1={615} y1={drumY} x2={615} y2="140" stroke={C.white} strokeWidth="1.2" />
          <polygon points="615,140 612,146 618,146" fill={C.white} />
          <text x="608" y="132" fill={C.white} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            FG
          </text>
          <g onClick={(e) => { e.stopPropagation(); openFaceplate('PIC7B'); }}>
            <DcsBlockValve x={615} y={170} color={isPic7bOpen ? '#10b981' : C.white} rotation={90} scale={0.85} />
          </g>
          <text x="602" y="165" fill={C.cyan} fontSize="8" fontFamily={C.font}>
            B
          </text>

          {/* HIC31 Drain to B/PIT */}
          <line x1={645} y1={drumY + drumH} x2={645} y2={290} stroke={C.white} strokeWidth="1.4" />
          <g transform="translate(645, 275)" className="cursor-pointer" onClick={handleToggleHic31}>
            <DcsBlockValve x={0} y={0} color={isHic31Open ? '#10b981' : C.white} scale={0.85} />
          </g>
          <text x="625" y="305" fill={C.white} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            B/PIT
          </text>
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="HIC31"
            x={690}
            y={290}
            label="HIC31"
            unit="%"
            decimals={1}
            color={isHic31Open ? '#10b981' : C.cyan}
            tagState={tags['HIC31']}
            onOpenFaceplate={openFaceplate}
          />
          <text x="680" y="260" fill={C.cyan} fontSize="8" fontFamily={C.font} fontWeight="bold">
            FIC10/34/92
          </text>

          {/* Reflux Pumps 3G-7A and 3G-7B */}
          <line x1={drumX + drumW * 0.45} y1={drumY + drumH} x2={drumX + drumW * 0.45} y2={270} stroke={C.magenta} strokeWidth="1.5" />
          <line x1={drumX + drumW * 0.45} y1={215} x2={600} y2={215} stroke={C.magenta} strokeWidth="1.5" />
          <line x1={drumX + drumW * 0.45} y1={270} x2={600} y2={270} stroke={C.magenta} strokeWidth="1.5" />

          <DcsPump
            screenId="DE_BUTANIZER"
            pumpId="3G-7A"
            x={600}
            y={205}
            label="3G-7A"
            isRunning={pumps['3G-7A']?.running}
            isTripped={pumps['3G-7A']?.tripped}
            amps={pumps['3G-7A']?.amps}
            onOpenPumpPopup={openPumpPopup}
          />
          <DcsPump
            screenId="DE_BUTANIZER"
            pumpId="3G-7B"
            x={600}
            y={260}
            label="3G-7B"
            isRunning={pumps['3G-7B']?.running}
            isTripped={pumps['3G-7B']?.tripped}
            amps={pumps['3G-7B']?.amps}
            onOpenPumpPopup={openPumpPopup}
          />
          <text x="590" y="295" fill={C.yellow} fontSize="8.5" fontFamily={C.font} fontWeight="bold">
            AUTO
          </text>
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="TI180"
            x={645}
            y={245}
            label="TI180"
            unit="°C"
            decimals={1}
            tagState={tags['TI180']}
            onOpenFaceplate={openFaceplate}
          />

          {/* 3G-7 Discharge combined reflux line */}
          <line x1={560} y1={215} x2={560} y2={325} stroke={C.magenta} strokeWidth="1.5" />
          <line x1={560} y1={270} x2={560} y2={325} stroke={C.magenta} strokeWidth="1.5" />
          <line x1={560} y1={325} x2={195} y2={325} stroke={C.magenta} strokeWidth="1.5" />

          {/* ═══════════════════════════════════════════════════════════════
              6. BOTTOM GASOLINE SECTION: 3G-11A/B, 3E-10 COOLER, RUNOUT
              ═══════════════════════════════════════════════════════════════ */}
          {/* Suction to 3G-11A and 3G-11B */}
          <line x1={500} y1={400} x2={500} y2={365} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={500} y1={365} x2={515} y2={365} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={500} y1={400} x2={500} y2={435} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={500} y1={435} x2={515} y2={435} stroke={C.cyan} strokeWidth="1.5" />

          <DcsPump
            screenId="DE_BUTANIZER"
            pumpId="3G-11A"
            x={515}
            y={355}
            label="3G-11A"
            isRunning={pumps['3G-11A']?.running}
            isTripped={pumps['3G-11A']?.tripped}
            amps={pumps['3G-11A']?.amps}
            onOpenPumpPopup={openPumpPopup}
          />
          <DcsPump
            screenId="DE_BUTANIZER"
            pumpId="3G-11B"
            x={515}
            y={425}
            label="3G-11B"
            isRunning={pumps['3G-11B']?.running}
            isTripped={pumps['3G-11B']?.tripped}
            amps={pumps['3G-11B']?.amps}
            onOpenPumpPopup={openPumpPopup}
          />

          {/* Discharge header into 3E-10 Cooler */}
          <line x1={470} y1={365} x2={450} y2={365} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={470} y1={435} x2={450} y2={435} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={450} y1={365} x2={450} y2={400} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={450} y1={400} x2={450} y2={340} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={450} y1={340} x2={600} y2={340} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={600} y1={340} x2={600} y2={365} stroke={C.cyan} strokeWidth="1.5" />

          {/* 3E-10 Bottom Product Cooler */}
          <DcsShellTubeExchanger x={570} y={365} width={105} height={32} tag="3E-10" />
          <line x1={645} y1={397} x2={645} y2={420} stroke={C.magenta} strokeWidth="1.2" />
          <line x1={645} y1={420} x2={670} y2={420} stroke={C.magenta} strokeWidth="1.2" />
          <polygon points="670,420 664,417 664,423" fill={C.magenta} />
          <text x="675" y="423" fill={C.magenta} fontSize="8" fontFamily={C.font} fontWeight="bold">
            CW
          </text>

          {/* Product line leaving 3E-10 */}
          <line x1={570} y1={385} x2={540} y2={385} stroke={C.cyan} strokeWidth="1.6" />
          <line x1={540} y1={385} x2={540} y2={445} stroke={C.cyan} strokeWidth="1.6" />
          <line x1={540} y1={445} x2={830} y2={445} stroke={C.cyan} strokeWidth="1.6" />
          <polygon points="830,445 824,442 824,448" fill={C.cyan} />
          <text x="835" y="448" fill={C.cyan} fontSize="9" fontFamily={C.font} fontWeight="bold">
            20D-4
          </text>

          {/* Runout branch to PLT16 */}
          <line x1={720} y1={445} x2={720} y2={475} stroke={C.cyan} strokeWidth="1.4" />
          <line x1={720} y1={475} x2={830} y2={475} stroke={C.cyan} strokeWidth="1.4" />
          <polygon points="830,475 824,472 824,478" fill={C.cyan} />
          <text x="835" y="478" fill={C.cyan} fontSize="9" fontFamily={C.font} fontWeight="bold">
            PLT16
          </text>

          {/* Control Valve & Instruments on Product Line */}
          <DcsControlValve x={630} y={445} color={C.cyan} scale={0.9} />
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="FI16"
            x={570}
            y={465}
            label="FI16"
            unit="M3/H"
            decimals={2}
            tagState={tags['FI16']}
            onOpenFaceplate={openFaceplate}
          />
          <DcsTag
            screenId="DE_BUTANIZER"
            tagId="TI9"
            x={645}
            y={465}
            label="TI9"
            unit="°C"
            decimals={1}
            tagState={tags['TI9']}
            onOpenFaceplate={openFaceplate}
          />

          {/* AI26 RVP Analyzer */}
          <g transform="translate(710, 415)" fontFamily={C.font} fontWeight="bold">
            <text x="0" y="0" fill={C.cyan} fontSize="8.5">
              AI26
            </text>
            <text x="0" y="12" fill={C.white} fontSize="9">
              {measured('AI26', 0.000).toFixed(3)}
            </text>
            <text x="35" y="12" fill={C.cyan} fontSize="7.5">
              KGC2A
            </text>
            <text x="75" y="0" fill={C.red} fontSize="8">
              LAHH26
            </text>
            <text x="75" y="12" fill={C.red} fontSize="8">
              LALL33
            </text>
          </g>

          {/* PAL157 & Interlocks */}
          <g transform="translate(745, 455)" fontFamily={C.font} fontWeight="bold">
            <text x="0" y="0" fill={C.yellow} fontSize="8">
              PAL157
            </text>
            <text x="0" y="10" fill={C.red} fontSize="8">
              UA006
            </text>
            <text x="0" y="22" fill={C.green} fontSize="8">
              XL325 STOP
            </text>
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
          <ProcessLineDrawer screenId="DE_BUTANIZER" />

          {/* ═══════════════════════════════════════════════════════════════
              7. BOTTOM NAVIGATION BAR (Yokogawa 3D Bevelled Pushbuttons)
              ═══════════════════════════════════════════════════════════════ */}
          <DcsButtonBar buttons={buttons} />
        </svg>
      </div>

      {/* Floating Layout Editor Toolbar */}
      <LayoutEditorToolbar screenId="DE_BUTANIZER" />

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
