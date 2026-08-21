import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash-es';
import { AppService } from '../app.service';

@Component({
    standalone: false,
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    constructor(private appService: AppService) { }

    ngOnInit() {
        if (!_.isEmpty(window.location.search)) {
            const params = window.location.search;
            if (params.indexOf('debugRun') !== -1) {
                const queryVar: any = getQueryVariable('debugRun');
                if (queryVar) {
                    this.appService.debugModeTurns = parseInt(queryVar as string, 10);
                }
            }
        }
    }

}

function getQueryVariable(variable) {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        if (pair[0] === variable) { return pair[1]; }
    }
    return null;
}
