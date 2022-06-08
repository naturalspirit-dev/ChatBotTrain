
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { AppManifest } from '../../../../models/app-manifest';
import { FileService } from 'src/app/services/file.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { BazarService } from '../../services/bazar.service';
import { ConfirmUninstallDialogComponent } from '../confirm-uninstall-dialog/confirm-uninstall-dialog.component';

/**
 * Displays information about a currently installed Bazar item.
 */
@Component({
  selector: 'app-view-installed-app-dialog',
  templateUrl: './view-installed-app-dialog.component.html',
  styleUrls: ['./view-installed-app-dialog.component.scss']
})
export class ViewInstalledAppDialogComponent implements OnInit {

  /**
   * Markdown fetched from app's README.md file.
   */
  markdown: string;

  /**
   * Creates an instance of your component.
   *
   * @param fileService Needed to display module's README file
   * @param bazarService Needed to be able to update app, if app needs updating
   * @param backendService Needed to verify user has access to delete/uninstall Bazar item
   * @param feedbackService Needed to display feedback to user.
   * @param data App's manifest or meta data
   * @param dialogRef Needed to manually close dialog from code
   */
  constructor(
    private fileService: FileService,
    private bazarService: BazarService,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    @Inject(MAT_DIALOG_DATA) public data: AppManifest,
    private dialogRef: MatDialogRef<ViewInstalledAppDialogComponent>,
    private dialog: MatDialog) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {console.log(this.data)
    this.fileService.listFiles('/modules/' + this.data.module_name + '/', 'README.md').subscribe({
      next: (result: string[]) => {
        if (result && result.length > 0) {
          this.fileService.loadFile('/modules/' + this.data.module_name + '/README.md').subscribe({
            next: (markdown: string) => {
              this.markdown = markdown;
            },
            error: (error: any) => this.feedbackService.showError(error)});
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to update the app.
   */
  update() {
    this.bazarService.updateBazarItem(this.data).subscribe({
      next: (result: Response) => {
        if (result.result === 'success') {
          this.bazarService.installBazarItem(
            this.data.module_name,
            this.data.new_version,
            this.data.name,
            this.data.token).subscribe({
              next: (install: Response) => {
                if (install.result === 'success') {
                  this.feedbackService.showInfo('Application was successfully updated. You probably want to store the ZIP file for later in case you need to install a backup of your app.');
                  this.dialogRef.close(this.data);
                  this.bazarService.downloadBazarItemLocally(this.data.module_name);
                }
              },
              error: (error: any) => this.feedbackService.showError(error)});
        }
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to uninstall app from local server.
   */
  uninstall() {
    this.dialog.open(ConfirmUninstallDialogComponent, {
      data: this.data.module_name,
      width: '500px'
    }).afterClosed().subscribe((result: string) => {
      if (result) {
        this.dialogRef.close(this.data);
      }
    })
    // this.fileService.deleteFolder('/modules/' + this.data.module_name + '/').subscribe({
    //   next: () => {
    //     this.feedbackService.showInfo('Application was successfully uninstalled from local server');
    //     this.dialogRef.close(this.data);
    //   },
    //   error: (error: any) => this.feedbackService.showError(error)});
  }
}
