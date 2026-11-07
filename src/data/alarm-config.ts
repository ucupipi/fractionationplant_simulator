import { AlarmSeverity } from './tags';

export type AlarmCondition = 'HI_HI' | 'HI' | 'LO' | 'LO_LO' | 'DEV_HI' | 'DEV_LO' | 'TRIP' | 'DISCREPANCY';

export interface AlarmConfigItem {
  id: string;
  tagId: string;
  condition: AlarmCondition;
  setpoint: number;
  priority: AlarmSeverity;
  deadband: number; // in EU
  delaySeconds: number; // chatter prevention delay
  message: string;
  consequence: string;
  operatorAction: string;
  assumed: boolean;
}

export const ALARM_CONFIG_REGISTRY: AlarmConfigItem[] = [
  // ==================== 3C-1 SCRUB COLUMN ALARMS ====================
  {
    id: 'ALM_TIC1_TAH',
    tagId: 'TIC1',
    condition: 'HI',
    setpoint: 5.0,
    priority: 'HIGH',
    deadband: 0.5,
    delaySeconds: 2.0,
    message: '3C-1 Tray 1 Temperature High',
    consequence: 'Excessive stripping; C2/C3 slipping to bottoms or heavy vapor boilup',
    operatorAction: 'Reduce 3E-1 LP steam flow (3TV-1) or increase 3G-1 reflux',
    assumed: false
  },
  {
    id: 'ALM_TIC1_TAL',
    tagId: 'TIC1',
    condition: 'LO',
    setpoint: -10.0,
    priority: 'HIGH',
    deadband: 0.5,
    delaySeconds: 2.0,
    message: '3C-1 Tray 1 Temperature Low',
    consequence: 'Risk of freezing or inadequate fractionation in stripping zone',
    operatorAction: 'Increase 3E-1 LP steam flow (3TV-1), verify steam header pressure PI163',
    assumed: false
  },
  {
    id: 'ALM_LIC2_LAHH',
    tagId: 'LIC2',
    condition: 'HI_HI',
    setpoint: 85.0,
    priority: 'CRITICAL',
    deadband: 1.0,
    delaySeconds: 1.5,
    message: '3C-1 Sump Liquid Level High-High',
    consequence: 'Liquid flooding into reboiler return and vapor risers',
    operatorAction: 'Increase 3LV-2 bottom outflow (FIC2) to 3C-4',
    assumed: false
  },
  {
    id: 'ALM_LIC2_LALL',
    tagId: 'LIC2',
    condition: 'LO_LO',
    setpoint: 25.0,
    priority: 'CRITICAL',
    deadband: 1.0,
    delaySeconds: 1.5,
    message: '3C-1 Sump Liquid Level Low-Low',
    consequence: 'Loss of bottom seal and liquid circulation to 3E-1 reboiler',
    operatorAction: 'Throttle 3LV-2 outflow, verify feed rate and reflux',
    assumed: false
  },
  {
    id: 'ALM_FIC3_FAL',
    tagId: 'FIC3',
    condition: 'LO',
    setpoint: 40.0,
    priority: 'HIGH',
    deadband: 2.0,
    delaySeconds: 1.5,
    message: '3C-1 Reflux Flow Low (3G-1)',
    consequence: 'Loss of heavy hydrocarbon condensation; heavy ends carryover to 5E-1',
    operatorAction: 'Start standby pump 3G-1B, verify 3C-2 drum level LIC3',
    assumed: false
  },
  {
    id: 'ALM_LIC3_LAHH',
    tagId: 'LIC3',
    condition: 'HI_HI',
    setpoint: 80.0,
    priority: 'CRITICAL',
    deadband: 1.0,
    delaySeconds: 2.0,
    message: '3C-2 Reflux Drum Level High-High',
    consequence: 'Liquid entrainment into 5E-1 MCR cryogenic heat exchanger',
    operatorAction: 'Increase reflux 3G-1 or open 3LV-3 drain to 3C-4',
    assumed: false
  },
  {
    id: 'ALM_LIC3_LALL',
    tagId: 'LIC3',
    condition: 'LO_LO',
    setpoint: 15.0,
    priority: 'CRITICAL',
    deadband: 1.0,
    delaySeconds: 2.0,
    message: '3C-2 Reflux Drum Level Low-Low',
    consequence: '3G-1 reflux pump cavitation and loss of reflux liquid',
    operatorAction: 'Increase butane recycle FIC1 / HIC110, reduce reflux rate',
    assumed: false
  },
  {
    id: 'ALM_PI163_PAL',
    tagId: 'PI163',
    condition: 'LO',
    setpoint: 0.8,
    priority: 'HIGH',
    deadband: 0.05,
    delaySeconds: 2.0,
    message: '3E-1 LP Steam Supply Pressure Low',
    consequence: 'Inadequate reboiler heating duty, drop in column bottom temperatures',
    operatorAction: 'Check LP steam header pressure and 3TV-1 valve position',
    assumed: false
  },

  // De-Ethanizer (3C-4)
  {
    id: 'ALM_PIC3_PAHH',
    tagId: 'PIC3',
    condition: 'HI_HI',
    setpoint: 32.50,
    priority: 'CRITICAL',
    deadband: 0.20,
    delaySeconds: 1.0,
    message: '3C-4 DE-ETHANIZER OVERHEAD PRESSURE HI-HI (TRIP RISK)',
    consequence: 'Risk of column overpressure relief to flare and safety valve discharge',
    operatorAction: 'Cut 3E-4 steam immediately, verify 3E-5 refrigerant supply, reduce feed flow',
    assumed: true
  },
  {
    id: 'ALM_PIC3_PAH',
    tagId: 'PIC3',
    condition: 'HI',
    setpoint: 31.00,
    priority: 'HIGH',
    deadband: 0.15,
    delaySeconds: 2.0,
    message: '3C-4 Overhead Pressure High',
    consequence: 'Pressure approaching relief setpoint; condensation constraint',
    operatorAction: 'Check 3E-5 condenser duty, trim reboiler steam',
    assumed: true
  },
  {
    id: 'ALM_3C4_DP_HI',
    tagId: '3C-4_DP',
    condition: 'HI_HI',
    setpoint: 2.50,
    priority: 'CRITICAL',
    deadband: 0.05,
    delaySeconds: 2.0,
    message: '3C-4 Differential Pressure High-High (Flooding)',
    consequence: 'Liquid entrainment in trays, loss of separation efficiency, column weeping/flooding',
    operatorAction: 'Reduce reboiler steam rate and feed flow immediately',
    assumed: true
  },
  {
    id: 'ALM_FIC6_FAL',
    tagId: 'FIC6',
    condition: 'LO',
    setpoint: 10.00,
    priority: 'HIGH',
    deadband: 1.0,
    delaySeconds: 1.5,
    message: '3C-4 Reflux Flow Low (3G-2)',
    consequence: 'Loss of fractionation; C3+ carryover to top fuel gas',
    operatorAction: 'Start standby pump 3G-2B; check suction strainer and discharge valve lineup',
    assumed: true
  },
  {
    id: 'ALM_LIC4_LAL',
    tagId: 'LIC4',
    condition: 'LO_LO',
    setpoint: 10.0,
    priority: 'CRITICAL',
    deadband: 1.5,
    delaySeconds: 2.0,
    message: '3C-5 Reflux Drum Level Low-Low',
    consequence: 'Loss of pump suction head; risk of 3G-2 pump cavitation/dry run',
    operatorAction: 'Throttle C2 distillate withdrawal, reduce reflux flow if necessary',
    assumed: true
  },
  {
    id: 'ALM_LIC5_LAHH',
    tagId: 'LIC5',
    condition: 'HI_HI',
    setpoint: 85.0,
    priority: 'CRITICAL',
    deadband: 1.0,
    delaySeconds: 2.0,
    message: '3C-4 Sump Level High-High',
    consequence: 'Liquid flooding reboiler vapor space; potential thermal shock',
    operatorAction: 'Increase bottom flow to 3C-6 (FIC11), check level controller',
    assumed: true
  },

  // De-Propanizer (3C-6)
  {
    id: 'ALM_PIC5_PAH',
    tagId: 'PIC5',
    condition: 'HI',
    setpoint: 17.50,
    priority: 'HIGH',
    deadband: 0.15,
    delaySeconds: 2.0,
    message: '3C-6 De-Propanizer Pressure High',
    consequence: 'Loss of cooling in 3E-7 or excessive boil-up',
    operatorAction: 'Check 3E-7 cooling water valve, trim 3E-6 steam',
    assumed: true
  },
  {
    id: 'ALM_FIC12_FAL',
    tagId: 'FIC12',
    condition: 'LO',
    setpoint: 20.0,
    priority: 'HIGH',
    deadband: 2.0,
    delaySeconds: 1.5,
    message: '3C-6 Reflux Flow Low (3G-6)',
    consequence: 'Overhead C3 product contamination with C4',
    operatorAction: 'Start standby pump 3G-6A or 3G-6C',
    assumed: true
  },
  {
    id: 'ALM_PDIC6_PDAHH',
    tagId: 'PDIC6',
    condition: 'HI_HI',
    setpoint: 2.60,
    priority: 'CRITICAL',
    deadband: 0.05,
    delaySeconds: 2.0,
    message: '3C-6 Column Flooding High-High dP',
    consequence: 'Massive entrainment, off-spec C3 product',
    operatorAction: 'Reduce 3E-6 boil-up steam immediately',
    assumed: true
  },

  // De-Butanizer (3C-8)
  {
    id: 'ALM_PIC7_PAH',
    tagId: 'PIC7',
    condition: 'HI',
    setpoint: 7.20,
    priority: 'HIGH',
    deadband: 0.1,
    delaySeconds: 2.0,
    message: '3C-8 De-Butanizer Pressure High',
    consequence: '3E-9 condenser constraint or cooling water degradation',
    operatorAction: 'Verify CW supply to 3E-9, trim 3E-8 reboiler steam',
    assumed: true
  },
  {
    id: 'ALM_FI16_FAL',
    tagId: 'FI16',
    condition: 'LO',
    setpoint: 1.0,
    priority: 'HIGH',
    deadband: 0.5,
    delaySeconds: 2.0,
    message: '3C-8 Bottom Product Flow Low (3G-11)',
    consequence: 'Bottom level accumulation in 3C-8',
    operatorAction: 'Start standby pump 3G-11B; check bottom line valve lineup',
    assumed: true
  },
  {
    id: 'ALM_LIC11_LAHH',
    tagId: 'LIC11',
    condition: 'HI_HI',
    setpoint: 88.0,
    priority: 'CRITICAL',
    deadband: 1.0,
    delaySeconds: 2.0,
    message: '3C-8 Bottom Level High-High',
    consequence: 'Sump liquid flood into bottom trays',
    operatorAction: 'Restore 3G-11 pump withdrawal, cut upstream feed',
    assumed: true
  },

  // Scrub Column (3C-1)
  {
    id: 'ALM_FIC3_FAL',
    tagId: 'FIC3',
    condition: 'LO',
    setpoint: 30.0,
    priority: 'HIGH',
    deadband: 3.0,
    delaySeconds: 1.5,
    message: '3C-1 Scrub Reflux Flow Low (3G-1)',
    consequence: 'Heavy hydrocarbon carryover into liquefaction train',
    operatorAction: 'Start standby pump 3G-1B',
    assumed: true
  }
];
