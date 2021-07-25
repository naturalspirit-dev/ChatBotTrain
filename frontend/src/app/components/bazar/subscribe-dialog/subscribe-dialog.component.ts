
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NameEmailModel } from '../../config/models/name-email.model';

// Application specific imports.
import { BazarService } from '../services/bazar.service';
import { Response } from 'src/app/models/response.model';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from '../../config/services/config.service';

/**
 * Component allowing user to subscribe to Server Garden's newsletter.
 */
@Component({
  selector: 'app-subscribe-dialog',
  templateUrl: './subscribe-dialog.component.html',
  styleUrls: ['./subscribe-dialog.component.scss']
})
export class SubscribeDialogComponent implements OnInit {

  /**
   * Name and email of user as published by backend.
   */
  public model: NameEmailModel;

  /**
   * Creates an instance of your component.
   * 
   * @param bazarService Needed to be able to subscribe user to our newsletter
   * @param configService Needed to retrieve user's name and email as specified during configuration
   * @param feedbackService Needed to display feedback to user
   * @param dialogRef Needed to be able to manually close dialog
   */
  public constructor(
    private bazarService: BazarService,
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<SubscribeDialogComponent>) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving user's name and email from backend.
    this.configService.rootUserEmailAddress().subscribe((result: NameEmailModel) => {

      // Assigning model.
      this.model = result;
    });
  }

  /**
   * Invoked when user clicks the OK button.
   */
  public ok() {

    // Invoking Bazar service to subscribe to our newsletter.
    this.bazarService.subscribe(
      this.model.name,
      this.model.email).subscribe((result: Response) => {

        // Verifying invocation was a success.
        if (result.result === 'success') {

          // Providing feedback to user.
          this.feedbackService.showInfo('We successfully subscribed you to our newsletter');
        }
      }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the Cancel button.
   */
   public cancel() {

    // Simply closing dialog without doing anything.
    this.dialogRef.close();
  }
}
