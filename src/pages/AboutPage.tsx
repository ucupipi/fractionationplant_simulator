import React from 'react';
import { ShieldCheck, BookOpen, AlertTriangle, Cpu, Layers } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="h-full w-full p-6 bg-[#080d16] text-gray-300 font-mono text-xs overflow-y-auto select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Title */}
        <div className="border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Layers size={22} />
            <h1 className="text-lg font-bold text-white tracking-wider">
              PLANT-3 FRACTIONATION TRAIN OPERATOR TRAINING SIMULATOR (OTS)
            </h1>
          </div>
          <p className="text-gray-400 text-xs">
            Interactive, Browser-Based Educational DCS & Dynamic Process Simulation Environment
          </p>
        </div>

        {/* Prominent Educational Disclaimer */}
        <div className="bg-amber-950/40 border border-amber-500/80 rounded-lg p-4 text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <AlertTriangle size={18} />
            <span>EDUCATIONAL SIMULATION NOTICE & DISCLAIMER</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            This software is an <strong>educational engineering simulation</strong> designed to teach distillation dynamics,
            abnormal condition diagnosis, and industrial DCS operating procedures. While modeled closely after the
            visual layout and nomenclature of industrial Plant-3 Yokogawa CENTUM CS3000 / VP operating screens,
            it is <strong>an educational prototype and NOT affiliated with or an official product of any operating facility or Yokogawa Electric Corporation</strong>.
          </p>
          <p className="text-[10px] text-amber-300/80">
            Unpublished setpoints, proprietary vendor C&E logic, and internal ESD matrices have been modeled using
            standard first-principles distillation engineering assumptions for academic and training purposes.
          </p>
        </div>

        {/* Process Units Overview */}
        <div className="bg-[#0c121e] border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="font-bold text-cyan-400 text-sm flex items-center gap-2">
            <BookOpen size={16} />
            <span>PLANT-3 FRACTIONATION TRAIN ARCHITECTURE</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[11px]">
            <div className="bg-[#080d16] p-3 rounded border border-gray-800">
              <span className="font-bold text-cyan-300 block mb-1">1. 3C-1 Scrub Column</span>
              <p className="text-gray-400">
                Pre-fractionation tower receiving natural gas feed at ~33 kg/cm²G. Separates heavy hydrocarbon condensates
                from overhead natural gas before liquefaction.
              </p>
            </div>
            <div className="bg-[#080d16] p-3 rounded border border-gray-800">
              <span className="font-bold text-cyan-300 block mb-1">2. 3C-4 De-Ethanizer</span>
              <p className="text-gray-400">
                Operates at ~30 kg/cm²G with chilled overhead partial condenser (3E-5). Separates ethane/fuel gas (overhead)
                from LPG and natural gasoline heavy components (bottoms).
              </p>
            </div>
            <div className="bg-[#080d16] p-3 rounded border border-gray-800">
              <span className="font-bold text-cyan-300 block mb-1">3. 3C-6 De-Propanizer</span>
              <p className="text-gray-400">
                Separates high-purity commercial Propane (C3) as overhead product with water-cooled condenser (3E-7)
                and low-pressure steam reboiler (3E-6).
              </p>
            </div>
            <div className="bg-[#080d16] p-3 rounded border border-gray-800">
              <span className="font-bold text-cyan-300 block mb-1">4. 3C-8 De-Butanizer</span>
              <p className="text-gray-400">
                Separates commercial Butane (C4 LPG) overhead and stabilizes C5+ Natural Gasoline bottoms sent to
                storage tank 20D-4.
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Capabilities */}
        <div className="bg-[#0c121e] border border-gray-800 rounded-lg p-4 space-y-2">
          <div className="font-bold text-emerald-400 text-sm flex items-center gap-2">
            <Cpu size={16} />
            <span>CORE SIMULATION & DCS FEATURES</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-gray-300 space-y-1">
            <li><strong>Two-Value Instrumentation:</strong> Decoupled True Physics state from HMI Measured value for realistic sensor drift and frozen transmitter simulation.</li>
            <li><strong>ISA-18.2 Alarm State Machine:</strong> Dynamic UNACK, ACK, and RTN states with chatter deadbands and alarm sequence logging.</li>
            <li><strong>Interactive DCS Popups:</strong> Yokogawa-style Level 3 PID Faceplates with bumpless MAN/AUTO transfer and Pump Control stations.</li>
            <li><strong>Full 20-Scenario Fault Library:</strong> Instructor Station for injecting equipment failures, utility losses, sensor biases, and column flooding.</li>
            <li><strong>Automated Trainee Assessment:</strong> Quantitative scoring engine measuring alarm reaction times, diagnosis latency, and action sequences.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
