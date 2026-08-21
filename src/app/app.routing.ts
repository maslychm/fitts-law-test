import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FittsTestComponent } from './fitts-test/fitts-test.component';
import { InfoComponent } from './info/info.component';
import { AuthGuard, ResultsGuard } from './auth.guard';
import { ResultsComponent } from './results/results.component';

const appRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent, data: { uid: 1000 } },
    { path: 'test', component: FittsTestComponent, data: { uid: 2000, sessionType: 'formal' }, canActivate: [AuthGuard] },
    { path: 'info', component: InfoComponent, data: { uid: 3000 } },
    { path: 'results', component: ResultsComponent, data: { uid: 4000 }, canActivate: [ResultsGuard] },
    { path: 'demo', component: FittsTestComponent, data: { uid: 5000, sessionType: 'demo' }, canActivate: [AuthGuard] },
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes)
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }
