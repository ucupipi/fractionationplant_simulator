# Plant-3 Fractionation Unit OTS - System Architecture

## 1. High-Level Architecture

The simulator separates **simulation truth** from **presentation / HMI**. The UI does not calculate the process state; it merely subscribes to the tag bus and issues operator commands (SP changes, mode switches, valve output adjustments, pump commands).

```
┌─────────────────────────────────────────────────────────────┐
│                    INSTRUCTOR STATION                       │
│  Fault Injection • Severity • Ramp • Snapshot Load/Save     │
└──────────────────────────────┬──────────────────────────────┘
                               │ (fault config & commands)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      SCENARIO ENGINE                        │
│   Modifies physical equipment parameters (UA, Head, Cv)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               DYNAMIC PROCESS ENGINE (Web Worker)           │
│  ReducedOrderFractionationModel (Mass/Energy/VLE/Hydraulics) │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               │ (process truth)               │ (valve/pump commands)
               ▼                               │
┌──────────────────────────────┐ ┌─────────────┴──────────────┐
│       INSTRUMENTATION        │ │       CONTROL & SIS        │
│   trueValue vs measuredValue │ │  PID Loops • Anti-Windup   │
│   (bias, lag, noise, freeze) │ │  Permissives • Interlocks  │
└──────────────┬───────────────┘ └─────────────▲──────────────┘
               │                               │
               │ (measuredValue)               │ (operator actions)
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                    TAG & STATE BUS (Zustand)                │
│    PV • SP • MV • Mode • Alarms • Equipment State • Quality  │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                     DCS / HMI WORKSPACE                     │
│  Level 1 Overview • Level 2 Units (SVG) • Level 3 Faceplates│
│  Level 4 Real-time Trends • Alarm Banner & Summary (ISA 18) │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Process Modeling Engine (`ReducedOrderFractionationModel`)

The simulation runs in a dedicated **Web Worker** with fixed-step numerical ODE integration ($\Delta t = 100–250\,\text{ms}$) publishing updates to the UI at $250–500\,\text{ms}$.

### Key Governing Equations:
1. **Material Balances**:
   - Column Sump Holdup: $\frac{dM_B}{dt} = L_{tray,bottom} - F_B$
   - Reflux Accumulator Holdup: $\frac{dM_D}{dt} = V_{condensed} - (L_{reflux} + D_{distillate})$
2. **Energy Balances & Temperature Calculations**:
   - Reboiler heat input: $Q_{reb} = \dot{m}_{steam} \cdot \Delta H_{steam} \cdot \eta_{reb}$
   - Condenser cooling duty: $Q_{cond} = UA_{cond} \cdot (T_{top} - T_{coolant}) \cdot \text{Availability}_{coolant}$
   - Lumped energy state determines stage temperatures ($T_{top}, T_{feed}, T_{bottom}$).
3. **Column Pressure Dynamics**:
   - $\frac{dP_{top}}{dt} = K_{vap} \cdot (V_{boilup} - V_{condensed} - V_{vapor\_out})$
4. **Hydrodynamics & Flooding**:
   - $\Delta P = \Delta P_0 + k_L L^2 + k_V V^2$
   - If vapor traffic exceeds flooding limit, $\Delta P$ spikes exponentially and separation efficiency drops sharply.
5. **Two-Value Instrumentation**:
   - Every transmitter maintains `trueValue` (physics) and `measuredValue` (sensor output seen by PID controller and HMI). Sensor faults (bias, drift, freeze, calibration offset) modify `measuredValue` only.

---

## 3. DCS / HMI Display Hierarchy (ANSI/ISA-101)

- **Level 1: Plant-3 Overview**:
  - Global flowsheet showing Scrub $\rightarrow$ De-Ethanizer $\rightarrow$ De-Propanizer $\rightarrow$ De-Butanizer + Refrigeration.
  - Sparklines (5–10 min) for critical variables.
  - Unit health status tiles and global alarm banner.
- **Level 2: Unit Screens (Interactive SVG)**:
  - 1:1 graphical match to legacy Yokogawa CENTUM screens.
  - Color styling toggle: **Legacy CENTUM View** (high-contrast dark canvas) vs **High Performance ISA-101 View** (subdued grayscale background with salient alarm highlights).
  - Clickable hit targets on every valve, pump, controller tag, and transmitter.
- **Level 3: Faceplates & Popups**:
  - **PID Controller**: PV/SP/MV, MAN/AUTO/CAS, Output Limits, Tuning parameters, direct trend link.
  - **Pump Popup**: Run/Stop/Trip status, Permissive checks, Suction/Discharge indicators.
  - **Valve Popup**: Commanded vs Actual Position, Stiction & Override controls.
  - **Transmitter Diagnostic**: True vs Measured comparison (Instructor/Diagnostic mode).
- **Level 4: Diagnostics, Trends & Logs**:
  - Real-time multi-pen trend viewer (10 min / 1 hr / session windows).
  - ISA-18.2 Alarm Summary and Sequence of Events (SOE) log.
  - Scenario evaluation debrief and scoring timeline.

---

## 4. Basic Process Control (BPCS) vs Safety Instrumented System (SIS)

In accordance with IEC 61511 and educational best practices:
- **BPCS**: Standard PID loops and regulatory controls.
- **SIS / Protection-Training**: Segregated in `simulation/protection-training/`. All logic without official C&E source is flagged `assumed: true` in the data files and rendered with a "Training Assumption" indicator.
