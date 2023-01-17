
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Affected } from 'src/app/models/affected.model';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { MachineLearningEditSnippetComponent } from '../machine-learning-edit-snippet/machine-learning-edit-snippet.component';

/**
 * Helper component to administrate training data for OpenAI integration
 * and Machine Learning integration.
 */
@Component({
  selector: 'app-machine-learning-snippets',
  templateUrl: './machine-learning-snippets.component.html',
  styleUrls: ['./machine-learning-snippets.component.scss']
})
export class MachineLearningSnippetsComponent implements OnInit {

  type: string;

  types: string[] = null;
  dataSource: any[] = null;
  count: number = 0;
  filter: any = {
    limit: 10,
    offset: 0,
  };
  displayedColumns: string[] = [
    'prompt',
    'type',
    'pushed',
    'action',
  ];

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    if (this.type && this.type !== '') {
      this.filter['ml_training_snippets.type.eq'] = this.type;
    }
    this.generalService.showLoading();
    this.getTypes(true);
  }

  create() {

    if (this.types.length === 0) {
      this.generalService.showFeedback('You need to create at least one type first', 'errorMessage');
      return;
    }

    this.dialog
      .open(MachineLearningEditSnippetComponent, {
        width: '80vw',
        maxWidth: '850px',
        data: {
          type: this.type,
        }
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {

          this.machineLearningTrainingService.ml_training_snippets_create(result).subscribe({
            next: () => {

              this.generalService.showFeedback('Snippet successfully created', 'successMessage');
              this.getTrainingData(true);
            },
            error: () => this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage')
          });
        }
    });
  }

  showDetails(event: any, el: any) {

    this.dialog
      .open(MachineLearningEditSnippetComponent, {
        width: '80vw',
        maxWidth: '850px',
        data: el,
      })
      .afterClosed()
      .subscribe((result: any) => {

        if (result) {
          if (result?.id) {

            this.machineLearningTrainingService.ml_training_snippets_update(result).subscribe({
              next: () => {

                this.generalService.showFeedback('Snippet updated successfully', 'successMessage');
                this.getTrainingData(false);
              },
              error: () => this.generalService.showFeedback('Something went wrong as we tried to update your snippet', 'errorMessage')
            });
          } else {

            this.machineLearningTrainingService.ml_training_snippets_create(result);
          }
        }
    });
    event.stopPropagation();
  }

  delete(event: any, el: any) {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete snippet',
        description_extra: 'Are you sure you want to delete this snippet?',
        action_btn: 'Delete',
        close_btn: 'Cancel',
        action_btn_color: 'warn',
        bold_description: true,
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.generalService.showLoading();
        this.machineLearningTrainingService.ml_training_snippets_delete(el.id).subscribe({
          next: () => {
    
            this.generalService.showFeedback('Snippet successfully deleted', 'successMessage');
            this.getTrainingData(true);
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to delete your snippet', 'errorMessage');
          }
        });
      }
    });
    event.stopPropagation();
  }

  deleteAll() {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete all filtered snippets',
        description_extra: `Do you want to delete all filtered ${this.count} snippets?`,
        action_btn: 'Delete',
        close_btn: 'Cancel',
        action_btn_color: 'warn',
        bold_description: true,
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.generalService.showLoading();
        const filter: any = {};
        if (this.filter['ml_training_snippets.prompt.like']?.length > 0) {
          filter['ml_training_snippets.prompt.like'] = this.filter['ml_training_snippets.prompt.like'];
        }
        if (this.filter['ml_training_snippets.type.eq']?.length > 0) {
          filter['ml_training_snippets.type.eq'] = this.filter['ml_training_snippets.type.eq'];
        }
        this.machineLearningTrainingService.ml_training_snippets_delete_all(filter).subscribe({
          next: () => {
    
            this.generalService.showFeedback(`${this.count} snippets successfully deleted`, 'successMessage');
            this.getTrainingData(true);
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to delete your snippets', 'errorMessage');
          }
        });
      }
    });
  }

  untrainAll() {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Mark ${this.count} snippets as unpushed`,
        description_extra: `Do you want to mark ${this.count} snippets as unpushed? This will include them in your next training session!`,
        action_btn: 'Unpush',
        close_btn: 'Cancel',
        action_btn_color: 'warn',
        bold_description: true,
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.generalService.showLoading();
        const filter: any = {
          values: {
            pushed: 0,
          },
          filter: {}
        };
        if (this.filter['ml_training_snippets.prompt.like']?.length > 0) {
          filter.filter['ml_training_snippets.prompt.like'] = this.filter['ml_training_snippets.prompt.like'];
        }
        if (this.filter['ml_training_snippets.type.eq']?.length > 0) {
          filter.filter['ml_training_snippets.type.eq'] = this.filter['ml_training_snippets.type.eq'];
        }

        this.machineLearningTrainingService.ml_training_snippets_update_all(filter).subscribe({
          next: (result: Affected) => {
    
            this.generalService.showFeedback(`${result.affected} snippets successfully updated`, 'successMessage');
            this.getTrainingData(true);
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to update your snippets', 'errorMessage');
          }
        });
      }
    });
  }

  trainAll() {

    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Mark ${this.count} snippets as pushed`,
        description_extra: `Do you want to mark ${this.count} snippets as pushed? This will exclude them from your next training session!`,
        action_btn: 'Push',
        close_btn: 'Cancel',
        action_btn_color: 'warn',
        bold_description: true,
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        this.generalService.showLoading();
        const filter: any = {
          values: {
            pushed: 1,
          },
          filter: {}
        };
        if (this.filter['ml_training_snippets.prompt.like']?.length > 0) {
          filter.filter['ml_training_snippets.prompt.like'] = this.filter['ml_training_snippets.prompt.like'];
        }
        if (this.filter['ml_training_snippets.type.eq']?.length > 0) {
          filter.filter['ml_training_snippets.type.eq'] = this.filter['ml_training_snippets.type.eq'];
        }

        this.machineLearningTrainingService.ml_training_snippets_update_all(filter).subscribe({
          next: (result: Affected) => {
    
            this.generalService.showFeedback(`${result.affected} snippets successfully updated`, 'successMessage');
            this.getTrainingData(true);
          },
          error: () => {

            this.generalService.hideLoading();
            this.generalService.showFeedback('Something went wrong as we tried to update your snippets', 'errorMessage');
          }
        });
      }
    });
  }

  page(event: PageEvent) {

    this.filter.offset = event.pageIndex * event.pageSize;
    this.getTrainingData(false);
  }

  filterList(event: { searchKey: string, type?: string }) {

    this.filter = {
      limit: this.filter.limit,
      offset: 0,
    };
    if (event.searchKey) {
      this.filter['ml_training_snippets.prompt.like'] = '%' + event.searchKey + '%';
    }
    if (event.type) {
      this.filter['ml_training_snippets.type.eq'] = event.type;
    }
    this.getTrainingData(true);
  }

  sortData(e: any) {

    if (e.direction === '') {

      delete this.filter['order'];
      delete this.filter['direction'];
      this.getTrainingData(false);
      return;
    }

    this.filter['order'] = e.active;
    this.filter['direction'] = e.direction;
    this.getTrainingData(false);
  }

  /*
   * Private helper methods.
   */

  private getTypes(getTrainingData: boolean = true) {

    this.machineLearningTrainingService.ml_types().subscribe({
      next: (types: any[]) => {

        types = types || [];

        this.types = types.map(x => x.type);

        if (getTrainingData) {
          this.getTrainingData();
          return;
        }

        this.generalService.hideLoading();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }

  private getTrainingData(count: boolean = true) {

    this.machineLearningTrainingService.ml_training_snippets(this.filter).subscribe({
      next: (result: any[]) => {

        this.dataSource = result || [];

        if (!count) {
          this.generalService.hideLoading();
          return;
        }

        const countFilter: any = {};
        for (const idx in this.filter) {
          if (idx !== 'limit' && idx !== 'offset' && idx !== 'order' && idx !== 'direction') {
            countFilter[idx] = this.filter[idx];
          }
        }
    
        this.machineLearningTrainingService.ml_training_snippets_count(countFilter).subscribe({
          next: (result: any) => {

            this.count = result.count;
            this.generalService.hideLoading();
          },
          error: (error: any) => {

            this.generalService.showFeedback(error, 'errorMessage', 'Ok');
            this.generalService.hideLoading();
          }
        });
      },
      error: (error: any) => {

        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
        this.generalService.hideLoading();
      }
    });
  }
}
