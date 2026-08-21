import { Injectable } from '@angular/core';
import { SessionPhase, SessionResult, SessionType } from './session-result';

declare const MobileDetect: any;

@Injectable()
export class AppService {
    info = null;
    md = null;
    runAverages = [];
    userAverage = {};
    debugModeTurns = null;
    dpi = null;
    currentDataSet = [];
    practiceDataSet = [];

    constructor() {
        if (typeof MobileDetect !== 'undefined') {
            this.md = new MobileDetect(window.navigator.userAgent);
        }
    }

    getPixels(cmValue) {
        return this.dpi * (cmValue / 2.54);
    }

    getCms(pixelsValue) {
        return (pixelsValue * 2.54) / this.dpi;
    }

    createSession(
        sessionType: SessionType,
        startedAt: string,
        participant: any,
        practiceClicks: any[],
        clicks: any[],
        runAverages: any[],
        overallAverage: any
    ): SessionResult {
        const phase: SessionPhase = sessionType === 'demo' ? 'demo' : 'formal';
        const runs = runAverages.map(average => ({
            label: average.run,
            phase,
            average,
            clicks: clicks.filter(click => click.run === average.run)
        }));

        return {
            schemaVersion: 1,
            sessionId: this.createSessionId(),
            sessionType,
            startedAt,
            completedAt: new Date().toISOString(),
            participant: Object.assign({}, participant),
            practiceRuns: practiceClicks.length ? [{
                label: 'PRACTICE',
                phase: 'practice',
                clicks: practiceClicks
            }] : [],
            runs,
            overallAverage
        };
    }

    async saveSession(session: SessionResult): Promise<void> {
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session)
        });
        if (!response.ok) {
            let message = `Local server returned ${response.status}`;
            try {
                const body = await response.json();
                message = body.error || message;
            } catch (_) {
                // Keep the status-based message when the response is not JSON.
            }
            throw new Error(message);
        }
    }

    isMobile() {
        if (!this.md) {
            return false;
        }
        return Boolean(this.md.mobile() || this.md.phone() || this.md.tablet() ||
            this.md.is('iPhone') || this.md.is('Android') || this.md.is('android'));
    }

    calculateDPI(diagonalWidth) {
        const width = screen.width || 1;
        const height = screen.height || 1;
        this.dpi = calcDpi(width, height, diagonalWidth, 'd');
        return this.dpi;
    }

    downloadData() {
        const data = {
            practiceClicks: this.practiceDataSet,
            clicks: this.currentDataSet,
            runs: this.runAverages,
            userAverage: this.userAverage
        };
        this.saveBlob(JSON.stringify(data, null, 2), `${this.info.alias}-data-json.json`, 'application/json');
    }

    convertArrayOfObjectsToCSV(args) {
        const data = args.data || null;
        if (!data || !data.length) {
            return null;
        }
        const columnDelimiter = args.columnDelimiter || ',';
        const lineDelimiter = args.lineDelimiter || '\n';
        const keys = Object.keys(data[0]);
        const escape = value => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
        return [
            keys.map(escape).join(columnDelimiter),
            ...data.map(item => keys.map(key => escape(item[key])).join(columnDelimiter))
        ].join(lineDelimiter);
    }

    downloadCSVData() {
        const sections = [
            this.convertArrayOfObjectsToCSV({ data: this.practiceDataSet || [] }),
            this.convertArrayOfObjectsToCSV({ data: this.currentDataSet || [] }),
            this.convertArrayOfObjectsToCSV({ data: this.runAverages || [] }),
            this.convertArrayOfObjectsToCSV({ data: this.userAverage ? [this.userAverage] : [] })
        ].filter(Boolean);
        if (!sections.length) {
            return;
        }
        this.saveBlob(sections.join('\n\n'), `${this.info.alias}-data-csv.csv`, 'text/csv;charset=utf-8');
    }

    private createSessionId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    private saveBlob(contents: string, filename: string, type: string) {
        const url = URL.createObjectURL(new Blob([contents], { type }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
}

function calcDpi(w, h, d, opt) {
    w = w > 0 ? w : 1;
    h = h > 0 ? h : 1;
    opt = opt || 'd';
    const dpi = (opt === 'd' ? Math.sqrt(w * w + h * h) : opt === 'w' ? w : h) / d;
    return dpi > 0 ? Math.round(dpi) : 0;
}
