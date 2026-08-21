import { Component, signal } from '@angular/core';
import { SessionType } from './session-result';

export type WorkflowStage = 'home' | 'info' | 'test' | 'results';

@Component({
  standalone: false,
  selector: 'app-root',
  template: `
    <app-home *ngIf="stage() === 'home'" (continue)="showInfo()"></app-home>
    <app-info *ngIf="stage() === 'info'" (sessionSelected)="startSession($event)"></app-info>
    <app-fitts-test
      *ngIf="stage() === 'test'"
      [sessionType]="sessionType()"
      (viewResults)="showResults()">
    </app-fitts-test>
    <app-results *ngIf="stage() === 'results'"></app-results>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly stage = signal<WorkflowStage>('home');
  readonly sessionType = signal<SessionType>('formal');

  showInfo() {
    this.stage.set('info');
  }

  startSession(sessionType: SessionType) {
    this.sessionType.set(sessionType);
    this.stage.set('test');
  }

  showResults() {
    this.stage.set('results');
  }
}
