
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Injector, OnInit } from '@angular/core';

// Application specific imports.
import { BaseComponent } from '../base.component';
import { Response } from 'src/app/models/response.model';
import { SqlService } from 'src/app/services/sql.service';
import { ConfigService } from 'src/app/services/config.service';
import { Model } from '../codemirror/codemirror-sql/codemirror-sql.component';
import { LoadSqlDialogComponent } from './load-sql-dialog/load-sql-dialog.component';

// CodeMirror options.
import sql from '../codemirror/options/sql.json'
import { SaveSqlDialogComponent } from './save-sql-dialog/save-sql-dialog.component';

/**
 * SQL component allowing user to execute arbitrary SQL statements towards his database.
 */
@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  styleUrls: ['./sql.component.scss']
})
export class SqlComponent extends BaseComponent implements OnInit {

  // List of items we're viewing details of.
  private displayDetails: any[] = [];

  // Filename as chosen during load SQL snippet or save SQL snippet.
  private filename: string;

  // Database declaration as returned from server
  private databaseDeclaration: any = null;

  /**
   * Database types the user can select during configuration of system.
   */
  public databaseTypes: any[] = [
    {type: 'mysql', name: 'MySQL'},
    {type: 'mssql', name: 'Microsoft SQL Server'},
  ];

  /**
   * All existing connection strings for selected database type.
   */
  public connectionStrings: string[] = [];

  /**
   * Databases that exists in database type/connection string instance.
   */
  public databases: string[] = [];

  /**
   * Input SQL component model and options.
   */
  public input: Model = null;

  /**
   * Only relevant for mssql database type, and if true, executes SQL
   * as a batch execution.
   */
  public isBatch: boolean = false;

  /**
   * If true prevents returning more than 200 records from backend to avoid
   * exhausting server.
   */
  public safeMode: boolean = true;

  /**
   * Result of invocation towards backend.
   */
  public result: any[][] = [];

  /**
   * Creates an instance of your component.
   * 
   * @param configService Needed to read configuration settings, more specifically default database config setting
   * @param sqlService Needed to be able to execute SQL towards backend
   * @param dialog Needed to be able to show Load SQL snippet dialog
   * @param messageService Message service used to message other components
   */
  constructor(
    private configService: ConfigService,
    private sqlService: SqlService,
    protected injector: Injector) {
    super(injector);
  }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving default database type from backend.
    this.configService.defaultDatabaseType().subscribe((defaultDatabaseType: Response) => {

      // Retrieving connection strings for default database type.
      this.getConnectionStrings(defaultDatabaseType.result, (connectionStrings: string[]) => {

        // Retrieving databases existing in connection string instance.
        this.getDatabases(defaultDatabaseType.result, connectionStrings[0], (databases: any) => {

          // Storing database declaration such that user can change active database without having to roundtrip to server.
          this.databaseDeclaration = databases;

          // Transforming from HTTP result to object(s) expected by CodeMirror.
          const tables = {};
          for (const idxTable of databases.databases[0].tables) {
            tables[idxTable.name] = idxTable.columns.map((x: any) => x.name);
          }

          /*
           * Initialising input now that we know the default database type, connection string,
           * and databases that exists in connection string.
           */
          this.connectionStrings = connectionStrings;
          this.databases = databases.databases.map((x: any) => x.name);
          this.input = {
            databaseType: defaultDatabaseType.result,
            connectionString: connectionStrings[0],
            database: this.databases[0],
            options: sql,
            sql: '',
          };
          this.input.options.hintOptions = {
            tables: tables,
          };

          // Turning on auto focus.
          this.input.options.autofocus = true;

          // Associating ALT+M with fullscreen toggling of the editor instance.
          this.input.options.extraKeys['Alt-M'] = (cm: any) => {
            cm.setOption('fullScreen', !cm.getOption('fullScreen'));
          };

          // Associating ALT+L with the load snippet button.
          this.input.options.extraKeys['Alt-L'] = (cm: any) => {
            (document.getElementById('loadButton') as HTMLElement).click();
          };

          // Associating ALT+S with the save snippet button.
          this.input.options.extraKeys['Alt-S'] = (cm: any) => {
            (document.getElementById('saveButton') as HTMLElement).click();
          };

          // Making sure we attach the F5 button to execute SQL.
          this.input.options.extraKeys.F5 = () => {
            (document.getElementById('executeButton') as HTMLElement).click();
          };
        });
      });
    }, (error: any) => this.showError(error));
  }

  /**
   * Invoked when database type is changed.
   */
  public databaseTypeChanged() {

    // Retrieving all connetion strings for selected database type.
    this.getConnectionStrings(this.input.databaseType, (connectionStrings: string[]) => {

      // Resetting selected connection string and selected database.
      this.connectionStrings = connectionStrings;
      this.input.connectionString = null;
      this.input.database = null;
      this.input.options.hintOptions.tables = [];
      this.databases = [];

      // Checking if this is anything but 'mssql', and if so, unchecking batch.
      if (this.input.databaseType !== 'mssql') {
        this.isBatch = false;
      }
    });
  }

  /**
   * Invoked when connection string is changed.
   */
  public connectionStringChanged() {

    // Retrieving all databases for selected database type and connection string.
    this.getDatabases(this.input.databaseType, this.input.connectionString, (databases: any) => {

      // Making sure connection string has at least one database.
      if (databases.databases && databases.databases.length > 0) {

        // Setting databases and hint options.
        this.databases = databases.databases.map((x: any) => x.name);

        // Storing database declaration such that user can change active database without having to roundtrip to server.
        this.databaseDeclaration = databases;

        // Resetting other information, selecting first database by default.
        this.input.database = this.databases[0];
        this.databaseChanged();
  
      } else {

        // No databases in active connection string.
        this.databases = [];
        this.input.database = null;
        this.input.options.hintOptions.tables = [];
      }
    });
  }

  /**
   * Invoked when active database changes.
   */
  public databaseChanged() {

    // Updating SQL hints according to selected database.
    const result = {};
    const tables = this.databaseDeclaration.databases.filter((x: any) => x.name === this.input.database)[0].tables;
    for (const idxTable of tables) {
      result[idxTable.name] = idxTable.columns?.map((x: any) => x.name) || [];
    }
    this.input.options.hintOptions.tables = result;
  }

  /**
   * Opens the load snippet dialog, to allow user to select a previously saved snippet.
   */
  public load() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(LoadSqlDialogComponent, {
      width: '550px',
      data: this.input.databaseType,
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((filename: string) => {
      if (filename) {

        // User gave us a filename, hence we load file from backend snippet collection.
        this.sqlService.loadSnippet(this.input.databaseType, filename).subscribe((content: string) => {

          // Success!
          this.input.sql = content;
          this.filename = filename;

        }, (error: any) => this.showError(error));
      }
    });
  }

  /**
   * Invoked when user wants to save an SQL snippet.
   */
  public save() {

    // Showing modal dialog, passing in existing filename if any, defaulting to ''.
    const dialogRef = this.dialog.open(SaveSqlDialogComponent, {
      width: '550px',
      data: {
        filename: this.filename || '',
        databaseType: this.input.databaseType,
      }
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((filename: string) => {

      // Checking if user selected a file, at which point filename will be non-null.
      if (filename) {

        // User gave us a filename, hence saving file to backend snippet collection.
        this.sqlService.saveSnippet(
          this.input.databaseType,
          filename,
          this.input.sql).subscribe(() => {

          // Success!
          this.showInfo('SQL snippet successfully saved');
          this.filename = filename;
          
        }, (error: any) => this.showError(error));

      }
    });
  }

  /**
   * Executes the current SQL towards your backend.
   */
  public execute() {

    // Retrieving selected text from CodeMirror instance.
    const selectedText = this.input.editor.getSelection();

    // Invoking backend.
    this.sqlService.execute(
      this.input.databaseType,
      '[' + this.input.connectionString + '|' + this.input.database + ']',
      selectedText == '' ? this.input.sql : selectedText,
      this.safeMode,
      this.isBatch).subscribe((result: any[][]) => {

      // Success!
      if (result && result.length === 200) {
        this.showInfo('First 200 records returned');
      } else {
        this.showInfo('SQL successfully executed');
      }

      // Making sure we remove all previously viewed detail records.
      this.displayDetails = [];
      this.result = result || [];
    }, (error: any) => this.showError(error));
  }

  /**
   * Returns row declaration
   * 
   * @param currentResultSet Currently iterated list of rows
   */
  public getRows(currentResultSet: any[]) {

    // Braiding result with displayed details, such that HTML can create correct rows.
    const result = [];
    for (const idx of currentResultSet) {

      // Pushing the plain result record.
      result.push(idx);

      // Checking if we are displaying details for this guy.
      if (this.displayDetails.indexOf(idx) !== -1) {

        // Adding our view details record.
        let colSpan = 0;
        for (const idx in currentResultSet[0]) {
          colSpan += 1;
        }
        result.push({
          _detailsColSpan: Math.min(5, colSpan),
          data: idx,
        })
      }
    }
    return result;
  }

  /**
   * Invoked when user wants to toggle details for a row
   * 
   * @param row Row to toggle details for
   */
  public toggleDetails(row: any[]) {

    // Pushing or popping (toggling) details record on/off list of records to view details for.
    const index = this.displayDetails.indexOf(row);
    if (index === -1) {
      this.displayDetails.push(row);
    } else {
      this.displayDetails.splice(index, 1);
    }
  }

  /**
   * Returns true if we're currently viewing details of the specified row.
   * 
   * @param row Row to check
   */
  public viewingDetails(row: any[]) {
    return this.displayDetails.indexOf(row) !== -1;
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns all connection strings for database type from backend.
   */
  private getConnectionStrings(databaseType: string, onAfter: (connectionStrings: string[]) => void = null) {

    // Retrieving connection strings for default database type from backend.
    this.sqlService.connectionStrings(databaseType).subscribe((connectionStrings: any) => {

      // Checking if caller supplied a callback, and if so, invoking it.
      if (onAfter) {

        // Transforming backend's result to a list of strings.
        const tmp: string[] = [];
        for (var idx in connectionStrings) {
          tmp.push(idx);
        }
        onAfter(tmp);
      }

    }, (error: any) => {

      // Oops, making sure we remove all selected values, and shows an error to user.
      this.input.connectionString = null;
      this.input.database = null;
      this.input.options.hintOptions.tables = [];
      this.showError(error);}
    );
  }

  /*
   * Returns all databases for database-type/connection-string from backend.
   */
  private getDatabases(databaseType: string, connectionString: string, onAfter: (databases: any) => void = null) {

    // Retrieving databases that exists for database-type/connection-string combination in backend.
    this.sqlService.vocabulary(databaseType, connectionString).subscribe((databases: any) => {

      // Checking if caller supplied a callback, and if so invoking it.
      if (onAfter) {

        // Invoking callback.
        onAfter(databases);
      }
    }, (error: any) => {

      // Resetting selected connection string and selected database.
      this.input.connectionString = null;
      this.input.database = null;
      this.input.options.hintOptions.tables = [];

      // Notifying user
      this.showError(error);
    });
  }
}
