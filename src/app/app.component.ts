import {Component} from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-root',
  template: `
  <router-outlet></router-outlet>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

}
