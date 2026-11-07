# Plant-3 Fractionation Unit OTS - Validation & Verification Protocol

> **Document Status:** Verification suite and test execution record.

---

## 1. Automated Directional & Physics Test Matrix

The simulation model must pass all 10 non-negotiable verification gates implemented in `src/tests/`:

| Test ID | Test Name | Injected Action | Expected Directional Response | Pass Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **V01** | Condenser Capacity Loss | Reduce 3E-5 refrigeration UA by 50% | Column pressure $\frac{dP}{dt} > 0$ and top temperature increases | $P_{top}$ increases by $\ge 1.0\,\text{kg/cm}^2$ within 30s |
| **V02** | Reflux Pump Trip | Trip 3G-2A | Reflux flow drops instantly; top composition degrades gradually | $F_{reflux} \approx 0$ at $t=2\text{s}$; $C_2$ purity decay lagged |
| **V03** | Reboiler Heat Increase | Step increase reboiler steam by +20% | Column vapor traffic and $\Delta P$ increase | $\Delta P$ increases with second-order vapor response |
| **V04** | Feed Flow Step | Step increase feed flow by +20% | Column holdups and reboiler load increase | Sump & drum level accumulation rates $>0$ |
| **V05** | Transmitter Bias | Apply +3.0 bias to PIC3 | $measuredValue = trueValue + 3.0$; trueValue initial drift driven by controller response | Measured changes instantly; true changes only after controller movement |
| **V06** | Level Transmitter Frozen | Freeze LIC4 level sensor | Measured level constant; true level varies with material imbalance | $\frac{d(measured)}{dt} = 0$, $\frac{d(true)}{dt} \neq 0$ |
| **V07** | Alarm Acknowledgment | Acknowledge active alarm | Alarm state changes from `ACTIVE_UNACK` to `ACTIVE_ACK`; process state unaffected | Zero perturbation to process state vectors |
| **V08** | Deterministic Reset | Reset from upset state to baseline | All variables return to exact initial conditions | State vector equality within $\epsilon < 10^{-6}$ |
| **V09** | Repeatability | Run 60s scenario twice with same seed | Transients are identical point-for-point | Max relative error $< 0.001\%$ across all tags |
| **V10** | High-Speed Numerical Stability | Run 300s simulation at $5\times$ speed across S01–S20 | No `NaN`, `Infinity`, or numerical explosion | All states remain bounded in $[rangeMin, rangeMax]$ |

---

## 2. Browser & Visual Verification Checklist

- [ ] **Resolution 1366 × 768 (Laptop Control Display):**
  - Navigation bar, alarm banner, graphic canvas, and status footer fit without horizontal scrollbars.
  - All SVG tag labels, equipment IDs, and faceplate popups remain legible with no text overlapping.
- [ ] **Resolution 1920 × 1080 (FHD Control Room Display):**
  - Full widescreen presentation with crisp vector rendering.
  - Sparklines and trend multi-pen curves render smoothly at 60 FPS.
- [ ] **Navigation & Workspace Isolation:**
  - Trainee mode hides Instructor Station and diagnostic truth values.
  - Active scenario names are hidden from the trainee during live exercises.
- [ ] **Interactive Elements:**
  - Clicking any PID controller tag opens the Level 3 Faceplate popup.
  - Clicking any pump opens the Pump Control popup.
  - Mode switches (MAN / AUTO), SP changes, and MV sliders respond instantly.
- [ ] **Alarm Management:**
  - Unacknowledged alarms blink red/yellow in banner and graphic tags.
  - ACK button stops blinking and records acknowledgment timestamp.
  - Return-to-normal clears alarm only after the physical variable re-enters the normal operating band.
