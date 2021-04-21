
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { PublicKey } from '../models/public-key.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { CryptoService } from 'src/app/components/crypto/services/crypto.service';
import { CryptoInvocation } from 'src/app/components/crypto/models/crypto-invocations.model';

/**
 * Displays all cryptographically signed invocations towards server.
 */
@Component({
  selector: 'app-crypto-invocations',
  templateUrl: './crypto-invocations.component.html',
  styleUrls: ['./crypto-invocations.component.scss']
})
export class CryptoInvocationsComponent {

  // List of item IDs that we're currently viewing details for.
  private displayDetails: number[] = [];

  /**
   * Filter form control for filtering items to display.
   */
  public filterFormControl: FormControl;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Cryptographically signed invocations as returned from backend.
   */
  public invocations: CryptoInvocation[] = [];

  /**
   * Number of items in the backend matching the currently applied filter.
   */
  public count: number = 0;

  /**
   * Columns to display in table showing public keys.
   */
  public displayedColumns: string[] = [
    'request_id',
    'created',
  ];

  /**
   * Information about specific keys.
   */
  public keys: PublicKey[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param clipboard Needed to be able to copy information to the clipboard
   * @param cryptoService Needed to retrieve cryptographically signed invocations from backend
   * @param feedbackService Needed to display information to user
   */
  constructor(
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filter form control, with debounce logic.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getInvocations();
      });

    // Retrieving invocations unfiltered.
    this.getInvocations();
  }

  /**
   * Retrieves invocations from backend.
   */
  public getInvocations() {

    // Invoking backend to retrieve invocations.
    const filter: any = {
      request_id: this.filterFormControl.value,
    };
    this.cryptoService.invocations({
      filter,
      offset: this.paginator.pageIndex * this.paginator.pageSize,
      limit: this.paginator.pageSize
    }).subscribe((invocations: CryptoInvocation[]) => {

      // Resetting list of items we're currently viewing details for.
      this.displayDetails = [];

      // Assigning model for tabel to returned value from backend.
      this.invocations = invocations || [];

      // Counting items with the same filter as we used to retrieve items with.
      this.cryptoService.countInvocations({ filter: this.filterFormControl.value }).subscribe(res => {

        // Assigning count to returned value from server.
        this.count = res.count;

      }, (error: any) => this.feedbackService.showError(error));
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Returns true if specified key should be displayed details for.
   * 
   * @param invocation Inovcation to check if we should display details for
   */
  public shouldDisplayDetails(invocation: CryptoInvocation) {

    // Returns true if we're currently displaying details of this particular item.
    return this.displayDetails.filter(x => x === invocation.id).length > 0;
  }

  /**
   * Invoked when detailed view is toggled for specified invocation.
   * 
   * @param invocation Inovcation to toggle detailed view for
   */
  public toggleDetails(invocation: CryptoInvocation) {

    // Checking if we're already displaying details for current item.
    const idx = this.displayDetails.indexOf(invocation.id);
    if (idx !== -1) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(invocation.id);

      // Checking if we need to retrieve key details from backend.
      if (this.keys.filter(x => x.id === invocation.crypto_key).length === 0) {

        // Retrieving key's details from backend.
        this.cryptoService.publicKeys({
          key_id: invocation.crypto_key
        }).subscribe((result: PublicKey[]) => {
          this.keys.push(result[0])
        });
      }
    }
  }

  /**
   * Copies the specified content into the clipboard.
   * 
   * @param content Content to copy to clipboard
   */
  public copyToClipboard(content: string) {

    // Copies the specified content into the client's clipboard.
    this.clipboard.copy(content);
    this.feedbackService.showInfoShort('Content was copied to your clipboard');
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving invocations from backend.
    this.paginator.pageSize = e.pageSize;
    this.getInvocations();
  }

  /**
   * Clears the current filter.
   */
  public clearFilter() {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue('');
  }

  /**
   * Invoked when information about a specific key is needed.
   * 
   * @param id ID of key to retrieve
   */
  public getCryptoKey(id: number) {
    const result = this.keys.filter(x => x.id === id);
    if (result.length > 0) {
      return result[0].subject + ' - ' + result[0].email;
    }
    return '';
  }

  /**
   * Invoked when information about a specific key is needed.
   * 
   * @param id ID of key to retrieve
   */
   public getCryptoKeyPlaceholder(id: number) {
    const result = this.keys.filter(x => x.id === id);
    if (result.length > 0) {
      return result[0].fingerprint;
    }
    return '';
  }
}
