
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Helper component to "spice up" model with content from one single web page.
 */
@Component({
  selector: 'app-machine-learning-spice',
  templateUrl: './machine-learning-spice.component.html',
  styleUrls: ['./machine-learning-spice.component.scss']
})
export class MachineLearningSpiceComponent {

  url: string;

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<MachineLearningSpiceComponent>) { }

  scrape() {

    if (!this.CommonRegEx.domain.test(this.url)) {

      this.generalService.showFeedback('Not a valid URL', 'errorMessage');
      return;
    }

    this.dialogRef.close(this.url);
  }
}
