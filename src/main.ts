import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  const configuredBasePath = new URL(document.baseURI).pathname;
  const basePath = configuredBasePath.endsWith('/') ? configuredBasePath : `${configuredBasePath}/`;
  if (window.location.pathname !== basePath || window.location.search || window.location.hash) {
    window.location.replace(basePath);
    return;
  }
  platformBrowserDynamic().bootstrapModule(AppModule);
});
