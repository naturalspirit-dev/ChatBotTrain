
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { CodemirrorActionsService } from 'src/app/_protected/pages/create/hyper-ide/services/codemirror-actions.service';

/**
 * Helper component to view details of one single training item.
 */
@Component({
  selector: 'app-machine-learning-details',
  templateUrl: './machine-learning-details.component.html',
  styleUrls: ['./machine-learning-details.component.scss']
})
export class MachineLearningDetailsComponent implements OnInit {

  type: string;
  types: string[] = [];
  prompt: string;
  completion: string;
  hlReady: boolean = false;
  hlModel: HlModel;

  constructor(
    private dialogRef: MatDialogRef<MachineLearningDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.prompt = this.data?.prompt;
    this.completion = this.data?.completion;

    this.machineLearningTrainingService.ml_types().subscribe({
      next: (result: any[]) => {

        this.types = result.map(x => x.type);
        if (this.data) {
          this.type = this.types.filter(x => x === this.data.type)[0];
        } else {
          this.type = this.types[0];
        }
      },
      error: () => this.generalService.showFeedback('Something went wrong as we tried to delete your snippet', 'errorMessage')
    });

    // Checking if training snippet is Hyperlambda, at which point we display CodeMirror editor for content.
    if (this.data?.type === 'hl') {
      const res = this.codemirrorActionsService.getActions(null, 'hl');
      res.autofocus = false;
      this.hlModel = {
        hyperlambda: this.completion,
        options: res,
      }
      setTimeout(() => {
        this.hlReady = true;
      }, 500);
    }
  }

  save() {

    const data: any = {
      prompt: this.prompt,
      completion: this.data?.type === 'hl' ? this.hlModel.hyperlambda : this.completion,
    };
    if (this.data) {
      data.id = this.data.id;
    }
    this.dialogRef.close(data);
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
