import {Component, OnInit} from '@angular/core';
import { AppService } from '../app.service';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-info',
  templateUrl: 'info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {
    participantTypes = [
        { id: 'yourself', text: 'Yourself' },
        { id: 'someone-like-you', text: 'Someone like you'},
        { id: 'someone-like-you', text: 'Someone NOT like you' },
        { id: 'optional-particpant', text: 'Optional Particpant' }
    ];
    deviceTypes = [
        'mouse',
        'touchpad',
        'phone touchscreen',
        'tablet touchscreen',
        'laptop touchscreen',
        'other'
    ];
    experienceTypes = [
        '1=Never used this pointing device before today',
        '2=Used a device like this in the past, but not in the last year',
        '3=Have used this pointing device occasionally in the last year',
        '4=Use this pointing device frequently (at least once a week) but not every time',
        '5=This is the main kind of pointing device I use (use every day)'
    ];
    info = {
        name: '',
        alias: '',
        type: '',
        device: '',
        deviceDetails: '',
        experience:'',
        deviceDiagonal: ''
    };
    constructor(private appService: AppService, private router: Router) {}
    ngOnInit() {
    }
    demo() {
        const dpi = this.appService.calculateDPI(this.info.deviceDiagonal);
        this.appService.info = this.info;
        this.router.navigate(['/demo']);
    }
    next() {
        const dpi = this.appService.calculateDPI(this.info.deviceDiagonal);
        this.appService.info = this.info;
        this.router.navigate(['/test']);
    }
}
