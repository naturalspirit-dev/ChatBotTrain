
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators, UntypedFormBuilder, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, startWith } from 'rxjs';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { BackendsStorageService } from 'src/app/_protected/services/common/backendsstorage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  loginForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    backend: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
  });

  backendHasBeenSelected: boolean = false;
  backendList: any = [];
  filteredBackends: Observable<any[]>;
  savePassword: boolean = false;
  viewPassword: boolean = false;
  rememberPassword: boolean = false;
  waiting: boolean = false;

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  /**
   * to set the user's site_key for recaptcha
   */
  recaptchaKey: string = null;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private generalService: GeneralService,
    private backendService: BackendService,
    private router: Router,
    public backendStorageService: BackendsStorageService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.readBackendService();
  }

  private readBackendService() {
    (async () => {
      while (!(this.backendService?.active && this.backendService?.active?.access && Object.keys(this.backendService?.active?.access?.auth ?? {}).length > 0))
        await new Promise(resolve => setTimeout(resolve, 100));

      if ((this.backendService?.active?.access && Object.keys(this.backendService?.active?.access?.auth).length > 0)) {
        this.backendHasBeenSelected = true;
        this.backendList = this.backendService.backends;

        this.activatedRoute.queryParams.subscribe((params: any) => {
          if (params.switchTo) {
            const defaultBackend: Backend = this.backendList.find((item: any) => item.url === params.switchTo);
            this.loginForm.controls.backend.setValue(defaultBackend.url);
            this.loginForm.controls.username.setValue(defaultBackend.username);
            this.loginForm.controls.password.setValue(defaultBackend.password);
          }
          if (params.backend) {
            const defaultBackend: Backend = this.backendList.find((item: any) => item.url === params.backend.url);
            this.loginForm.controls.backend.setValue(defaultBackend.url);
            this.loginForm.controls.username.setValue(defaultBackend.username);
            this.loginForm.controls.password.setValue(defaultBackend.password);
          }
        })
        this.backendService._activeCaptchaValue.subscribe((key: string) => {
          this.recaptchaKey = key;
        })
        this.cdr.detectChanges();
      }
      this.cdr.detectChanges();
    })();
  }

  /**
   * login form
   */
  login() {
    if (!CommonRegEx.backend.test(this.loginForm.controls.backend.value.replace(/\/$/, ''))) {
      this.generalService.showFeedback('Backend URL is not valid.', 'errorMessage', 'Ok');
      return;
    }

    this.waiting = true;

    /*
     * Storing currently selected backend.
     * Notice, this has to be done before we authenticate, since
     * the auth service depends upon user already having selected
     * a current backend.
     */
    const backend = new Backend(this.loginForm.controls.backend.value.replace(/\/$/, ''), this.loginForm.value.username, this.loginForm.value.password)
    this.backendService.upsert(backend);
    this.backendService.activate(backend);
    this.backendService.login(
      this.loginForm.value.username,
      this.loginForm.value.password,
      this.savePassword).subscribe({
        next: () => {
          this.router.navigate(['/']);
          this.waiting = false;
        },
        error: (error: any) => {
          this.generalService.showFeedback(error.error.message ?? error, 'errorMessage', 'Ok');
          this.waiting = false;
        }
      });
  }
}
