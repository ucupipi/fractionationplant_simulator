# Plant-3 Fractionation Unit OTS - Scenario Library (S01 - S20)

> **Document Status:** Training Scenarios & Cause-Effect Cascade Specifications.

---

## Scenario Catalog

### Category A: Equipment & Pump Faults

#### S01: 3G-1 Scrub Reflux Pump Trip
- **Unit / Equipment:** Scrub Column (3C-1) / 3G-1A Reflux Pump
- **Fault Type:** Instantaneous / Latched Trip ($Head \rightarrow 0$)
- **Physical Cascade:** Reflux flow $FIC3 \rightarrow 0$; 3C-2 drum level rises; 3C-1 overhead temperature rises; heavy component slip to overhead.
- **Expected Alarms:** $FAL3$ (Reflux Flow Low) $\rightarrow$ $TAH$ (Top Temp High) $\rightarrow$ $LAH3$ (Drum Level High).
- **Target Operator Response:** Confirm trip; start standby pump 3G-1B; verify discharge valve lineup; stabilize reflux flow; adjust reboiler heat if necessary.
- **Recovery Criteria:** Reflux flow restored to SP ($\pm 5\%$), column temperature profile stabilizes.

#### S02: 3G-2 De-Ethanizer Reflux Pump Trip
- **Unit / Equipment:** De-Ethanizer (3C-4) / 3G-2A Reflux Pump
- **Fault Type:** Instantaneous / Latched Trip ($Head \rightarrow 0$)
- **Physical Cascade:** 3C-4 reflux flow $FIC6 \rightarrow 0$; 3C-5 drum level accumulates; top temperature $TI171$ rises; $C_3^+$ slip to overhead fuel gas.
- **Expected Alarms:** $FAL6$ (Reflux Flow Low) $\rightarrow$ $TAH171$ $\rightarrow$ $LAH4$ (3C-5 Level High).
- **Target Operator Response:** Start standby 3G-2B; restore reflux flow; trim reboiler 3E-4 steam via TIC3/FIC11; trim feed if recovery is slow.
- **Recovery Criteria:** $FIC6$ stable, $TI171$ returns to normal window ($-30.8 \pm 2\,^\circ\text{C}$).

#### S03: 3G-6 De-Propanizer Reflux Pump Trip
- **Unit / Equipment:** De-Propanizer (3C-6) / 3G-6A Reflux Pump
- **Fault Type:** Trip ($Head \rightarrow 0$)
- **Physical Cascade:** Reflux flow $FIC12 \rightarrow 0$; 3C-7 drum level rises; top temperature $TI167$ rises; $C_4$ contamination in LPG $C_3$ product ($AI21$).
- **Expected Alarms:** $FAL12 \rightarrow TAH167 \rightarrow AI21\_QAL$.
- **Target Operator Response:** Start standby 3G-6B/C; restore reflux; reduce reboiler 3E-6 steam; protect C3 purity.
- **Recovery Criteria:** Reflux flow restored, $AI21$ C3 purity $>98\%$.

#### S04: 3G-7 De-Butanizer Reflux Pump Trip
- **Unit / Equipment:** De-Butanizer (3C-8) / 3G-7A Reflux Pump
- **Fault Type:** Trip ($Head \rightarrow 0$)
- **Physical Cascade:** Reflux flow $FIC15 \rightarrow 0$; 3C-9 level increases; top temperature $TI183$ rises; $C_5+$ carryover into $C_4$ overhead.
- **Expected Alarms:** $FAL15 \rightarrow TAH183 \rightarrow LAH12$.
- **Target Operator Response:** Start standby 3G-7B; recover reflux; monitor column overhead purity.
- **Recovery Criteria:** Reflux flow restored, top temperature stabilizes at $59.4 \pm 2\,^\circ\text{C}$.

#### S05: 3G-11 De-Butanizer Bottom Pump Trip
- **Unit / Equipment:** De-Butanizer (3C-8) / 3G-11A Bottom Pump
- **Fault Type:** Trip ($Withdrawal \rightarrow 0$)
- **Physical Cascade:** Bottom withdrawal $FI16 \rightarrow 0$; 3C-8 sump level $LIC11$ rises rapidly; risk of tray flooding if uncorrected.
- **Expected Alarms:** $FAL16 \rightarrow LAH11 \rightarrow LAHH11$.
- **Target Operator Response:** Start standby pump 3G-11B; verify downstream path to 3E-10 and 20D-4; reduce feed flow if bottom pump fails to start.
- **Recovery Criteria:** 3C-8 sump level $LIC11$ returns to $50–60\%$, $FI16$ flow restored.

---

### Category B: Utilities & Heat Exchanger Disturbances

#### S06: Loss / Degradation of 3E-5 Refrigeration (Propane Chilled Condenser)
- **Unit / Equipment:** De-Ethanizer (3C-4) / 3E-5 Overhead Condenser
- **Fault Type:** Ramp down of refrigerant availability / UA (0 to 100% loss over 60s)
- **Physical Cascade:** Condensation rate falls $\rightarrow$ overhead vapor inventory accumulates $\rightarrow$ column pressure $PIC3$ rises sharply $\rightarrow$ reflux drum $3C-5$ inventory drops $\rightarrow$ top temperature $TI171$ rises.
- **Expected Alarms:** $PAH3 \rightarrow PAHH3 \rightarrow LAL4 \rightarrow TAH171$.
- **Target Operator Response:** Recognize loss of cooling; immediately throttle reboiler steam $FIC11$ / cut column heat input; reduce feed flow from Scrub bottom; check and restore propane refrigeration loop ($3C-10$).
- **Recovery Criteria:** Column pressure arrested below trip threshold ($<32\,\text{kg/cm}^2$), condenser duty restored, pressure returns to $30.0\,\text{kg/cm}^2$.

#### S07: Loss / Fouling of 3E-7 Cooling Water Duty
- **Unit / Equipment:** De-Propanizer (3C-6) / 3E-7 Overhead Condenser
- **Fault Type:** Cooling water flow or heat transfer degradation
- **Physical Cascade:** 3E-7 condensation falls $\rightarrow$ 3C-6 column pressure $PIC5A/B$ increases $\rightarrow$ reflux drum 3C-7 inventory drops.
- **Expected Alarms:** $PAH5 \rightarrow TAH167$.
- **Target Operator Response:** Restore cooling water lineup; trim reboiler 3E-6 steam; manage pressure.
- **Recovery Criteria:** Pressure $PIC5A/B$ returns to $16.1\,\text{kg/cm}^2$.

#### S08: Loss / Fouling of 3E-9 Cooling Water Duty
- **Unit / Equipment:** De-Butanizer (3C-8) / 3E-9 Overhead Condenser
- **Fault Type:** Cooling water flow or heat transfer degradation
- **Physical Cascade:** 3C-8 pressure $PIC7A/B$ rises $\rightarrow$ reflux availability drops $\rightarrow$ C4/C5 separation degrades.
- **Expected Alarms:** $PAH7 \rightarrow TAH183$.
- **Target Operator Response:** Restore cooling water; reduce 3E-8 reboiler steam.
- **Recovery Criteria:** Column pressure returns to $6.01\,\text{kg/cm}^2$.

#### S09: LP Steam Header Pressure / Availability Drop
- **Unit / Equipment:** Plant-3 Common LP Steam Header
- **Fault Type:** Steam supply pressure drops by 30–50%
- **Physical Cascade:** Boil-up drops simultaneously across 3E-1, 3E-4, 3E-6, 3E-8 $\rightarrow$ bottom temperatures drop $\rightarrow$ light hydrocarbon slip to column bottoms across the entire train.
- **Expected Alarms:** Multiple reboiler flow and temperature deviation alarms ($TAL, FAL$).
- **Target Operator Response:** Recognize common utility cause; adjust feed throughput; prioritize critical separation columns; avoid aggressive individual retuning.
- **Recovery Criteria:** Plant throughput balanced with available steam enthalpy; stable bottom temperatures.

---

### Category C: Valves & Process Actuators

#### S10: Reboiler Steam Control Valve Stuck Open
- **Unit / Equipment:** De-Ethanizer (3C-4) / 3E-4 Steam Valve
- **Fault Type:** Valve position frozen at 100% open
- **Physical Cascade:** Maximum boil-up $\rightarrow$ column bottom temperature rises $\rightarrow$ vapor traffic increases $\rightarrow$ column $\Delta P$ increases $\rightarrow$ 3E-5 condenser overload and pressure rise.
- **Expected Alarms:** $TAH170 \rightarrow PAH3 \rightarrow \Delta P\text{ High}$.
- **Target Operator Response:** Switch controller to MAN; isolate manual bypass/trim manual block valve; reduce feed rate.
- **Recovery Criteria:** Column $\Delta P$ and pressure normalized.

#### S11: Reboiler Steam Control Valve Stuck Closed
- **Unit / Equipment:** De-Ethanizer (3C-4) / 3E-4 Steam Valve
- **Fault Type:** Valve position frozen at 0% open
- **Physical Cascade:** Boil-up collapses $\rightarrow$ bottom temperature $TI170$ falls $\rightarrow$ column fractionation fails; ethane slips into bottom C3+ product.
- **Expected Alarms:** $TAL170 \rightarrow FAL11 \rightarrow AI23\text{ Quality Alarm}$.
- **Target Operator Response:** Identify valve failure; open manual steam bypass; reduce feed rate.
- **Recovery Criteria:** Boil-up restored and bottom temperature recovered.

#### S12: Feed Flow Step High (+25%)
- **Unit / Equipment:** Scrub & De-Ethanizer Feed
- **Fault Type:** Feed flow step change
- **Physical Cascade:** Column liquid/vapor loading increases $\rightarrow$ column levels rise $\rightarrow$ utility demands increase $\rightarrow \Delta P$ increases.
- **Expected Alarms:** $FAH \rightarrow LAH$.
- **Target Operator Response:** Balance material inventory; adjust reflux and reboil accordingly; prevent controller saturation.
- **Recovery Criteria:** New steady-state operating point achieved without constraint violations.

#### S13: Feed Temperature High (+15 °C)
- **Unit / Equipment:** De-Ethanizer Feed (3E-14 Outlet)
- **Fault Type:** Feed temperature disturbance
- **Physical Cascade:** Higher vapor fraction entering column $\rightarrow$ vapor traffic shifts to top section $\rightarrow$ top condenser load increases.
- **Expected Alarms:** $TAH \rightarrow PAH$.
- **Target Operator Response:** Trim feed cooler 3E-14 cooling; trim reboiler duty to account for higher feed enthalpy.
- **Recovery Criteria:** Column temperature and pressure profile re-stabilized.

#### S14: Heavier Feed Composition Step/Ramp
- **Unit / Equipment:** Plant-3 Feed Stream
- **Fault Type:** Higher proportion of C3+/C4+ in feed
- **Physical Cascade:** Higher reboil duty required $\rightarrow$ bottom product flow increases $\rightarrow$ top/bottom purities drift.
- **Expected Alarms:** Quality proxy deviation alarms ($AI23, AI21$).
- **Target Operator Response:** Adjust reflux and boil-up ratio; monitor product analyzers.
- **Recovery Criteria:** Product purities maintained within specification.

---

### Category D: Instrumentation & Control Faults

#### S15: Pressure Transmitter Bias (+3.0 kg/cm²)
- **Unit / Equipment:** De-Ethanizer Pressure Transmitter (PIC3)
- **Fault Type:** Measured value = True value + 3.0 kg/cm²
- **Physical Cascade:** PIC3 sees high pressure and increases cooling / closes steam $\rightarrow$ *true* column pressure actually drops $\rightarrow$ process temperatures drop while PIC3 claims pressure is at setpoint.
- **Expected Alarms:** Temperature low alarms with normal indicated pressure (measurement mismatch).
- **Target Operator Response:** Cross-check multiple indicators (temperatures vs indicated pressure); diagnose transmitter bias; switch PIC3 to MAN; adjust based on redundant indications.
- **Recovery Criteria:** True column pressure returned to safe operating band ($30.0\,\text{kg/cm}^2$).

#### S16: Level Transmitter Frozen
- **Unit / Equipment:** 3C-5 Reflux Drum Level Transmitter (LIC4)
- **Fault Type:** Measured value frozen at 34.5%
- **Physical Cascade:** LIC4 controller remains idle while actual liquid level continues to rise or fall depending on inflow/outflow balance.
- **Expected Alarms:** Flow mismatch between condensate and distillate/reflux.
- **Target Operator Response:** Perform mass balance check; detect frozen level reading; place loop in MAN; estimate level from flow balances.
- **Recovery Criteria:** True inventory maintained within safe operational limits.

#### S17: Controller Accidentally Left in MAN
- **Unit / Equipment:** 3C-6 Reflux Flow Controller (FIC12)
- **Fault Type:** Mode = MAN with fixed output while feed changes
- **Physical Cascade:** Reflux flow does not respond to upstream disturbances $\rightarrow$ separation quality drifts.
- **Expected Alarms:** Mode indicator highlight $\rightarrow$ temperature/quality deviation.
- **Target Operator Response:** Identify mode error; perform bumpless transfer back to AUTO.
- **Recovery Criteria:** Controller in AUTO with stable setpoint tracking.

#### S18: Control Valve Stiction
- **Unit / Equipment:** 3C-8 Reboiler Steam Valve
- **Fault Type:** Non-linear stiction (deadband 5%, slip jump 4%)
- **Physical Cascade:** Limit-cycle oscillations in flow, temperature, and reboiler duty.
- **Expected Alarms:** Cyclic deviation alarms.
- **Target Operator Response:** Identify limit cycle on trend; tune down controller gain; switch to manual trim.
- **Recovery Criteria:** Process oscillations suppressed.

---

### Category E: Hydrodynamics & Compound Upsets

#### S19: Column Flooding from Excessive Vapor Traffic
- **Unit / Equipment:** De-Propanizer (3C-6)
- **Fault Type:** Severe boil-up and liquid traffic exceeding flooding limit ($>125\%$)
- **Physical Cascade:** Liquid entrainment in trays $\rightarrow \Delta P$ spikes exponentially $\rightarrow$ tray separation efficiency collapses $\rightarrow$ top and bottom product contamination.
- **Expected Alarms:** $PDAH6\text{ High-High} \rightarrow TAH \rightarrow TAL$.
- **Target Operator Response:** Immediately cut reboiler heat input; reduce feed rate; avoid increasing reflux; monitor $\Delta P$ recovery.
- **Recovery Criteria:** $\Delta P$ drops below $1.6\,\text{kg/cm}^2$, temperature profile recovers.

#### S20: Compound Upset: High Feed Load + Degraded Condenser
- **Unit / Equipment:** De-Butanizer (3C-8)
- **Fault Type:** Feed +20% combined with 3E-9 CW cooling loss of 40%
- **Physical Cascade:** Rapid pressure escalation, high column $\Delta P$, reflux drum depletion.
- **Expected Alarms:** Simultaneous $PAH, \Delta PAH, LAL$.
- **Target Operator Response:** Prioritize pressure and safety constraints; immediately cut reboiler heat and feed throughput; restore cooling water before attempting quality restoration.
- **Recovery Criteria:** Column pressure arrested below safety limit, stable material balance restored.
