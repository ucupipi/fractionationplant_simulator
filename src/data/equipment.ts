export type EquipmentType = 'COLUMN' | 'DRUM' | 'REBOILER' | 'CONDENSER' | 'COOLER' | 'HEATER' | 'PUMP' | 'VALVE';
export type PumpState = 'RUNNING' | 'STOPPED' | 'TRIPPED' | 'STANDBY' | 'UNAVAILABLE';

export interface EquipmentRecord {
  id: string;
  name: string;
  type: EquipmentType;
  unitSection: 'SCRUB' | 'DE_ETHANIZER' | 'DE_PROPANIZER' | 'DE_BUTANIZER' | 'REFRIGERATION' | 'COMMON';
  description: string;
  tagRefs: string[];
  assumed?: boolean;
}

export interface PumpEquipmentRecord extends EquipmentRecord {
  type: 'PUMP';
  currentAmps?: number;
  maxAmps: number;
  designFlow: number; // m3/h
  designHead: number; // m
  partnerPumpId?: string; // e.g. 3G-2A partner is 3G-2B
}

export const EQUIPMENT_REGISTRY: Record<string, EquipmentRecord | PumpEquipmentRecord> = {
  // Scrub Section
  '3C-1': { id: '3C-1', name: 'Scrub Column', type: 'COLUMN', unitSection: 'SCRUB', description: 'Heavy hydrocarbon scrubbing & fractionation column', tagRefs: ['2TI127', 'TI158', 'TI159', 'TIC1', 'TI157', 'LIC2', 'FIC2', 'TI161'] },
  '3C-2': { id: '3C-2', name: 'Scrub Column Condensate Drum', type: 'DRUM', unitSection: 'SCRUB', description: 'Overhead condensate separator', tagRefs: ['LIC3', 'FIC1', 'HIC110', 'FI4', 'FI35', 'HIC1'] },
  '3E-1': { id: '3E-1', name: 'Scrub Column Reboiler', type: 'REBOILER', unitSection: 'SCRUB', description: 'LP Steam kettle reboiler', tagRefs: ['TI160', 'TI52', 'PI163'] },
  '3E-18': { id: '3E-18', name: 'Startup Gas Heater', type: 'HEATER', unitSection: 'SCRUB', description: 'Startup gas heater', tagRefs: ['TIC193', 'FIC80', 'TI191', 'PI12'] },
  '3C-13': { id: '3C-13', name: 'Steam Condensate Receiver', type: 'DRUM', unitSection: 'SCRUB', description: 'Steam condensate drain collector', tagRefs: ['PI163'] },
  '3G-1A': { id: '3G-1A', name: 'Scrub Reflux Pump A', type: 'PUMP', unitSection: 'SCRUB', description: 'Motor-driven centrifugal reflux pump A', maxAmps: 45, designFlow: 150, designHead: 65, partnerPumpId: '3G-1B', tagRefs: ['FIC3'] },
  '3G-1B': { id: '3G-1B', name: 'Scrub Reflux Pump B', type: 'PUMP', unitSection: 'SCRUB', description: 'Motor-driven centrifugal reflux pump B (Standby)', maxAmps: 45, designFlow: 150, designHead: 65, partnerPumpId: '3G-1A', tagRefs: ['FIC3'] },
  '3E-14': { id: '3E-14', name: 'De-Ethanizer Feed Cooler', type: 'COOLER', unitSection: 'SCRUB', description: 'Cooling water feed heat exchanger', tagRefs: ['TI176'] },

  // De-Ethanizer
  '3C-4': { id: '3C-4', name: 'De-Ethanizer Column', type: 'COLUMN', unitSection: 'DE_ETHANIZER', description: 'C2 / C3+ separation distillation tower', tagRefs: ['PIC3', 'TI171', 'TI175', 'TIC3', 'TI304', 'TI170', 'TI306', '3C-4_DP', 'LIC5', 'FIC11', 'AI23_C3'] },
  '3E-5': { id: '3E-5', name: 'De-Ethanizer Overhead Condenser', type: 'CONDENSER', unitSection: 'DE_ETHANIZER', description: 'Propane refrigerant chilled partial condenser', tagRefs: ['3E-5_DUTY', 'TI301', 'TI302', 'LIC4'] },
  '3C-5': { id: '3C-5', name: 'De-Ethanizer Reflux Drum', type: 'DRUM', unitSection: 'DE_ETHANIZER', description: 'Overhead reflux & distillate accumulator vessel', tagRefs: ['LIC4', 'TI169'] },
  '3E-4': { id: '3E-4', name: 'De-Ethanizer Reboiler', type: 'REBOILER', unitSection: 'DE_ETHANIZER', description: 'Medium/Low Pressure Steam thermosiphon reboiler', tagRefs: ['TI170', 'TI197'] },
  '3E-17': { id: '3E-17', name: 'De-Ethanizer Overhead Heater', type: 'COOLER', unitSection: 'DE_ETHANIZER', description: 'LP Steam heater for fuel gas export', tagRefs: ['LIC6', 'FI89', 'TI168'] },
  '3G-2A': { id: '3G-2A', name: 'De-Ethanizer Reflux Pump A', type: 'PUMP', unitSection: 'DE_ETHANIZER', description: 'Centrifugal motor pump A', maxAmps: 35, designFlow: 45, designHead: 80, partnerPumpId: '3G-2B', tagRefs: ['FIC6', 'TI307'] },
  '3G-2B': { id: '3G-2B', name: 'De-Ethanizer Reflux Pump B', type: 'PUMP', unitSection: 'DE_ETHANIZER', description: 'Centrifugal motor pump B (Standby)', maxAmps: 35, designFlow: 45, designHead: 80, partnerPumpId: '3G-2A', tagRefs: ['FIC6'] },

  // De-Propanizer
  '3C-6': { id: '3C-6', name: 'De-Propanizer Column', type: 'COLUMN', unitSection: 'DE_PROPANIZER', description: 'C3 / C4+ separation distillation tower', tagRefs: ['PIC5', 'PDIC6', 'TI167', 'TI308', 'TIC5', 'TI166', 'LIC9', 'FIC14', 'AI21_C3'] },
  '3E-6': { id: '3E-6', name: 'De-Propanizer Reboiler', type: 'REBOILER', unitSection: 'DE_PROPANIZER', description: 'LP Steam reboiler', tagRefs: ['TI164', 'TI309'] },
  '3E-7': { id: '3E-7', name: 'De-Propanizer Overhead Condenser', type: 'CONDENSER', unitSection: 'DE_PROPANIZER', description: 'Cooling Water shell-and-tube condenser', tagRefs: ['PIC5'] },
  '3C-7': { id: '3C-7', name: 'De-Propanizer Reflux Drum', type: 'DRUM', unitSection: 'DE_PROPANIZER', description: 'Propane reflux accumulator drum', tagRefs: ['LIC10'] },
  '3G-6A': { id: '3G-6A', name: 'De-Propanizer Reflux Pump A', type: 'PUMP', unitSection: 'DE_PROPANIZER', description: 'Centrifugal pump A (Standby)', maxAmps: 40, designFlow: 90, designHead: 75, partnerPumpId: '3G-6B', tagRefs: ['FIC12'] },
  '3G-6B': { id: '3G-6B', name: 'De-Propanizer Reflux Pump B', type: 'PUMP', unitSection: 'DE_PROPANIZER', description: 'Centrifugal pump B (Running)', maxAmps: 40, designFlow: 90, designHead: 75, partnerPumpId: '3G-6A', tagRefs: ['FIC12'] },
  '3G-6C': { id: '3G-6C', name: 'De-Propanizer Reflux Pump C', type: 'PUMP', unitSection: 'DE_PROPANIZER', description: 'Centrifugal pump C (Standby)', maxAmps: 40, designFlow: 90, designHead: 75, partnerPumpId: '3G-6B', tagRefs: ['FIC12'] },

  // De-Butanizer
  '3C-8': { id: '3C-8', name: 'De-Butanizer Column', type: 'COLUMN', unitSection: 'DE_BUTANIZER', description: 'C4 / C5+ gasoline separation column', tagRefs: ['PIC7', 'PDIC8', 'TI183', 'TIC6', 'TI182', 'LIC11', 'FI16'] },
  '3E-8': { id: '3E-8', name: 'De-Butanizer Reboiler', type: 'REBOILER', unitSection: 'DE_BUTANIZER', description: 'LP Steam reboiler', tagRefs: ['TI184'] },
  '3E-9': { id: '3E-9', name: 'De-Butanizer Overhead Condenser', type: 'CONDENSER', unitSection: 'DE_BUTANIZER', description: 'Cooling Water condenser', tagRefs: ['TI310'] },
  '3C-9': { id: '3C-9', name: 'De-Butanizer Reflux Drum', type: 'DRUM', unitSection: 'DE_BUTANIZER', description: 'Butane reflux accumulator', tagRefs: ['LIC12', 'TI180'] },
  '3G-7A': { id: '3G-7A', name: 'De-Butanizer Reflux Pump A', type: 'PUMP', unitSection: 'DE_BUTANIZER', description: 'Centrifugal pump A (Running)', maxAmps: 30, designFlow: 65, designHead: 65, partnerPumpId: '3G-7B', tagRefs: ['FIC15'] },
  '3G-7B': { id: '3G-7B', name: 'De-Butanizer Reflux Pump B', type: 'PUMP', unitSection: 'DE_BUTANIZER', description: 'Centrifugal pump B (Standby)', maxAmps: 30, designFlow: 65, designHead: 65, partnerPumpId: '3G-7A', tagRefs: ['FIC15'] },
  '3G-11A': { id: '3G-11A', name: 'De-Butanizer Bottom Pump A', type: 'PUMP', unitSection: 'DE_BUTANIZER', description: 'Bottom gasoline withdrawal pump A', maxAmps: 25, designFlow: 20, designHead: 50, partnerPumpId: '3G-11B', tagRefs: ['FI16'] },
  '3G-11B': { id: '3G-11B', name: 'De-Butanizer Bottom Pump B', type: 'PUMP', unitSection: 'DE_BUTANIZER', description: 'Bottom gasoline withdrawal pump B', maxAmps: 25, designFlow: 20, designHead: 50, partnerPumpId: '3G-11A', tagRefs: ['FI16'] },
  '3E-10': { id: '3E-10', name: 'Bottom Product Cooler', type: 'COOLER', unitSection: 'DE_BUTANIZER', description: 'Cooling water product cooler to 20D-4', tagRefs: ['FI16'] },

  // Refrigeration & Return
  '3C-10': { id: '3C-10', name: 'Fractionation Propane Refrigerant Drum', type: 'DRUM', unitSection: 'REFRIGERATION', description: 'Propane liquid refrigeration accumulator', tagRefs: ['PI33'] },
  '3E-12': { id: '3E-12', name: 'Propane Return Subcooler', type: 'COOLER', unitSection: 'REFRIGERATION', description: 'Propane subcooling heat exchanger', tagRefs: ['LIC8'] },
  '3E-13': { id: '3E-13', name: 'Butane Return Subcooler', type: 'COOLER', unitSection: 'REFRIGERATION', description: 'Butane subcooling heat exchanger', tagRefs: ['TIC155', 'LIC35', 'TI178'] },
  '3G-5A': { id: '3G-5A', name: 'Butane Return Pump A', type: 'PUMP', unitSection: 'REFRIGERATION', description: 'Butane return pump A (Standby)', maxAmps: 25, designFlow: 25, designHead: 60, partnerPumpId: '3G-5B', tagRefs: ['FIC92'] },
  '3G-5B': { id: '3G-5B', name: 'Butane Return Pump B', type: 'PUMP', unitSection: 'REFRIGERATION', description: 'Butane return pump B (Running)', maxAmps: 25, designFlow: 25, designHead: 60, partnerPumpId: '3G-5A', tagRefs: ['FIC92'] }
};
