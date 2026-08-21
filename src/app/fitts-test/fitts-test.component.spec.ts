import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppService } from '../app.service';
import { FittsTestComponent } from './fitts-test.component';

class FakeAppService {
    info = {
        name: 'Test Participant',
        alias: 'tester',
        type: 'Yourself',
        device: 'mouse',
        deviceDetails: 'test device',
        experience: '5=Daily',
        deviceDiagonal: 24
    };
    debugModeTurns: number | null = null;
    dpi = 96;
    currentDataSet = [];
    practiceDataSet = [];
    runAverages = [];
    userAverage = {};
    saveSession = vi.fn(() => Promise.resolve());
    isMobile() { return false; }
    getPixels(cmValue: number) { return this.dpi * (cmValue / 2.54); }
    createSession(...args: any[]) { return { args }; }
    downloadData() { }
    downloadCSVData() { }
}

describe('FittsTestComponent screen flow', () => {
    let fixture: ComponentFixture<FittsTestComponent>;
    let component: FittsTestComponent;
    let appService: FakeAppService;

    beforeEach(async () => {
        vi.useFakeTimers();
        appService = new FakeAppService();
        await TestBed.configureTestingModule({
            declarations: [FittsTestComponent],
            imports: [CommonModule, RouterModule.forRoot([])],
            providers: [
                { provide: AppService, useValue: appService },
                { provide: ActivatedRoute, useValue: { snapshot: { data: { sessionType: 'demo' } } } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(FittsTestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.usesTouchEvents = false;
    });

    afterEach(() => {
        fixture.destroy();
        vi.useRealTimers();
    });

    async function settle() {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        fixture.detectChanges();
    }

    async function advanceCountdown() {
        for (const expected of [2, 1]) {
            await vi.advanceTimersByTimeAsync(1000);
            await settle();
            expect(component.countdownTick()).toBe(expected);
        }
        await vi.advanceTimersByTimeAsync(1000);
        await settle();
    }

    function clickActiveTarget() {
        const target = fixture.nativeElement.querySelector('.fitt-circle.active') as SVGElement;
        expect(target).toBeTruthy();
        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    it('moves from practice countdown to the clicking task and completes after 15 hits', async () => {
        expect(fixture.nativeElement.textContent).toContain('You must do a practice run first');

        const begin = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        begin.click();
        await settle();
        expect(component.screen()).toBe('countdown');
        expect(component.countdownTick()).toBe(3);

        await advanceCountdown();
        expect(component.screen()).toBe('running');
        expect(fixture.nativeElement.querySelector('.overlay')).toBeNull();

        const workArea = fixture.nativeElement.querySelector('.work-area') as HTMLElement;
        workArea.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(component.clickCounter).toBe(0);
        expect(component.currentDataSet).toHaveLength(1);

        for (let hit = 0; hit < 15; hit += 1) {
            clickActiveTarget();
        }
        await settle();

        expect(component.screen()).toBe('run-complete');
        expect(fixture.nativeElement.textContent).toContain('Test is complete');
        expect(component.practiceDataSet).toHaveLength(16);
    });

    it('preserves the completion-first flow through the final demo result', async () => {
        component.beginPractice();
        await advanceCountdown();
        for (let hit = 0; hit < 15; hit += 1) {
            clickActiveTarget();
        }
        await settle();

        component.nextStepInTest();
        await settle();
        expect(component.screen()).toBe('run-intro');
        expect(component.currentTestCount).toBe(1);

        component.startTest();
        await advanceCountdown();
        for (let hit = 0; hit < 15; hit += 1) {
            clickActiveTarget();
        }
        await settle();
        expect(component.screen()).toBe('run-complete');

        component.nextStepInTest();
        await settle();
        expect(component.screen()).toBe('session-complete');
        expect(component.saveStatus()).toBe('saved');
        expect(fixture.nativeElement.textContent).toContain('Session saved to the local results file.');
        expect(fixture.nativeElement.textContent).toContain('View Summary');
        expect(appService.saveSession).toHaveBeenCalledOnce();
    });

    it('renders a failed asynchronous save without leaving the completion screen', async () => {
        appService.saveSession.mockRejectedValueOnce(new Error('disk full'));

        (component as any).persistSession({});
        await settle();

        expect(component.saveStatus()).toBe('error');
        expect(component.saveMessage()).toContain('Local save failed');
    });
});
