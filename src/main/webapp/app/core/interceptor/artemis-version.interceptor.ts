import { ApplicationRef, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { concat, EMPTY, interval, Observable } from 'rxjs';
import { catchError, first, tap, timeout } from 'rxjs/operators';
import { ARTEMIS_VERSION_HEADER, VERSION } from 'app/app.constants';
import { ArtemisServerDateService } from 'app/shared/server-date.service';
import { SwUpdate } from '@angular/service-worker';
import { Alert, AlertService } from 'app/core/util/alert.service';

@Injectable()
export class ArtemisVersionInterceptor implements HttpInterceptor {
    // The currently displayed alert
    private alert: Alert;
    // Indicates whether we ever saw an outdated state since last reload
    private hasSeenOutdatedInThisSession = false;

    constructor(private appRef: ApplicationRef, private updates: SwUpdate, private serverDateService: ArtemisServerDateService, private alertService: AlertService) {
        // Allow the app to stabilize first, before starting
        // polling for updates with `interval()`.
        const appIsStableOrTimeout = appRef.isStable.pipe(
            first((isStable) => isStable === true),
            // Sometimes, the application does not become stable apparently.
            // This is a workaround. Using the same timeout as the service worker as well.
            // TODO: Look for the cause why the app doesn't become stable
            timeout(30000),
            // Ignore error thrown by timeout
            catchError(() => EMPTY),
        );
        const updateInterval = interval(60 * 1000); // every 60s
        const updateIntervalOnceAppIsStable$ = concat(appIsStableOrTimeout, updateInterval);

        updateIntervalOnceAppIsStable$.subscribe(() => this.checkForUpdates(false));
    }

    intercept(request: HttpRequest<any>, nextHandler: HttpHandler): Observable<HttpEvent<any>> {
        return nextHandler.handle(request).pipe(
            tap((response) => {
                if (response instanceof HttpResponse) {
                    const isTranslationStringsRequest = response.url?.includes('/i18n/');
                    const serverVersion = response.headers.get(ARTEMIS_VERSION_HEADER);
                    if (VERSION && serverVersion && VERSION !== serverVersion && !isTranslationStringsRequest) {
                        // Version mismatch detected. Let SW look for updates, and show banner in any case!
                        this.checkForUpdates(true);
                    }

                    // only invoke the time call if the call was not already the time call to prevent recursion here
                    if (!request.url.includes('time')) {
                        this.serverDateService.updateTime();
                    }
                }
            }),
        );
    }

    /**
     * Tells the service worker to check for updates and display an update alert if an update is available.
     * This is either exactly when
     * - this method is called from an intercepted http request that identified a version mismatch, or
     * - if the service worker detects an update, or
     * - if any of these conditions were ever true since the app loaded (aka last reload)
     *
     * @param overrideCheckResult true if the result of the sw update check should be ignored; false otherwise
     * @private
     */
    private checkForUpdates(overrideCheckResult: boolean) {
        // first update the service worker
        this.updates.checkForUpdate().then((updateAvailable: boolean) => {
            if (this.hasSeenOutdatedInThisSession || updateAvailable || overrideCheckResult) {
                this.hasSeenOutdatedInThisSession = true;

                // Close previous alert to avoid duplicates
                this.alert?.close!();

                // Show fresh alert without timeout and store it for later rerun of this method
                this.alert = this.alertService.addAlert({
                    type: 'info',
                    message: 'artemisApp.outdatedAlert',
                    action: {
                        label: 'artemisApp.outdatedAction',
                        callback: () =>
                            // Apply the update
                            this.updates
                                .activateUpdate()
                                // Ignore any error. Any error happening here doesn't matter
                                // If we reach this point, we want to load an update
                                // so in any case, we should reload
                                .catch(() => {})
                                // Reload the page with the new version
                                .then(() => document.location.reload()),
                    },
                });
            }
        });
    }
}
