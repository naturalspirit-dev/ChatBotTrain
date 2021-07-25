
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Model for verifying user's email address, and any optional promo codes.
 */
export class EmailPromoCodeModel {

  /**
   * Whether user wants to subscribe to our newsletter or not.
   */
  public subscribe: boolean;

  /**
   * Name of customer.
   */
  public name: string;

  /**
   * Email address we should send app's ZIP file to.
   */
  public email: string;

  /**
   * Optional promo code user has been given.
   */
  public code?: any;
}

/**
 * Component for having user provide his email address such that we can send the component
 * to him as a ZIP file.
 */
@Component({
  selector: 'app-confirm-email-address-dialog',
  templateUrl: './confirm-email-address-dialog.component.html',
  styleUrls: ['./confirm-email-address-dialog.component.scss']
})
export class ConfirmEmailAddressDialogComponent {

  /**
   * If true, the user can punch a promo code.
   */
  public has_code: boolean = false;

  /**
   * Creates an instance of your component.
   * 
   * @param data Root user's email address
   */
  constructor(
    private dialogRef: MatDialogRef<ConfirmEmailAddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmailPromoCodeModel) { }

  /**
   * Invoked when user confirms his email address.
   */
  public ok() {

    // Closing dialog.
    this.dialogRef.close(this.data);
  }

  /**
   * Invoked when user cancels the purchasing process.
   */
   public cancel() {

    // Closing dialog.
    this.dialogRef.close();
  }
}
