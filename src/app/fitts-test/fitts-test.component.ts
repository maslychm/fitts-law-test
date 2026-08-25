import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import * as d3 from 'd3';
import { AppService } from '../app.service';
import { SessionType } from '../session-type';
declare var DocumentTouch: any;

export class Coordinate {
    x = 0;
    y = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class DataItem {
    direction: Direction;
    sourceIndex: number;
    ticks: number;
    targetHit: boolean;
    angle: Clock;
    timestamp: string;
    run: string;
    radius: number;
    distance: number;
}

export class DataAverage {
    run: string;
    radius: number;
    distance: number;
    averageTicks: number;
    averageVerticalTicks: number;
    averageHorizontalTicks: number;
    averageOtherTicks: number;
    hits;
    misses;
    verticalHits;
    verticalMisses;
    horizontalHits;
    horizontalMisses;
    otherHits;
    otherMisses;
    hitPercentage;
    missPercentage;
    verticalHitPercentage;
    verticalMissPercentage;
    horizontalHitPercentage;
    horizontalMissPercentage;
    otherDirectionHitPercentage;
    otherDirectionMissPercentage;
}
export class UserAverage {
    averageTicks: number;
    averageVerticalTicks: number;
    averageHorizontalTicks: number;
    averageOtherTicks: number;
    hits;
    misses;
    verticalHits;
    verticalMisses;
    horizontalHits;
    horizontalMisses;
    otherHits;
    otherMisses;
    hitPercentage;
    missPercentage;
    verticalHitPercentage;
    verticalMissPercentage;
    horizontalHitPercentage;
    horizontalMissPercentage;
    otherDirectionHitPercentage;
    otherDirectionMissPercentage;
}

export enum Direction {
    Horizontal = 'Horizontal',
    Vertical = 'Vertical',
    Diagonal = 'Diagonal',
    Other = 'Other',
    None = '-'
}

export enum Clock {
    clockwise = 'Clockwise',
    antiClockwise = 'Anti-Clockwise'
}

function mean(values: number[]): number {
    return values.length
        ? values.reduce((total, value) => total + value, 0) / values.length
        : Number.NaN;
}

export type TestScreen =
    'practice-intro' |
    'countdown' |
    'running' |
    'run-complete' |
    'run-intro' |
    'session-complete';

export class Config {
    radiusCM;
    distanceCM;
    radiusPX;
    distancePX;
}

@Component({
    standalone: false,
    selector: 'app-fitts-test',
    templateUrl: './fitts-test.component.html',
    styleUrls: ['./fitts-test.component.scss']
})
export class FittsTestComponent implements AfterViewInit, OnDestroy, OnInit {
    @Input() sessionType: SessionType = 'formal';
    @Output() viewResults = new EventEmitter<void>();
    workAreaId = 'work-area' + Math.floor(Math.random() * 10e6);
    svgAreaId = 'svg-work-area' + Math.floor(Math.random() * 10e6);
    currentRadius = 50;
    // Keep antialiased circle edges inside the SVG viewport; all centers are offset equally so test geometry is unchanged.
    readonly svgPadding = 1;
    baseRadius = null;
    svgElem;
    dim;
    pageCenter;
    fittCircles: Array<d3.Selection<any, any, any, any>> = [];
    color = '#3498db';
    testInProgress = false;
    currentIndexActive = null;
    dir = 1;
    clickCounter = 0;
    isPracticeRun = true;
    screen = signal<TestScreen>('practice-intro');
    isMobile = false;
    currentPerformanceTick = null;
    currentDataSet: Array<DataItem | any> = [];
    overallDataSet: Array<DataItem | any> = [];
    overallAverages: Array<DataAverage | any> = [];
    currentTestCount = -1;
    maxTicks = 3;
    countdownTick = signal(this.maxTicks);
    countdownInterval: number | null = null;
    usesTouchEvents = false;
    userInfo = null;
    maxTests = 0;
    dimIndex = 0;
    desktopConfigs = [
        [0.25, 3.50], [0.25, 4.50], [0.25, 8.5], [0.25, 10.5],
        [0.50, 4], [0.50, 5], [0.5, 9], [0.5, 11],
        [0.75, 5.50], [0.75, 7.5], [0.75, 9.5], [0.75, 10.5],
        [1, 8], [1, 9], [1, 10], [1, 12]
    ];
    phoneConfigs = [
        [0.25, 2.50], [0.25, 3.50], [0.25, 4.00], [0.25, 4.50],
        [0.33, 2.80], [0.33, 3.80], [0.33, 4.30], [0.33, 4.80],
        [0.40, 2.80], [0.40, 3.80], [0.40, 4.30], [0.40, 4.80],
        [0.50, 3.5], [0.50, 4], [0.50, 4.5], [0.50, 5]
    ];
    runConfigurations: Array<Config> = [];
    defaultPraticeIndex = 7;
    constructor(private appService: AppService) { }
    ngAfterViewInit() {
        this.dim = this.getSquareDimension();
        this.processCurrentRadius();
        this.checkDimensions();
    }
    ngOnInit() {
        this.isMobile = this.appService.isMobile();
        this.usesTouchEvents = this.checkTouchSupport();
        if (this.isMobile) {
            this.runConfigurations = this.phoneConfigs.map(x => {
                return {
                    radiusCM: x[0],
                    distanceCM: x[1],
                    radiusPX: this.appService.getPixels(x[0]),
                    distancePX: this.appService.getPixels(x[1])
                };
            });
        } else {
            this.runConfigurations = this.desktopConfigs.map(x => {
                return {
                    radiusCM: x[0],
                    distanceCM: x[1],
                    radiusPX: this.appService.getPixels(x[0]),
                    distancePX: this.appService.getPixels(x[1])
                };
            });
        }
        if (this.sessionType === 'demo') {
            this.maxTests = 1;
        } else {
            this.maxTests = this.runConfigurations.length;
        }
        this.userInfo = this.appService.info;
    }
    ngOnDestroy() {
        this.clearCountdown();
    }
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.usesTouchEvents) {
            this.processPointerEvent(event);
        }
    }
    @HostListener('document:touchstart', ['$event'])
    onDocumentTouchStart(event: TouchEvent) {
        if (this.usesTouchEvents) {
            this.processPointerEvent(event);
        }
    }
    private processPointerEvent(event: Event) {
        if (!this.testInProgress) {
            return;
        }
        const now = performance.now();
        const dir = this.dir;
        const lastCircleIndex = this.currentIndexActive;
        let correctClick = false;
        const elem = event.target;
        if (elem instanceof Element && elem.classList.contains('fitt-circle') && elem.classList.contains('active')) {
            correctClick = true;
            if (this.dir === 1 && (this.currentIndexActive + this.dir) > this.fittCircles.length - 1) {
                this.dir = -1;
                this.currentIndexActive += this.dir;
            } else if (this.dir === -1 && (this.currentIndexActive + this.dir) < 0) {
                this.dir = 1;
                this.currentIndexActive += this.dir;
            } else {
                this.currentIndexActive += this.dir;
            }
            this.activateCircle(this.currentIndexActive);
            this.clickCounter += 1;
        } else {
            this.highlightCurrentCircleAsIncorrect();
        }
        this.processClick(correctClick, lastCircleIndex, now, dir);
        this.checkForTestSession();
    }
    checkTouchSupport() {
        if (('ontouchstart' in window) || (window as any).DocumentTouch && document instanceof DocumentTouch) {
            return true;
        }
        return false;
    }
    beginPractice() {
        this.isPracticeRun = true;
        this.screen.set('countdown');
        this.countdownTick.set(this.maxTicks);
        this.pickRadius();
        this.layoutCurrentCircles();
        this.startCountdown();
    }
    processCurrentRadius() {
        this.pickRadius();
        this.svgElem = document.getElementById(this.svgAreaId);
        const width = this.dim + (this.svgPadding * 2);
        const height = this.dim + (this.svgPadding * 2);
        d3.select(this.svgElem).attr('width', width);
        d3.select(this.svgElem).attr('height', height);
        this.layoutCurrentCircles();
    }
    pickRadius() {
        if (this.isPracticeRun) {
            this.dimIndex = this.defaultPraticeIndex;
        } else {
            this.dimIndex = this.currentTestCount - 1;
        }
        const config = this.runConfigurations[this.dimIndex];
        this.currentRadius = config.radiusPX;
        this.dim = config.distancePX;
        this.baseRadius = (this.dim - (this.currentRadius * 2)) * 0.5;
        const width = this.dim;
        const height = this.dim;
        this.pageCenter = new Coordinate(width / 2, height / 2);
    }
    startTest() {
        this.isPracticeRun = false;
        this.screen.set('countdown');
        this.countdownTick.set(this.maxTicks);
        this.processCurrentRadius();
        this.checkDimensions();
        this.startCountdown();
    }
    private startCountdown() {
        this.clearCountdown();
        this.countdownInterval = window.setInterval(() => {
            this.countdownTick.update(tick => tick - 1);
            if (this.countdownTick() <= 0) {
                this.clearCountdown();
                this.screen.set('running');
                this.setupClickTest();
            }
        }, 1000);
    }
    private clearCountdown() {
        if (this.countdownInterval !== null) {
            window.clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    checkDimensions() {
        let works = true;
        if (!this.isMobile) {
            works = this.dim < window.innerHeight;
        } else {
            works = this.dim < window.innerWidth;
        }
        return works;
    }
    layoutCurrentCircles() {
        this.fittCircles.forEach(c => (c as d3.Selection<any, any, any, any>).remove());
        this.fittCircles = [];
        d3.select('.fitt-circle').remove();
        const circleCoordinates = this.getCurrentCircleCoordinates();
        circleCoordinates.forEach((c, i) => {
            const circle = d3.select(this.svgElem)
                .append('circle')
                .attr('class', 'fitt-circle')
                .attr('id', `fitt-circle-${i}`)
                .attr('cx', c.x)
                .attr('cy', c.y)
                .attr('r', this.currentRadius)
                .attr('fill', 'rgba(0,0,0,0.05)')
                ;
            this.fittCircles.push(circle);
        });
    }
    getCurrentCircleCoordinates() {
        const angle = 45;
        const hypontenuse = this.baseRadius;
        const xIntercept = hypontenuse * Math.cos(this.toRadians(angle));
        const yIntercept = hypontenuse * Math.sin(this.toRadians(angle));
        const pageCenter = this.pageCenter;

        const circleCoordinates = [
            new Coordinate(this.dim / 2, this.currentRadius),
            new Coordinate(this.dim / 2, this.dim - this.currentRadius),
            new Coordinate(pageCenter.x + xIntercept, pageCenter.y - yIntercept),
            new Coordinate(pageCenter.x - xIntercept, pageCenter.y + yIntercept),
            new Coordinate(this.dim - this.currentRadius, this.dim / 2),
            new Coordinate(this.currentRadius, this.dim / 2),
            new Coordinate(pageCenter.x + xIntercept, pageCenter.y + yIntercept),
            new Coordinate(pageCenter.x - xIntercept, pageCenter.y - yIntercept)
        ];
        return circleCoordinates.map(coordinate => new Coordinate(
            coordinate.x + this.svgPadding,
            coordinate.y + this.svgPadding
        ));
    }
    setupClickTest() {
        this.currentDataSet = [];
        if (this.currentIndexActive === null) {
            this.testInProgress = true;
            this.currentIndexActive = 0;
            this.currentPerformanceTick = performance.now();
        }
        this.activateCircle(this.currentIndexActive);

    }
    clearTest() {
        this.clickCounter = 0;
        this.currentIndexActive = -1;
        this.activateCircle(this.currentIndexActive);
        this.currentIndexActive = null;
        this.currentPerformanceTick = null;
        this.screen.set('run-complete');
        if (!this.isPracticeRun) {
            this.calculateCurrentAverage();
            this.overallDataSet = this.overallDataSet.concat(this.currentDataSet);
        }
        this.currentDataSet = [];
    }
    calculateCurrentAverage() {
        const average = new DataAverage();
        average.run = (this.currentDataSet as Array<DataItem>)[0].run;
        const config = this.runConfigurations[this.dimIndex];
        average.radius = config.radiusCM * 2;
        average.distance = config.distanceCM - (2 * config.radiusCM);
        const hitTicks = (this.currentDataSet as Array<DataItem>).filter(x => x.targetHit);
        const missTicks = (this.currentDataSet as Array<DataItem>).filter(x => !x.targetHit);
        const verticalHits = hitTicks.filter(t => t.direction === Direction.Vertical);
        const verticalMisses = missTicks.filter(t => t.direction === Direction.Vertical);
        const horizontalHits = hitTicks.filter(t => t.direction === Direction.Horizontal);
        const horizontalMisses = missTicks.filter(t => t.direction === Direction.Horizontal);
        const otherHits = hitTicks.filter(t => t.direction === Direction.Other);
        const otherMisses = missTicks.filter(t => t.direction === Direction.Other);
        average.averageTicks = mean(hitTicks.map(t => t.ticks));
        average.averageVerticalTicks = mean(verticalHits.map(t => t.ticks));
        average.averageHorizontalTicks = mean(horizontalHits.map(t => t.ticks));
        average.averageOtherTicks = mean(otherHits.map(t => t.ticks));
        average.hits = hitTicks.length;
        average.misses = missTicks.length;
        average.verticalHits = verticalHits.length;
        average.verticalMisses = verticalMisses.length;
        average.horizontalHits = horizontalHits.length;
        average.horizontalMisses = horizontalMisses.length;
        average.otherHits = otherHits.length;
        average.otherMisses = otherMisses.length;
        average.hitPercentage = (hitTicks.length / (hitTicks.length + missTicks.length)) * 100;
        average.missPercentage = (missTicks.length / (hitTicks.length + missTicks.length)) * 100;
        average.verticalHitPercentage = (verticalHits.length / (verticalHits.length + verticalMisses.length)) * 100;
        average.verticalMissPercentage = (verticalMisses.length / (verticalHits.length + verticalMisses.length)) * 100;
        average.horizontalHitPercentage = (horizontalHits.length / (horizontalHits.length + horizontalMisses.length)) * 100;
        average.horizontalMissPercentage = (horizontalMisses.length / (horizontalHits.length + horizontalMisses.length)) * 100;
        average.otherDirectionHitPercentage = (otherHits.length / (otherHits.length + otherMisses.length)) * 100;
        average.otherDirectionMissPercentage = (otherMisses.length / (otherHits.length + otherMisses.length)) * 100;
        const averageObj = {
            run: average.run,
            radius: average.radius,
            distance: average.distance,
            averageTicks: average.averageTicks,
            averageVerticalTicks: average.averageVerticalTicks,
            averageHorizontalTicks: average.averageHorizontalTicks,
            averageOtherTicks: average.averageOtherTicks,
            hits: average.hits,
            misses: average.misses,
            verticalHits: average.verticalHits,
            verticalMisses: average.verticalMisses,
            horizontalHits: average.horizontalHits,
            horizontalMisses: average.horizontalMisses,
            otherHits: average.otherHits,
            otherMisses: average.otherMisses,
            hitPercentage: average.hitPercentage,
            missPercentage: average.missPercentage,
            verticalHitPercentage: average.verticalHitPercentage,
            verticalMissPercentage: average.verticalMissPercentage,
            horizontalHitPercentage: average.horizontalHitPercentage,
            horizontalMissPercentage: average.horizontalMissPercentage,
            otherDirectionHitPercentage: average.otherDirectionHitPercentage,
            otherDirectionMissPercentage: average.otherDirectionMissPercentage
        };
        this.overallAverages.push(averageObj);
    }
    calculateOverallUserAverage() {
        const average = new UserAverage();
        const hitTicks = (this.overallDataSet as Array<DataItem>).filter(x => x.targetHit);
        const missTicks = (this.overallDataSet as Array<DataItem>).filter(x => !x.targetHit);
        const verticalHits = hitTicks.filter(t => t.direction === Direction.Vertical);
        const verticalMisses = missTicks.filter(t => t.direction === Direction.Vertical);
        const horizontalHits = hitTicks.filter(t => t.direction === Direction.Horizontal);
        const horizontalMisses = missTicks.filter(t => t.direction === Direction.Horizontal);
        const otherHits = hitTicks.filter(t => t.direction === Direction.Other);
        const otherMisses = missTicks.filter(t => t.direction === Direction.Other);
        average.averageTicks = mean(hitTicks.map(t => t.ticks));
        average.averageVerticalTicks = mean(verticalHits.map(t => t.ticks));
        average.averageHorizontalTicks = mean(horizontalHits.map(t => t.ticks));
        average.averageOtherTicks = mean(otherHits.map(t => t.ticks));
        average.hits = hitTicks.length;
        average.misses = missTicks.length;
        average.verticalHits = verticalHits.length;
        average.verticalMisses = verticalMisses.length;
        average.horizontalHits = horizontalHits.length;
        average.horizontalMisses = horizontalMisses.length;
        average.otherHits = otherHits.length;
        average.otherMisses = otherMisses.length;
        average.hitPercentage = (hitTicks.length / (hitTicks.length + missTicks.length)) * 100;
        average.missPercentage = (missTicks.length / (hitTicks.length + missTicks.length)) * 100;
        average.verticalHitPercentage = (verticalHits.length / (verticalHits.length + verticalMisses.length)) * 100;
        average.verticalMissPercentage = (verticalMisses.length / (verticalHits.length + verticalMisses.length)) * 100;
        average.horizontalHitPercentage = (horizontalHits.length / (horizontalHits.length + horizontalMisses.length)) * 100;
        average.horizontalMissPercentage = (horizontalMisses.length / (horizontalHits.length + horizontalMisses.length)) * 100;
        average.otherDirectionHitPercentage = (otherHits.length / (otherHits.length + otherMisses.length)) * 100;
        average.otherDirectionMissPercentage = (otherMisses.length / (otherHits.length + otherMisses.length)) * 100;
        const averageObj = {
            averageTicks: average.averageTicks,
            averageVerticalTicks: average.averageVerticalTicks,
            averageHorizontalTicks: average.averageHorizontalTicks,
            averageOtherTicks: average.averageOtherTicks,
            hits: average.hits,
            misses: average.misses,
            verticalHits: average.verticalHits,
            verticalMisses: average.verticalMisses,
            horizontalHits: average.horizontalHits,
            horizontalMisses: average.horizontalMisses,
            otherHits: average.otherHits,
            otherMisses: average.otherMisses,
            hitPercentage: average.hitPercentage,
            missPercentage: average.missPercentage,
            verticalHitPercentage: average.verticalHitPercentage,
            verticalMissPercentage: average.verticalMissPercentage,
            horizontalHitPercentage: average.horizontalHitPercentage,
            horizontalMissPercentage: average.horizontalMissPercentage,
            otherDirectionHitPercentage: average.otherDirectionHitPercentage,
            otherDirectionMissPercentage: average.otherDirectionMissPercentage
        };
        return averageObj;
    }
    nextStepInTest() {
        if (this.isPracticeRun) {
            this.isPracticeRun = false;
            this.currentTestCount = 1;
        } else {
            this.currentTestCount += 1;
        }
        if (this.currentTestCount <= this.maxTests) {
            this.screen.set('run-intro');
        } else {
            const average = this.calculateOverallUserAverage();
            this.appService.runAverages = this.overallAverages;
            this.appService.userAverage = average;
            this.screen.set('session-complete');
        }
    }
    checkForTestSession() {
        if (this.clickCounter > 14) {
            this.testInProgress = false;
            this.clearTest();
        }
    }
    activateCircle(index) {
        const fitt = this.fittCircles[this.currentIndexActive];
        if (fitt) {
            fitt.transition();
            fitt.attr('fill', 'rgba(0,0,0,0.05)');
        }
        this.fittCircles.forEach((x, i) => {
            if (i === index) {
                x.attr('fill', this.color);
                x.attr('class', 'fitt-circle active');
            } else {
                x.attr('fill', 'rgba(0,0,0,0.05)');
                x.attr('class', 'fitt-circle');
            }
        });
    }
    highlightCurrentCircleAsIncorrect() {
        const fitt = this.fittCircles[this.currentIndexActive];
        if (fitt) {
            fitt.attr('fill', '#e74c3c')
                .transition()
                .attr('fill', this.color);
        }
    }
    processClick(isCorrectClick, lastCircleIndex, now, dir) {
        const ticks = now - this.currentPerformanceTick;
        let direction = Direction.None;
        direction = this.getHitDirection(lastCircleIndex, dir);
        const dt = new Date();
        let radius = 0, distance = 0;
        const config = this.runConfigurations[this.dimIndex];
        radius = config.radiusCM;
        distance = config.distanceCM - (2 * radius);
        const item: DataItem | any = Object.assign({}, this.userInfo, {
            direction: direction,
            sourceIndex: lastCircleIndex,
            ticks: ticks,
            targetHit: isCorrectClick,
            angle: dir === 1 ? Clock.clockwise : Clock.antiClockwise,
            timestamp: `${dt.toDateString()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}:${dt.getMilliseconds()}`,
            run: `RUN #${this.currentTestCount}`,
            radius: radius * 2,
            distance: distance,
            phase: this.isPracticeRun ? 'practice' : this.sessionType
        });
        this.currentDataSet.push(item);
        if (isCorrectClick) {
            this.currentPerformanceTick = performance.now();
        }
    }
    getHitDirection(lastCircleIndex, dir) {
        let direction = Direction.Other;
        if (dir === 1) {
            switch (lastCircleIndex) {
                case 1: { direction = Direction.Vertical; break; }
                case 2: { direction = Direction.Other; break; }
                case 3: { direction = Direction.Diagonal; break; }
                case 4: { direction = Direction.Other; break; }
                case 5: { direction = Direction.Horizontal; break; }
                case 6: { direction = Direction.Other; break; }
                case 7: { direction = Direction.Diagonal; break; }
            }
        } else {
            switch (lastCircleIndex) {
                case 0: { direction = Direction.Vertical; break; }
                case 1: { direction = Direction.Other; break; }
                case 2: { direction = Direction.Diagonal; break; }
                case 3: { direction = Direction.Other; break; }
                case 4: { direction = Direction.Horizontal; break; }
                case 5: { direction = Direction.Other; break; }
                case 6: { direction = Direction.Diagonal; break; }
            }
        }
        return direction;
    }

    getSquareDimension() {
        let dim = 0;
        if (window.innerHeight > window.innerWidth) {
            dim = window.innerWidth - 0;
        } else {
            dim = window.innerHeight - 120;
        }
        return dim;
    }
    toRadians(angle) {
        return angle * (Math.PI / 180);
    }
}

