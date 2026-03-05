import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { TuiRoot } from '@taiga-ui/core';
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify';
import { provideMarkdown } from 'ngx-markdown';
import { provideHighcharts, providePartialHighcharts } from 'highcharts-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideMarkdown(),
    provideEventPlugins(),
    provideHighcharts(),
    providePartialHighcharts({ modules: () => [
      import('highcharts/esm/modules/map'),
      import('highcharts/esm/modules/tiledwebmap')
    ],}),
  ],
};
