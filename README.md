# Plant-3 Fractionation Unit Operator Training Simulator (OTS)

> **Educational Web-based Simulator** for LNG fractionation train operations, abnormal situation diagnosis, and closed-loop process control.

---

## 📌 Disclaimer & Safety Boundary
This software is an **educational and training prototype**. It is **NOT** an official Yokogawa system, nor is it affiliated with any commercial operating facility, and it is not safety-certified. All operating parameters, controller tunings, and alarm setpoints not explicitly validated against standard engineering documentation are designated as **"TRAINING / ENGINEERING ASSUMPTIONS"** and stored in editable configuration files.

---

## 🌟 Key Features
- **Yokogawa CENTUM CS3000 / VP Styling**: Dual visual mode (**Legacy CENTUM Dark Canvas** and **High Performance ISA-101 View**).
- **Physical Dynamic Simulation**: Deterministic mass/energy balance, column hydraulics ($\Delta P$), VLE separation proxies, and two-value instrumentation (`trueValue` vs `measuredValue`).
- **Web Worker Engine**: High-frequency numerical integration (100–250ms fixed-step) independent of UI rendering (60 FPS smooth graphics).
- **Full Plant-3 Train**:
  - Level 1: Plant-3 Overview with real-time sparklines and unit health indicators.
  - Level 2: Scrub Column (3C-1), De-Ethanizer (3C-4), De-Propanizer (3C-6), De-Butanizer (3C-8), and Refrigeration Support (3C-10 / 3E-12 / 3E-13).
  - Level 3: PID Controller Faceplates, Pump Control Popups, Valve Popups, and Transmitter Diagnostic Overlays.
  - Level 4: Real-time Multi-Pen Trend Viewers and ISA-18.2 Alarm Summaries.
- **Instructor Interference Station**: 20 Abnormal Situation Scenarios (S01–S20), severity sliders, ramp times, latent delays, freeze/run, simulation speed (0.5x, 1x, 2x, 5x), snapshot load/save, and automated scoring debrief.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node.js v22)
- Modern web browser (Chrome, Edge, Firefox)

### Installation
```bash
# Navigate to project directory
cd c:/laragon/www/ots

# Install dependencies
npm install
```

### Running the Simulator
```bash
# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Automated Tests
```bash
# Run physical validation and directional tests
npm run test
```

---

## 📁 Project Structure
- `src/data/`: Tag registry, equipment list, controller tuning, alarm limits, scenarios, and initial conditions.
- `src/simulation/`: Reusable classes for distillation columns, vessels, reboilers, condensers, pumps, control valves, PID controllers, and the alarm engine.
- `src/graphics/`: Interactive SVG process graphics for Plant-3 Overview and all five Level 2 unit screens.
- `src/components/`: DCS headers, alarm banners, faceplates, popups, trend viewers, and instructor consoles.
- `src/workers/`: Web Worker execution harness for the numerical simulation engine.
- `src/stores/`: Zustand stores for DCS UI state, simulation telemetry, and instructor controls.
- `docs/`: Technical architecture, data gaps register, scenario library, source references, and validation test reports.
