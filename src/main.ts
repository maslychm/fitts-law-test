import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {redirectToRoot} from './root-redirect';

if (environment.production) {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  if (redirectToRoot()) {
    return;
  }
  platformBrowserDynamic().bootstrapModule(AppModule);
});
