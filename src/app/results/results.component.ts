import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { METRIC_COLUMNS, PARTICIPANT_COLUMNS, RUN_COLUMNS, SummaryPair, toSummaryPairs } from '../summary';

@Component({
    standalone: false,
    selector: 'app-results',
    templateUrl: 'results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {
    userInfoPairs: SummaryPair[] = [];
    userAveragePairs: SummaryPair[] = [];
    runInfoPairs: SummaryPair[][] = [];

    constructor(private appService: AppService) { }

    ngOnInit() {
        this.userInfoPairs = toSummaryPairs(this.appService.info || {}, PARTICIPANT_COLUMNS);
        this.userAveragePairs = toSummaryPairs(this.appService.userAverage || {}, METRIC_COLUMNS);
        this.runInfoPairs = this.appService.runAverages.map(run =>
            toSummaryPairs(run, [...RUN_COLUMNS, ...METRIC_COLUMNS]));
    }

    downloadSummaryCsv() {
        this.appService.downloadSummaryCsv();
    }
}
