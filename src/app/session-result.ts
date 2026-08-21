export type SessionType = 'formal' | 'demo';
export type SessionPhase = 'practice' | 'formal' | 'demo';

export interface SessionRun {
    label: string;
    phase: SessionPhase;
    clicks: any[];
    average?: any;
}

export interface SessionResult {
    schemaVersion: 1;
    sessionId: string;
    sessionType: SessionType;
    startedAt: string;
    completedAt: string;
    participant: any;
    practiceRuns: SessionRun[];
    runs: SessionRun[];
    overallAverage: any;
}
