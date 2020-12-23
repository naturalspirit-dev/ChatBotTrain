
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { Task } from 'src/app/models/task.model';
import { TaskService } from 'src/app/services/task.service';
import { BaseComponent } from 'src/app/components/base.component';
import { MessageService } from 'src/app/services/message.service';

/**
 * Modal dialog used to allow user to create a new role in the system.
 */
@Component({
  selector: 'app-schedule-task-dialog',
  templateUrl: './schedule-task-dialog.component.html',
  styleUrls: ['./schedule-task-dialog.component.scss']
})
export class ScheduleTaskDialogComponent extends BaseComponent {

  /**
   * Date user selects.
   */
  public date: Date;

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog when user clicks create button
   * @param taskService Needed to be able to create our task
   * @param messageService Message service used to communicate between components
   * @param data If updating role, this is the role we're updating
   */
  constructor(
    private dialogRef: MatDialogRef<ScheduleTaskDialogComponent>,
    private taskService: TaskService,
    protected messageService: MessageService,
    @Inject(MAT_DIALOG_DATA) public data: Task) {
    super(messageService);
  }

  /**
   * Invoked when user clicks the create button to create a new role.
   */
  public create() {

    // Invoking backend to create a new schedule for task.
    console.log(this.data);
    this.taskService.schedule(this.data.id).subscribe(() => {

      // Success! Closing dialog and giving caller the new task, now with an additional schedule declared in it.
      this.dialogRef.close(this.data);

    }, (error: any) => this.showError(error));
  }
}
