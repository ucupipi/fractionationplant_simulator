import { ALARM_CONFIG_REGISTRY, AlarmConfigItem, AlarmCondition } from '../../data/alarm-config';
import { AlarmSeverity, AlarmState } from '../../data/tags';

export interface ActiveAlarmRecord {
  id: string;
  tagId: string;
  condition: AlarmCondition;
  priority: AlarmSeverity;
  state: AlarmState;
  message: string;
  consequence: string;
  operatorAction: string;
  valueAtTrigger: number;
  triggerTimestamp: number; // milliseconds
  ackTimestamp?: number;
  rtnTimestamp?: number;
  isFirstOut: boolean;
}

export interface AlarmJournalEvent {
  id: string;
  alarmId: string;
  tagId: string;
  timestamp: string; // ISO string
  simTimeSeconds: number;
  eventType: 'TRIGGER' | 'ACK' | 'RTN';
  priority: AlarmSeverity;
  message: string;
  value: number;
}

export class AlarmEngine {
  public configs: AlarmConfigItem[];
  public activeAlarms: Map<string, ActiveAlarmRecord> = new Map();
  public alarmHistory: AlarmJournalEvent[] = [];
  private pendingTriggers: Map<string, number> = new Map(); // alarmId -> time condition met
  private firstOutAlarmId: string | null = null;

  constructor() {
    this.configs = [...ALARM_CONFIG_REGISTRY];
  }

  public update(simTimeSeconds: number, tagValues: Record<string, number>): void {
    const nowMs = Date.now();

    for (const config of this.configs) {
      const val = tagValues[config.tagId];
      if (val === undefined || isNaN(val)) continue;

      const existing = this.activeAlarms.get(config.id);

      const isViolated = this.checkCondition(config.condition, val, config.setpoint, config.deadband, !!existing);

      if (isViolated) {
        if (!existing) {
          // Condition met: check delay timer
          const pendingTime = this.pendingTriggers.get(config.id);
          if (pendingTime === undefined) {
            this.pendingTriggers.set(config.id, simTimeSeconds);
          } else if (simTimeSeconds - pendingTime >= config.delaySeconds) {
            // Delay passed: activate alarm
            const isFirst = this.firstOutAlarmId === null;
            if (isFirst) {
              this.firstOutAlarmId = config.id;
            }

            const newAlarm: ActiveAlarmRecord = {
              id: config.id,
              tagId: config.tagId,
              condition: config.condition,
              priority: config.priority,
              state: 'ACTIVE_UNACK',
              message: config.message,
              consequence: config.consequence,
              operatorAction: config.operatorAction,
              valueAtTrigger: val,
              triggerTimestamp: nowMs,
              isFirstOut: isFirst
            };

            this.activeAlarms.set(config.id, newAlarm);
            this.pendingTriggers.delete(config.id);

            this.logEvent({
              id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              alarmId: config.id,
              tagId: config.tagId,
              timestamp: new Date().toISOString(),
              simTimeSeconds,
              eventType: 'TRIGGER',
              priority: config.priority,
              message: config.message,
              value: val
            });
          }
        }
      } else {
        // Condition no longer violated
        this.pendingTriggers.delete(config.id);

        if (existing) {
          if (existing.state === 'ACTIVE_ACK') {
            // Clears immediately to normal
            this.activeAlarms.delete(config.id);
            if (this.firstOutAlarmId === config.id) {
              this.firstOutAlarmId = null;
            }
          } else if (existing.state === 'ACTIVE_UNACK') {
            // Returned to normal but still unacknowledged (RTN_UNACK)
            existing.state = 'RTN_UNACK';
            existing.rtnTimestamp = nowMs;
          }

          this.logEvent({
            id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            alarmId: config.id,
            tagId: config.tagId,
            timestamp: new Date().toISOString(),
            simTimeSeconds,
            eventType: 'RTN',
            priority: config.priority,
            message: `RTN: ${config.message}`,
            value: val
          });
        }
      }
    }
  }

  private checkCondition(cond: AlarmCondition, val: number, sp: number, deadband: number, isActive: boolean): boolean {
    switch (cond) {
      case 'HI_HI':
      case 'HI':
      case 'DEV_HI':
        return isActive ? val >= (sp - deadband) : val >= sp;
      case 'LO_LO':
      case 'LO':
      case 'DEV_LO':
        return isActive ? val <= (sp + deadband) : val <= sp;
      default:
        return false;
    }
  }

  public acknowledgeAlarm(alarmId: string, simTimeSeconds: number): void {
    const alarm = this.activeAlarms.get(alarmId);
    if (!alarm) return;

    if (alarm.state === 'ACTIVE_UNACK') {
      alarm.state = 'ACTIVE_ACK';
      alarm.ackTimestamp = Date.now();
      this.logEvent({
        id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        alarmId: alarm.id,
        tagId: alarm.tagId,
        timestamp: new Date().toISOString(),
        simTimeSeconds,
        eventType: 'ACK',
        priority: alarm.priority,
        message: `ACKNOWLEDGED: ${alarm.message}`,
        value: alarm.valueAtTrigger
      });
    } else if (alarm.state === 'RTN_UNACK') {
      // Operator acknowledged return to normal -> remove alarm
      this.activeAlarms.delete(alarmId);
      if (this.firstOutAlarmId === alarmId) {
        this.firstOutAlarmId = null;
      }
      this.logEvent({
        id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        alarmId: alarm.id,
        tagId: alarm.tagId,
        timestamp: new Date().toISOString(),
        simTimeSeconds,
        eventType: 'ACK',
        priority: alarm.priority,
        message: `CLEARED: ${alarm.message}`,
        value: alarm.valueAtTrigger
      });
    }
  }

  public acknowledgeAll(simTimeSeconds: number): void {
    for (const [id] of this.activeAlarms) {
      this.acknowledgeAlarm(id, simTimeSeconds);
    }
  }

  public getUnackCount(): number {
    let count = 0;
    for (const alarm of this.activeAlarms.values()) {
      if (alarm.state === 'ACTIVE_UNACK' || alarm.state === 'RTN_UNACK') {
        count++;
      }
    }
    return count;
  }

  public getHighestSeverity(): AlarmSeverity {
    let highest: AlarmSeverity = 'NORMAL';
    const rank: Record<AlarmSeverity, number> = { 'CRITICAL': 3, 'HIGH': 2, 'LOW': 1, 'NORMAL': 0 };

    for (const alarm of this.activeAlarms.values()) {
      if (rank[alarm.priority] > rank[highest]) {
        highest = alarm.priority;
      }
    }
    return highest;
  }

  private logEvent(event: AlarmJournalEvent): void {
    this.alarmHistory.unshift(event);
    if (this.alarmHistory.length > 500) {
      this.alarmHistory.pop();
    }
  }

  public reset(): void {
    this.activeAlarms.clear();
    this.pendingTriggers.clear();
    this.firstOutAlarmId = null;
    this.alarmHistory = [];
  }
}
