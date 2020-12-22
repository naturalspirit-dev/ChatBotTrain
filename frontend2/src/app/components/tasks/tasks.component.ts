
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { Task } from 'src/app/models/task.model';
import { BaseComponent } from '../base.component';
import { Count } from 'src/app/models/count.model';
import { TaskService } from 'src/app/services/task.service';
import { MessageService } from 'src/app/services/message.service';
import { Model } from '../codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';

// CodeMirror options.
import hyperlambda from '../codemirror/options/hyperlambda.json';

/*
 * Helper class to encapsulate a task and its details,
 * in addition to its CodeMirror options and model.
 */
class TaskEx {

  // Actual task as returned from backend.
  task: Task;

  // CodeMirror model for editing task's details.
  model?: Model;
}

/**
 * Tasks component allowing you to administrate tasks, both scheduled tasks
 * and non-scheduled tasks.
 */
@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent extends BaseComponent implements OnInit {

  /**
   * Tasks that are currently being viewed.
   */
  public tasks: TaskEx[] = null;

  /**
   * Visible columns in data table.
   */
  public displayedColumns: string[] = [
    'id',
  ];

  /**
   * Number of tasks in backend currently matching our filter.
   */
  public count: number = 0;

  /**
   * Paginator for paging table.
   */
  @ViewChild(MatPaginator, {static: true}) public paginator: MatPaginator;

  /**
   * Filter form control for filtering tasks to display.
   */
  public filterFormControl: FormControl;

  /**
   * Creates an instance of your component.
   * 
   * @param messageService Needed to send and subscribe to messages sent to and from other components
   */
  constructor(
    private taskService: TaskService,
    protected messageService: MessageService) {
    super(messageService);
  }

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
        this.getTasks();
      });

    // Retrieving tasks.
    this.getTasks();
  }

  /**
   * Retrieves tasks from your backend and re-databinds UI.
   */
  public getTasks() {

    // Invoking backend to retrieve tasks.
    this.taskService.list(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe((tasks: Task[]) => {

      // Assigning return values to currently viewed items by using our TaskEx class.
      this.tasks = (tasks || []).map(idx => {
        return {
          task: idx
        }
      });

      // Retrieving count of items from backend.
      this.taskService.count(this.filterFormControl.value).subscribe((count: Count) => {

        // Assigning count to returned value from server.
        this.count = count.count;

      }, (error: any) => this.showError(error));
    }, (error: any) => this.showError(error));
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
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving log items from backend.
    this.paginator.pageSize = e.pageSize;
    this.getTasks();
  }

  /**
   * Toggles details about one specific task.
   * 
   * @param el Task to toggle details for
   */
  public toggleDetails(el: TaskEx) {

    // Checking if we're already displaying details for current item.
    if (el.model) {

      // Hiding item.
      el.model = null;

    } else {

      // Retrieving task from backend.
      this.taskService.get(el.task.id).subscribe((task: Task) => {

        // Adding task to list of currently viewed items.
        const hyp = hyperlambda;
        hyp.extraKeys['Alt-M'] = (cm: any) => {
          cm.setOption('fullScreen', !cm.getOption('fullScreen'));
        };

        // Making sure we add additional fields returned from server for completeness sake.
        el.task.hyperlambda = task.hyperlambda;
        el.task.schedule = task.schedule;

        // By adding these fields to instance, task will be edited in UI.
        el.model = {
          hyperlambda: task.hyperlambda,
          options: hyp
        }
      });
    }
  }
}
