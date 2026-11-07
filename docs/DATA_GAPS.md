# Plant-3 Fractionation Unit OTS - Data Gaps & Assumptions Register

> **Document Status:** Educational Training Specification  
> **Purpose:** Explicitly log all unverified, estimated, or missing plant data requiring authorized documentation (P&IDs, Cause & Effect matrices, loop sheets, operating manuals).

---

## 1. Process & Operating Data Gaps

| Item / Parameter | Modeled Unit(s) | Current Training / Engineering Assumption | Required Plant Source | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Feed Composition & Flow Ranges** | 3C-1 Scrub, 3C-4 De-Ethanizer | Baseline NG feed ~280–321 kNm³/h with heavy hydrocarbon distribution ($C_1$ to $C_5^+$). Composition percentages set from DCS screenshot indicators. | Plant Material Balance / Daily Production Log | High |
| **Column Pressure Control Strategy** | 3C-4, 3C-6, 3C-8 | Modeled as overhead vapor condensation rate vs boil-up equilibrium; PIC controls coolant/refrigerant trim or vapor bypass. | Control Loop Narrative / P&ID | High |
| **Tray/Packing Geometries & Holdups** | 3C-1, 3C-4, 3C-6, 3C-8 | Lumped dynamic stages with first-order mixing lag and hydraulic loading curves ($\tau_{tray} \approx 3–8\,\text{s}$). | Vessel Equipment Data Sheets | Medium |
| **Flooding & $\Delta P$ Limits** | 3C-4, 3C-6, 3C-8 | $\Delta P$ baseline ~1.5–1.6 $\text{kg/cm}^2$; exponential pressure drop and efficiency collapse above 120% nominal vapor loading. | Distillation Column Operating Manual | Medium |
| **Product Specifications** | Overhead/Bottom Streams | Separation proxies ($C_2/C_3$, $C_3/C_4$, $C_4/C_5+$) tuned for visual consistency with screenshot AI analyzers ($AI23, AI21, AI24$). | Quality Control Specs | Medium |

---

## 2. Safety Instrumented Systems (SIS) & Interlocks

> [!CAUTION]
> **SAFETY CRITICAL NOTICE**
> The current system implements generic protection training placeholders only. **DO NOT USE FOR ACTUAL OPERATING OR SAFETY PURPOSES.**

| Interlock / Trip Logic | Equipment | Modeled Behavior | Required Verification Document |
| :--- | :--- | :--- | :--- |
| **Reflux Pump Suction Trip (LALL)** | 3G-1, 3G-2, 3G-6, 3G-7 | Trips pump when drum level drops below 5% for >3 seconds (dry run protection). | Cause & Effect (C&E) Matrix / ESD Logic Diagrams |
| **Reboiler Steam Cutoff on High Level (LAHH)** | 3E-1, 3E-4, 3E-6, 3E-8 | Closes steam valve on column high-high level (>90%) to prevent liquid carryover. | Plant Shutdown Logic / Interlock Description |
| **Column Overpressure Vent / ESD** | 3C-4, 3C-6, 3C-8 | High-high pressure warning and generic simulation trip marker. | Relief & Flare System Design Basis / C&E Matrix |
| **Pump Auto-Start Permissives** | Standby Pumps (3G-1B, 3G-2B, etc.) | Requires suction valve open, minimum suction head, and power available. | Motor Control Center (MCC) & Permissive Standard |

---

## 3. Controller Tuning & Alarm Limits

| Tag ID | Parameter | Modeled Value | Assumption Label | Required Source |
| :--- | :--- | :--- | :--- | :--- |
| **PIC3** | 3C-4 Pressure Controller | SP = 30.00 $\text{kg/cm}^2$, $K_p = 1.8$, $T_i = 35\,\text{s}$ | Engineering Estimate | DCS Tuning Database |
| **TIC3** | 3C-4 Temperature Controller | SP = 105.4 °C, $K_p = 1.2$, $T_i = 80\,\text{s}$ | Engineering Estimate | DCS Tuning Database |
| **LIC4** | 3C-5 Drum Level Controller | SP = 34.5%, $K_p = 2.0$, $T_i = 120\,\text{s}$ | Engineering Estimate | DCS Tuning Database |
| **LIC5** | 3C-4 Sump Level Controller | SP = 50.4%, $K_p = 2.2$, $T_i = 90\,\text{s}$ | Engineering Estimate | DCS Tuning Database |
| **FIC6** | 3C-4 Reflux Flow Controller | SP = 28.25 $\text{m}^3/\text{h}$, $K_p = 0.8$, $T_i = 10\,\text{s}$ | Engineering Estimate | DCS Tuning Database |
| **PIC5A/B** | 3C-6 Pressure Controller | SP = 16.10 $\text{kg/cm}^2$, $K_p = 1.5$, $T_i = 40\,\text{s}$ | Engineering Estimate | DCS Tuning Database |
| **PIC7A/B** | 3C-8 Pressure Controller | SP = 6.01 $\text{kg/cm}^2$, $K_p = 1.4$, $T_i = 45\,\text{s}$ | Engineering Estimate | DCS Tuning Database |

---

## 4. Source Registration Protocol
Whenever an authorized engineering document (P&ID, C&E, operating procedure) is provided:
1. Register the document in `docs/SOURCE_REGISTER.md`.
2. Update the corresponding tag/logic configuration in `src/data/`.
3. Remove the `assumed: true` flag in the configuration files.
4. Update regression tests to validate the newly calibrated behavior.
