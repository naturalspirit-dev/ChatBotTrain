
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { ApplicationRef, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';
import { switchMap, interval, concat, first } from 'rxjs';
import { PwaUpdateSnackbarComponent } from '../components/utilities/pwa-update-snackbar/pwa-update-snackbar.component';

/**
 * Update PWA service for letting users know about new update is available
 */
@Injectable({
  providedIn: 'root'
})
export class UpdatePwaService {

  constructor(
    appRef: ApplicationRef,
    private swUpdate: SwUpdate,
    private snackbar: MatSnackBar) {
    if (swUpdate.isEnabled) {
      // Allow the app to stabilize first, before starting
      // polling for updates with `interval()`.
      const appIsStable$ = appRef.isStable.pipe(first(isStable => isStable === true));
      const everySixHours$ = interval(5 * 60 * 1000);
      const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

      everySixHoursOnceAppIsStable$.subscribe(() => swUpdate.checkForUpdate());
    }
  }

  public checkForUpdates(): void {
    this.swUpdate.versionUpdates.subscribe(evt => {
      switch (evt.type) {

        case 'VERSION_DETECTED':
          console.log(`Downloading new app version`);
          break;

        case 'VERSION_READY':
          this.snackbar.openFromComponent(PwaUpdateSnackbarComponent, {
            duration: -1
          });
          break;

        case 'VERSION_INSTALLATION_FAILED':
          this.snackbar.openFromComponent(PwaUpdateSnackbarComponent, {
            duration: -1
          });
          break;
      }
    });
  }
}