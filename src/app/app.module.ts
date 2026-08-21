import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { AppRoutingModule } from './app.routing';
import { FittsTestComponent } from './fitts-test/fitts-test.component';
import { InfoComponent } from './info/info.component';
import { AppService } from './app.service';
import { AuthGuard, ResultsGuard } from './auth.guard';
import { ResultsComponent } from './results/results.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FittsTestComponent,
    InfoComponent,
    ResultsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    AppService,
    AuthGuard,
    ResultsGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
