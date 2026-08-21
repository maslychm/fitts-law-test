import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    @Output() continue = new EventEmitter<void>();
}
