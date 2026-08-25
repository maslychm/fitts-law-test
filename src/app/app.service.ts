import { Injectable } from '@angular/core';
import { createSummaryCsv } from './summary';

declare const MobileDetect: any;

@Injectable()
export class AppService {
    info = null;
    md = null;
    runAverages = [];
    userAverage = {};
    dpi = null;

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

    downloadSummaryCsv() {
        const csv = createSummaryCsv(this.info || {}, this.runAverages || [], this.userAverage || {});
        this.saveBlob(csv, `${this.info.participantId}-summary.csv`, 'text/csv;charset=utf-8');
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
