import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

const labelMaps = {
    'type': 'Participant Type',
    'radius': 'Size'
};

@Component({
    standalone: false,
    selector: 'app-results',
    templateUrl: 'results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {
    // tslint:disable 
    runAverages = [];
    userAverage = null;
    userInfoPairs = [];
    userAveragePairs = [];
    runInfoPairs = [];
    isMobile = false;
    constructor(private appService: AppService) { }
    ngOnInit() {
        this.isMobile = this.appService.isMobile();
        this.runAverages = this.appService.runAverages;
        this.userAverage = this.appService.userAverage;
        const userAverageKeys = Object.keys(this.userAverage);
        const userAverageData = userAverageKeys.map(key => {
            let value = this.userAverage[key];
            if (key.indexOf('Percentage') !== -1) {
                value = (Math.round(value * 100)) / 100;
                value = `${value} %`;
            }
            if (key.indexOf('Ticks') !== -1) {
                value = (Math.round(value * 100)) / 100;
                value = `${value} ms`;
            }
            if (key.indexOf('radius') !== -1) {
                value = `${value} cm`;
            }
            return {
                key: key, value: value,
                label: labelMaps[key] ? labelMaps[key] : this.getLabel(key)
            }
        });
        const userKeys = ['name', 'alias', 'type', 'device', 'deviceDetails', 'experience', 'deviceDiagonal'];
        this.userInfoPairs = userAverageData.filter(pair => userKeys.includes(pair.key));
        this.userAveragePairs = userAverageData.filter(pair => !userKeys.includes(pair.key));

        this.runAverages.forEach(run => {
            const userRunKeys = Object.keys(run);
            const userRunData = userRunKeys.map(key => {
                let value = run[key];
                if (key.indexOf('Percentage') !== -1) {
                    value = (Math.round(value * 100)) / 100;
                    value = `${value} %`;
                }
                if (key.indexOf('Ticks') !== -1) {
                    value = (Math.round(value * 100)) / 100;
                    value = `${value} ms`;
                }
                if (key.indexOf('radius') !== -1) {
                    value = `${value} cm`;
                }
                return {
                    key: key, value: value,
                    label: labelMaps[key] ? labelMaps[key] : this.getLabel(key)
                }
            });
            const runData = userRunData.filter(pair => !userKeys.includes(pair.key));
            this.runInfoPairs.push(runData);
        })
    }
    getLabel(key: string) {
        return key.replace(/([A-Z])/g, ' $1')
        .replace(/^./, function(str){ return str.toUpperCase(); });
    }
    downloadData() {
        this.appService.downloadData();
    }
    downloadCSVData() {
        this.appService.downloadCSVData();
    }
}
