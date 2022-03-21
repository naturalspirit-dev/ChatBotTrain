
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

// Application specific imports.
import { Token } from '../models/token.model';
import { Status } from '../models/status.model';
import { Backend } from '../models/backend.model';
import { Endpoint } from '../models/endpoint.model';
import { Response } from 'src/app/models/response.model';
import { CoreVersion } from '../models/core-version.model';
import { environment } from 'src/environments/environment';
import { BackendsStorageService } from './backendsstorage.service';
import { AuthenticateResponse } from '../components/management/auth/models/authenticate-response.model';

/**
 * Keeps track of your backends and your currently selected backend.
 * 
 * This is your "goto service" when it comes to authentication, and manipulating your backends,
 * adding a new backend, changing your currently active backend, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private _authenticated: BehaviorSubject<boolean>;
  private _endpointsRetrieved: BehaviorSubject<boolean>;
  private _activeChanged: BehaviorSubject<Backend>;
  private _statusRetrieved: BehaviorSubject<Status>;
  private _versionRetrieved: BehaviorSubject<string>;

  /**
   * To allow consumers to subscribe to authentication status changes.
   */
  authenticatedChanged: Observable<boolean>;

  /**
   * To allow consumers to subscribe to active backend changed events.
   */
  activeBackendChanged: Observable<Backend>;

  /**
   * To allow consumers to subscribe when endpoints are retrieved.
   */
  endpointsFetched: Observable<boolean>;

  /**
   * To allow consumers to subscribe when endpoints are retrieved.
   */
  statusRetrieved: Observable<Status>;

  /**
   * To allow consumers to subscribe to version changes.
   */
  versionRetrieved: Observable<string>;

  /**
   * Creates an instance of your service.
   * 
   * @httpClient Needed to refresh JWT token for backends, logging in, and retrieving endpoints
   * @backendsListService List of all backends in system
   */
  constructor(
    private httpClient: HttpClient,
    private backendsStorageService: BackendsStorageService) {

    // Making sure we create refresh token timers for all backends and retrieve endpoints for active backend.
    if (this.backendsStorageService.backends.length > 0) {
      for (const idx of this.backendsStorageService.backends.filter(x => x.token)) {
        this.ensureRefreshJWTTokenTimer(idx);
      }
    }
    this._authenticated = new BehaviorSubject<boolean>(this.active !== null && this.active.token !== null);
    this.authenticatedChanged = this._authenticated.asObservable();

    this._endpointsRetrieved = new BehaviorSubject<boolean>(false);
    this.endpointsFetched = this._endpointsRetrieved.asObservable();

    this._activeChanged = new BehaviorSubject<Backend>(null);
    this.activeBackendChanged = this._activeChanged.asObservable();

    this._statusRetrieved = new BehaviorSubject<Status>(null);
    this.statusRetrieved = this._statusRetrieved.asObservable();

    this._versionRetrieved = new BehaviorSubject<string>(null);
    this.versionRetrieved = this._versionRetrieved.asObservable();

    // If we have an active backend we need to retrieve endpoints for it.
    if (this.active) {
      this.getEndpoints(this.active);

      // If user is root we'll need to retrieve status of active backend and its version.
      if (this.active.token && !this.active.token.expired && this.active.token.in_role('root')) {
        this.retrieveStatusAndVersion(this.active);
      }
    }
  }

  /**
   * Returns the currently active backend.
   */
  get active() {
    return this.backendsStorageService.active;
  }

  /**
   * Returns all backends.
   */
  get backends() {
    return this.backendsStorageService.backends;
  }

  /**
   * Upserts the specified backend.
   * 
   * @param value Backend to upsert
   */
  upsert(value: Backend) {
    if (this.backendsStorageService.upsert(value)) {
      this.getEndpoints(value);
    }
  }

  /**
   * Activates the specified backend.
   * 
   * @param value Backend to activate
   */
  activate(value: Backend) {
    this.backendsStorageService.activate(value);
    if (!value.access.fetched) {
      this.getEndpoints(value);
    }
    this._activeChanged.next(value);
  }

  /**
   * Removes specified backend from local storage and if it is the current 
   * backend changes the backend to the next available backend.
   * 
   * @param value Backend to remove
   */
  remove(value: Backend) {
    const activeChanged = value === this.active;
    this.backendsStorageService.remove(value);
    if (value.refreshTimer) {
      clearTimeout(value.refreshTimer);
      value.refreshTimer = null;
    }
    if (activeChanged) {
      this._activeChanged.next(this.active);
    }
  }

  /**
   * Fetches endpoints for current backend again.
   */
  refetchEndpoints() {
    this.getEndpoints(this.active);
  }

  /**
   * Authenticates user towards current backend.
   * 
   * @param username Username
   * @param password Password
   * @param storePassword Whether or not passsword should be persisted into local storage
   */
  login(username: string, password: string, storePassword: boolean) {
    return new Observable<AuthenticateResponse>(observer => {
      let query = '';
      if (username && username !== '') {
        query += '?username=' + encodeURIComponent(username);
        query += '&password=' + encodeURIComponent(password);
      }

      // Authenticating towards backend.
      this.httpClient.get<AuthenticateResponse>(
        this.active.url +
        '/magic/system/auth/authenticate' + query, {

          /*
           * Notice, if we're doing Windows automatic authentication,
           * we will not be given a username/password combination to this method, at which point
           * we'll have to make sure Angular passes in Windows credentials to endpoint.
           */
          withCredentials: query === '' ? true : false,

        }).subscribe({
          next: (auth: AuthenticateResponse) => {

            // Updating active backend.
            this.active.token = new Token(auth.ticket);
            if (storePassword) {
              this.active.password = password;
            } else {
              this.active.password = null;
            }
            this.backendsStorageService.persistBackends();
            this.ensureRefreshJWTTokenTimer(this.active);
            this.active.createAccessRights();
            this._authenticated.next(true);
            this.retrieveStatusAndVersion(this.active);

            // Done!
            observer.next(auth);
            observer.complete();
          },
          error: (error: any) => {
            observer.error(error);
            observer.complete();
          }});
    });
  }

  /**
   * Logs out the user from his currently active backend.
   * 
   * @param destroyPassword Whether or not password should be removed before persisting backend
   */
  logout(destroyPassword: boolean) {
    this.active.token = null;
    if (this.active.refreshTimer) {
      clearTimeout(this.active.refreshTimer);
      this.active.refreshTimer = null;
    }
    if (destroyPassword) {
      this.active.password = null;
    }
    this.backendsStorageService.persistBackends();
    this.active.createAccessRights();
    this._authenticated.next(false);
  }

  /**
   * Verifies validity of token by invoking backend.
   */
  verifyToken() {
    if (!this.active?.token) {
      return throwError(() => new Error('No token to verify'));
    }
    return this.httpClient.get<Response>(
      this.active.url +
      '/magic/system/auth/verify-ticket');
  }

  /**
   * Invokes specified backend to check if auto-auth has been turned on.
   * 
   * @param url URL of backend to check
   */
  autoAuth(url: string) {
    return this.httpClient.get<Response>(url.replace(/\s/g, '').replace(/(\/)+$/, '') + '/magic/system/auth/auto-auth');
  }

  /**
   * Changes currently logged in user's password.
   * 
   * @param password New password for user
   */
  changePassword(password: string) {
    return this.httpClient.put<Response>(
      this.active.url +
      '/magic/system/auth/change-password', { password });
  }

  /**
   * Invokes the backend to have a reset password email being sent to user.
   * 
   * @param username Username of user to generate the email for
   * @param frontendUrl URL of frontend to use to build reset-password email from
   */
  resetPassword(username: string, frontendUrl: string) {
    return this.httpClient.post<Response>(
      this.active.url +
      '/magic/system/auth/send-reset-password-link', {
      username,
      frontendUrl,
    });
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates a refresh timer for a single backend's JWT token.
   */
  private ensureRefreshJWTTokenTimer(backend: Backend) {

    if (backend.refreshTimer) {
      clearTimeout(backend.refreshTimer);
      backend.refreshTimer = null;
    }

    if (!backend.token) {
      return;
    }

    if (backend.token.exp) {
      if (backend.token.expired) {
        this.logoutFromBackend(backend);
      } else if (backend.token.expires_in < 60) {
        this.refreshJWTToken(backend);
      } else {
        backend.refreshTimer = setTimeout(() => {
          this.refreshJWTToken(backend);
        }, (backend.token.expires_in - 60) * 1000);
      }
    }
  }

  /*
   * Logs out from the specified backend.
   */
  private logoutFromBackend(backend: Backend) {
    if(!backend.token) {
      return; // No change
    }
    backend.token = null;
    this.backendsStorageService.persistBackends();
    backend.createAccessRights();
    if (this.active === backend) {
      this._authenticated.next(false);
    }
  }

  /*
   * Invoked when JWT token needs to be refreshed.
   */
  private refreshJWTToken(backend: Backend) {

    // Deleting old timer if existing.
    if (backend.refreshTimer) {
      clearTimeout(backend.refreshTimer);
      backend.refreshTimer = null;
    }

    // Ensuring user didn't logout after timer was created.
    if (!backend.token) {
      return;
    }

    // Ensuring token is still valid, and if not simply destroying it and returning early.
    if (backend.token.expired) {
      this.logoutFromBackend(backend);
      return;
    }

    // Invoking the refresh token method for backend.
    this.httpClient.get<AuthenticateResponse>(
      backend.url +
      '/magic/system/auth/refresh-ticket').subscribe({
        next: (response: AuthenticateResponse) => {
          console.log({
            content: 'JWT token successfully refreshed',
            backend: backend.url,
          });
          backend.token = new Token(response.ticket);
          this.backendsStorageService.persistBackends();
          this.ensureRefreshJWTTokenTimer(backend);
        },
        error: (error: any) => {
          console.error(error);
          this.logoutFromBackend(backend);
        }});
  }

  /*
   * Retrieves endpoints for currently selected backend.
   */
  private getEndpoints(backend: Backend) {
    this.httpClient.get<Endpoint[]>(backend.url + '/magic/system/auth/endpoints').subscribe({
      next: (res) => {
        backend.applyEndpoints(res || []);
        this._endpointsRetrieved.next(true);
      },
      error: () => {
        backend.applyEndpoints([]);
        this._endpointsRetrieved.next(false);
      }
    });
  }

  /*
   * Retrieves status of backend and version
   */
  private retrieveStatusAndVersion(backend: Backend) {
    this.httpClient.get<Status>(
      backend.url +
      '/magic/system/config/status').subscribe({
      next: (status: Status) => {
        backend.status = status;
        this._statusRetrieved.next(status);
        this.httpClient.get<CoreVersion>(
          backend.url + 
          '/magic/system/version').subscribe({
          next: (version: CoreVersion) => {
            backend.version = version.version;
            this.httpClient.get<Response>(
              environment.bazarUrl +
              '/magic/modules/bazar/core-version').subscribe((latestVersion: Response) => {
              backend.latestVersion = latestVersion.result;
              this._versionRetrieved.next(backend.version);
            });
          }
        });
      }});
  }
}
