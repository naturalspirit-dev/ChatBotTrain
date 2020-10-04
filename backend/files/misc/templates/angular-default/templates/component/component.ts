import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GridComponent } from '../../base/grid.component';
import { MatPaginator } from '@angular/material';
import { MatDialog } from '@angular/material';
import { FormControl } from '@angular/forms';

import { Edit[[component-name]] } from './modals/edit.[[component-filename]]';
import { MessageService } from 'src/app/services/message-service';
import { HttpService } from 'src/app/services/http-service';

/**
 * "Datagrid" component for displaying instance of [[component-header]]
 * entities from your HTTP REST backend.
 */
@Component({
  selector: '[[component-selector]]',
  templateUrl: './[[component-filename]].html',
  styleUrls: ['./[[component-filename]].scss']
})
export class [[component-name]] extends GridComponent implements OnInit {

  /**
   * Which columns we should display. Reorder to prioritize columns differently.
   * Notice! 'delete-instance' should always come last.
   */
  public displayedColumns: string[] = [[[displayed-columns]]];

  // Need to view paginator as a child to update page index of it.
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  // Form control declarations to bind up with reactive form elements.
[[form-control-declarations]]
  // Constructor taking a bunch of services/helpers through dependency injection.
  constructor(
    protected snackBar: MatSnackBar,
    protected messages: MessageService,
    private httpService: HttpService,
    public dialog: MatDialog) {
      super(messages, snackBar);
  }

  /**
   * Overridde abstract method necessary to return the URL endpoint
   * for CRUD methods to base class.
   */
  protected url() {
    return '[[endpoint-url]]';
  }

  /**
   * Overridden abstract method from base class, that returns the Observable
   * necessary to actually retrieve items from backend.
   */
  protected read(filter: any) {
    return this.httpService.[[service-get-method]](filter);
  }

  /**
   * Overridden abstract method from base class, that returns the Observable
   * necessary to actually retrieve count of items from backend.
   */
  protected count(filter: any) {
    return this.httpService.[[service-count-method]](filter);
  }

  /**
   * Overridden abstract method from base class, that returns the Observable
   * necessary to actually delete items in backend.
   */
  protected delete(ids: any) {
    return this.httpService.[[service-delete-method]](ids);
  }

  /**
   * Implementation of abstract base class method, to reset paginator
   * of component.
   */
  protected resetPaginator() {
    this.paginator.pageIndex = 0;
  }

  /**
   * OnInit implementation. Retrieves initial data (unfiltered),
   * and instantiates our FormControls.
   */
  public ngOnInit() {

    // Calls base initialization method.
    this.initCommon();

    // Retrieves data from our backend, unfiltered, and binds our mat-table accordingly.
    this.getData();

    /*
     * Creating our filtering FormControl instances, which gives us "live filtering"
     * on our columns.
     */
[[form-control-instantiations]]  }

  /**
   * Invoked when user wants to edit an entity
   * 
   * This will show a modal dialog, allowing the user to edit his record.
   */
  public editEntity(entity: any) {

    const dialogRef = this.dialog.open(Edit[[component-name]], {
      data: this.getEditData(entity)
    });
    dialogRef.afterClosed().subscribe(editResult => {
      this.setEditData(editResult, entity);
    });
  }

  /**
   * Invoked when user wants to create a new entity
   * 
   * This will show a modal dialog, allowing the user to supply
   * the initial data for the entity.
   */
  public createEntity() {

    const dialogRef = this.dialog.open(Edit[[component-name]], {
      data: {
        isEdit: false,
        entity: {},
      }});
    dialogRef.afterClosed().subscribe((createResult: any) => {
      this.itemCreated(createResult);
    });
  }

  /**
   * Implementation of abstract method from base class.
   * 
   * Invoked as user tries to filter his result set. Will either
   * create or remove an existing filter, depending upon the value
   * the user typed into the filter textbox.
   */
  protected processFilter(name: string, value: string) {
    this.paginator.pageIndex = 0;
    this.filter.offset = 0;
    if (value === '') {
      delete this.filter[name];
    } else {
      this.filter[name] = value;
    }
    this.getData();
  }
}
