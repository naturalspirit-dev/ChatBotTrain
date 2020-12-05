
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Application specific imports.
import { LogItem } from 'src/app/models/log-item.model';
import { Messages } from 'src/app/models/message.model';
import { LogService } from 'src/app/services/log.service';
import { MessageService } from 'src/app/services/message.service';

/**
 * Log component for reading backend's log.
 */
@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public displayedColumns: string[] = ['content', 'type', 'when'];
  public filterFormControl: FormControl;
  public items: LogItem[] = [];
  public count: number = 0;
  public showGrid = true;
  public current: LogItem = null;
  private displayDetails: number[] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param logService Log HTTP service to use for retrieving log items
   * @param messageService Message service to publish messages to other components, and subscribe to messages sent by other components
   * @param route Activated route service to subscribe to router changed events
   */
  constructor(
    private logService: LogService,
    private messageService: MessageService,
    private route: ActivatedRoute) { }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Making sure we subscribe to router changed events.
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.logService.get(id).subscribe(res => {
          this.current = res;
        });
      } else {
        this.current = null;
      }
    });

    // Creating our filter form control, with debounce logic.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filterFormControl.setValue(query);
        this.paginator.pageIndex = 0;
        this.getItems();
      });

    // Getting log items initially, displaying the latest log items from the backend.
    this.getItems();
  }

  /**
   * Returns log items from your backend.
   */
  public getItems() {

    // Retrieves log items from the backend according to pagination and filter conditions.
    this.logService.list(
      this.filterFormControl.value,
      this.paginator.pageIndex * this.paginator.pageSize,
      this.paginator.pageSize).subscribe(res => {

      // Resetting details to avoid having 'hanging' details items, and changing internal model to result of invocation.
      this.displayDetails = [];
      this.items = res;

      // Counting items with the same filter as we used to retrieve items with.
      this.logService.count(this.filterFormControl.value).subscribe(res => {
        this.count = res.result;
      })
    });
  }

  /**
   * Invoked when paginator wants to page data table.
   * 
   * @param e Page event argument
   */
  public paged(e: PageEvent) {

    // Changing pager's size according to arguments, and retrieving log items from backend.
    this.paginator.pageSize = e.pageSize;
    this.getItems();
  }

  /**
   * Invoked when filter is programmatically changed for some reasons
   * 
   * @param filter Query filter to use for displaying items
   */
  public setFilter(filter: string) {

    // Updating page index, and taking advantage of debounce logic on form control to retrieve items from backend.
    this.paginator.pageIndex = 0;
    this.filterFormControl.setValue(filter);
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
   * Shows details about one specific log item.
   * 
   * @param el Log item to display details for
   */
  public toggleDetails(el: LogItem) {

    // Checking if we're already displaying details for current item.
    const idx = this.displayDetails.indexOf(el.id);
    if (idx >= 0) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(el.id);
    }
  }

  /**
   * Returns true if details for specified log item should be displayed.
   * 
   * @param el Log item to display details for
   */
  public shouldDisplayDetails(el: LogItem) {

    // Returns true if we're currently displaying this particular item.
    return this.displayDetails.filter(x => x === el.id).length > 0;
  }

  /**
   * Shows information about where to find currently viewed item.
   */
  public showLinkTip() {

    // Publishing message to component responsible for displaying information feedback to user.
    this.messageService.sendMessage({
      name: Messages.SHOW_INFO_SHORT,
      content: 'Scroll to the top of the page to see the item'
    });
  }
}
