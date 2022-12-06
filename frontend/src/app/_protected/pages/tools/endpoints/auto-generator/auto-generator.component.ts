import { formatNumber } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, LOCALE_ID, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { Model } from 'src/app/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_protected/services/common/backend.service';
import { CacheService } from 'src/app/_protected/services/common/cache.service';
import { MessageService } from 'src/app/_protected/services/common/message.service';
import { DatabaseEx } from '../../../crud-generator/_models/database-ex.model';
import { LocResult } from '../../../crud-generator/_models/loc-result.model';
import { CrudifyService } from '../../../crud-generator/_services/crudify.service';
import { TransformModelService } from '../../../crud-generator/_services/transform-model.service';
import { LogService } from '../../../setting-security/log/_services/log.service';
import { Role } from '../../../administration/user-roles/_models/role.model';
import { SingleTableConfigComponent } from '../components/single-table-config/single-table-config.component';

// CodeMirror options.
import hyperlambda from '../../../../../codemirror/options/hyperlambda.json';
import { CodemirrorActionsService } from '../../hyper-ide/_services/codemirror-actions.service';
import { MatDialog } from '@angular/material/dialog';
import { EvaluatorService } from '../../hl-playground/_services/evaluator.service';
import { LoadSnippetDialogComponent } from 'src/app/_general/components/load-snippet-dialog/load-snippet-dialog.component';
import { SnippetNameDialogComponent } from 'src/app/_general/components/snippet-name-dialog/snippet-name-dialog.component';

@Component({
  selector: 'app-auto-generator',
  templateUrl: './auto-generator.component.html',
  styleUrls: ['./auto-generator.component.scss']
})
export class AutoGeneratorComponent implements OnInit, OnDestroy {

  @Input() dbLoading: Observable<boolean>;
  @Input() databases: any = [];
  @Input() databaseTypes: any = [];
  @Input() connectionStrings: any = [];
  @Input() roles: Role[] = [];

  @Input() defaultDbType: string = '';
  @Input() defaultConnectionString: string = '';
  @Input() defaultDbName: string = '';

  public allDatabasesList: any = [];
  public selectedDatabase: string = '';
  public selectedDbType: string = '';
  public selectedConnectionString: string = '';
  public selectedTables: FormControl = new FormControl<any>('');
  public readRoles: FormControl = new FormControl<any>('');
  public updateRoles: FormControl = new FormControl<any>('');
  public deleteRoles: FormControl = new FormControl<any>('');
  public createRoles: FormControl = new FormControl<any>('');
  public primaryURL: string = '';
  public secondaryURL: string = '';
  public logCreate: boolean = false;
  public logUpdate: boolean = false;
  public logDelete: boolean = false;

  public captchaCreate: boolean = false;
  public captchaRead: boolean = false;
  public captchaUpdate: boolean = false;
  public captchaDelete: boolean = false;
  public captchaValue: number;

  public cachePublic: boolean = false;
  public cacheDuration: boolean = false;

  public generateSocket: boolean = false;
  public generateSocketMessage: string;
  public authRoles: FormControl = new FormControl<any>('');

  /**
   * Authorisation requirements for SignalR messages published during invocation of endpoint.
   */
   cqrsAuthorisationTypes: string[] = ['none', 'inherited', 'roles', 'groups', 'users'];

  public tables: any = [];

  @Output() getConnectionString: EventEmitter<any> = new EventEmitter<any>();

  private dbLoadingSubscription!: Subscription;

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  /**
   * Input Hyperlambda component model and options.
   */
   hlInput: Model = {
    hyperlambda: '',
    options: hyperlambda,
  };

  public codeMirrorReady: boolean = false;

  private snippetName: string = '';
  public canLoadSnippet: boolean = undefined;
  private codemirrorActionsSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private logService: LogService,
    private cdr: ChangeDetectorRef,
    private cacheService: CacheService,
    private messageService: MessageService,
    private generalService: GeneralService,
    private crudifyService: CrudifyService,
    private backendService: BackendService,
    private evaluatorService: EvaluatorService,
    protected transformService: TransformModelService,
    private codemirrorActionsService: CodemirrorActionsService,
    @Inject(LOCALE_ID) public locale: string) { }

  ngOnInit(): void {
    this.watchDbLoading();
  }

  private watchDbLoading() {
    this.dbLoadingSubscription = this.dbLoading.subscribe((isLoading: boolean) => {
      this.selectedDatabase = '';
      this.selectedConnectionString = '';
      this.tables = [];
      if (isLoading === false) {

        this.waitingData();
        this.getOptions();
        this.watchForActions();
      }
    })
  }

  private getOptions() {
    this.codemirrorActionsService.getActions('','hl').then((options: any) => {
      options.autofocus = false;
      this.hlInput.options = options;
      this.codeMirrorReady = true;
    })
  }

  private waitingData() {
    (async () => {
      while (!(this.databaseTypes && this.databaseTypes.length && this.defaultConnectionString && this.defaultConnectionString !== '' && this.databases && this.databases.length))
        await new Promise(resolve => setTimeout(resolve, 100));

      if (this.databaseTypes && this.databaseTypes.length > 0 && this.defaultConnectionString && this.defaultConnectionString !== '' && this.databases && this.databases.length > 0) {

        this.allDatabasesList = [...this.databases];

        this.selectedDbType = this.defaultDbType;
        this.selectedConnectionString = this.defaultConnectionString;
        this.selectedDatabase = this.defaultDbName !== '' ? this.defaultDbName : this.databases[0].name;
        this.primaryURL = this.selectedDatabase.toLowerCase();

        this.readRoles.setValue(['root', 'guest']);
        this.updateRoles.setValue(['root', 'guest']);
        this.deleteRoles.setValue(['root', 'guest']);
        this.createRoles.setValue(['root', 'guest']);

        this.canLoadSnippet = this.backendService.active?.access.sql.list_files;

        this.changeDatabase();
        this.cdr.detectChanges();
      }
    })();
  }

  public changeConnectionStrings() {
    this.getConnectionString.emit({ selectedDbType: this.selectedDbType, selectedConnectionString: this.selectedConnectionString });
  }

  public changeDatabase() {
    const db = this.databases.find((item: any) => item.name === this.selectedDatabase);
    if (this.selectedDatabase && db && db.tables?.length) {
      this.tables = this.databases.find((item: any) => item.name === this.selectedDatabase).tables;
      let names: any = this.tables.map((item: any) => { return item.name });
      this.selectedTables = new FormControl({value: names, disabled: false});
    } else {
      this.selectedTables = new FormControl({value: '', disabled: true});
    }
    this.primaryURL = this.selectedDatabase.toLowerCase();
    if (this.tables.length === 1) {
      this.secondaryURL = this.tables[0].name
    }
    this.cdr.detectChanges();
  }

  public selectedTableChanged() {
    this.selectedTables.value.length === 1 ?
      this.secondaryURL = this.selectedTables.value.toString().toLowerCase() :
      '';
  }

  public toggleAllTables(checked: boolean) {
    if (!checked) {
      this.selectedTables.setValue('');
    } else {
      let names: any = this.tables.map((item: any) => { return item.name });
      this.selectedTables.setValue(names);
    }
    this.cdr.detectChanges();
  }

  public generateEndpoints() {
    if (!(this.tables && this.tables.length > 0 && this.selectedTables.value.length > 0)) {
      this.generalService.showFeedback('Please select table(s) and try generating endpoints.', 'errorMessage');
      return;
    }
    if (this.selectedDatabase !== 'magic') {
      if (this.databases.find((db: any) => db.name === this.selectedDatabase).tables) {
        const subscribers: Observable<LocResult>[] = [];
        this.generalService.showLoading();
        this.createDefaultOptionsForDatabase().then((resolve: boolean) => {
          if (resolve) {
            const tables = this.databases.find((item: any) => item.name === this.selectedDatabase).tables.filter((el: any) => el.verbs);

            for (const table of tables) {
              table.captchaPost = this.captchaCreate ? this.captchaValue : null;
              table.captchaGet = this.captchaRead ? this.captchaValue : null;
              table.captchaPut = this.captchaUpdate ? this.captchaValue : null;
              table.captchaDelete = this.captchaDelete ? this.captchaValue : null;
              table.cqrs = this.generateSocket;
              const verbs = (table.verbs || []).filter((method: any) => method.generate).map((method: any) => {
                return this.crudifyService.crudify(
                  this.transformService.transform(
                    this.selectedDbType,
                    '[' + this.selectedConnectionString + '|' + this.selectedDatabase + ']',
                    table,
                    method.name));
              });
              for (const tmpIdx of verbs) {
                subscribers.push(tmpIdx);
              }
            }

            forkJoin(subscribers).subscribe({
              next: (results: LocResult[]) => {
                const loc = results.reduce((x, y) => x + y.loc, 0);
                this.logService.createLocItem(loc, 'backend', `${this.selectedDatabase}`).subscribe({
                  next: () => {
                    this.generalService.showFeedback(`${formatNumber(loc, this.locale, '1.0')} lines of code generated.`, 'successMessage');
                    this.flushEndpointsAuthRequirements();
                    this.messageService.sendMessage({
                      name: 'magic.folders.update',
                      content: '/modules/'
                    });
                    this.generalService.hideLoading();
                  },
                  error: (error: any) => {
                    this.generalService.hideLoading();
                    this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
                  }
                });

              },
              error: (error: any) => {
                this.generalService.hideLoading();
                this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000);
              }
            });
          } else {
            this.generalService.hideLoading();
          }
        })
      } else {
        this.generalService.showFeedback('This database doesn\'t have tables', 'errorMessage', 'Ok', 5000);
      }
    } else {
      this.generalService.showFeedback('You cannot generate endpoints for this table.', 'errorMessage', 'Ok', 5000);
    }
  }

  /*
   * Creates default crudify options for current database.
   */
  private createDefaultOptionsForDatabase() {
    return new Promise(resolve => {
      const db = this.databases.find((item: any) => item.name === this.selectedDatabase);
      for (let index = 0; index < this.selectedTables.value.length; index++) {
        const element = this.selectedTables.value[index];

        const selectedTables: any = this.tables.filter((item: any) => item.name === element);
        for (const idxTable of selectedTables) {
          for (const col of idxTable.columns || []) {
            if (col.locked === true) {
              col.locked = 'auth.ticket.get';
            }
          }
          idxTable.moduleName = this.selectedDatabase;
          idxTable.moduleUrl = this.secondaryURL;
          const columns = (idxTable.columns || []);
          idxTable.verbs = [
            { name: 'post', generate: columns.length > 0 },
            { name: 'get', generate: columns.length > 0 },
          ];
          if (columns.filter(x => !x.primary).length > 0 &&
          columns.filter(x => x.primary).length > 0) {
            idxTable.verbs.push({ name: 'put', generate: columns.filter(x => !x.primary && !x.automatic).length > 0 });
          }
          if (columns.filter(x => x.primary).length > 0) {
            idxTable.verbs.push({ name: 'delete', generate: true });
          }
          idxTable.authPost = this.createRoles.value.toString() ?? 'root, admin';
          idxTable.authGet = this.readRoles.value.toString() ?? 'root, admin';
          idxTable.authPut = this.updateRoles.value.toString() ?? 'root, admin';
          idxTable.authDelete = this.deleteRoles.value.toString() ?? 'root, admin';

          idxTable.cqrsAuthorisation = this.generateSocket === true && this.generateSocketMessage!== '' ? this.generateSocketMessage : 'inherited';
          idxTable.cqrsAuthorisationValues =
          this.generateSocket === true && this.generateSocketMessage!== '' && this.authRoles.value.length > 0 ? this.authRoles.value.toString() : null;

          idxTable.cache = this.cacheDuration;
          idxTable.publicCache = this.cachePublic;

          idxTable.validators = this.hlInput.hyperlambda;



          if (this.selectedTables.value.length > 1) {
            idxTable.moduleUrl = idxTable.name;
            for (const idxColumn of columns) {
              const keys = idxTable.foreign_keys?.filter((foreign_key: any) => foreign_key.column === idxColumn.name) ?? [];
              if (keys.length > 0) {
                let shouldCreateForeignKey = false;
                const foreignTable = db.tables.filter((table: any) => table.name === keys[0].foreign_table)[0];
                for (const idxCol of foreignTable.columns) {
                  if (idxCol.hl === 'string') {
                    shouldCreateForeignKey = true;
                    break;
                  }
                }
                if (shouldCreateForeignKey) {
                  idxColumn.foreign_key = {
                    foreign_table: keys[0].foreign_table,
                    foreign_column: keys[0].foreign_column,
                    long_data: true,
                    foreign_name: db.tables
                      .filter(x => x.name === keys[0].foreign_table)[0].columns.filter(x => x.hl === 'string')[0].name,
                  };
                }
                // console.log(keys, foreignTable)
              }

              idxColumn.expanded = false;

              idxColumn.post = !(idxColumn.automatic && idxColumn.primary);
              if (idxColumn.automatic && idxColumn.name?.toLowerCase() === 'created') {
                idxColumn.post = false;
              }
              idxColumn.get = true;
              idxColumn.put = !idxColumn.automatic || idxColumn.primary;
              idxColumn.delete = idxColumn.primary;

              idxColumn.postDisabled = false; // idxColumn.primary && !idxColumn.automatic;
              idxColumn.getDisabled = false;
              idxColumn.putDisabled = idxColumn.primary;
              idxColumn.deleteDisabled = true;

              if ((idxColumn.name === 'user' || idxColumn.name === 'username') && idxColumn.hl === 'string') {
                idxColumn.locked = 'auth.ticket.get';
                idxColumn.expanded = true;
                idxColumn.warning = 'Warning, I automatically associated this column with the currently authenticated user due to its name. You might want to sanity check my decision.';
              }

              if (idxColumn.name?.toLowerCase() === 'picture' || idxColumn.name?.toLowerCase() === 'image' || idxColumn.name?.toLowerCase() === 'photo') {
                idxColumn.handling = 'image';
                idxColumn.expanded = true;
                idxColumn.warning = 'Notice, by default this field will be handled as an image field. You might want to double check my decision.';
              }

              if (idxColumn.name?.toLowerCase() === 'file') {
                idxColumn.handling = 'file';
                idxColumn.expanded = true;
                idxColumn.warning = 'Notice, by default this field will be handled as a file upload field. You might want to double check my decision.';
              }

              if (idxColumn.name?.toLowerCase() === 'youtube' || idxColumn.name?.toLowerCase() === 'video') {
                idxColumn.handling = 'youtube';
                idxColumn.expanded = true;
                idxColumn.warning = 'Notice, by default this field will be handled as a YouTube field. You might want to double check my decision.';
              }

              if (idxColumn.name?.toLowerCase() === 'email' || idxColumn.name?.toLowerCase() === 'mail') {
                idxColumn.handling = 'email';
                idxColumn.expanded = true;
                idxColumn.warning = 'Notice, by default this field will be handled as an email field. You mght want to double check my decision.';
              }

              if (idxColumn.name?.toLowerCase() === 'url' || idxColumn.name?.toLowerCase() === 'link') {
                idxColumn.handling = 'url';
                idxColumn.expanded = true;
                idxColumn.warning = 'Notice, by default this field will be handled as an url field. You mght want to double check my decision.';
              }

              if (idxColumn.name?.toLowerCase() === 'phone' || idxColumn.name?.toLowerCase() === 'tel') {
                idxColumn.handling = 'phone';
                idxColumn.expanded = true;
                idxColumn.warning = 'Notice, by default this field will be handled as a phone field. You mght want to double check my decision.';
              }

              /*
               * Notice, if we're not sure whether or not column should be a part of POST and PUT
               * we expand the column by default, to give visual clues to the user that he needs to
               * pay particular attention to this column, and attach a warning with the column.
               */
              if (idxColumn.automatic && !idxColumn.primary) {
                idxColumn.expanded = true;
                idxColumn.warning = 'Warning, I could not determine with certainty if this column should be included in your create and update endpoints. Please carefully look at it and decide for yourself.';
              }

              /*
               * If column is a foreign key, we also warn the user such that he can associate it with the
               * correct field in the foreign table.
               */
              if (idxColumn.foreign_key) {
                idxColumn.expanded = true;
                if (idxColumn.warning) {
                  idxColumn.warning += ' ';
                } else {
                  idxColumn.warning = '';
                }
                idxColumn.warning += 'You need to make sure this column is associated with the correct value field in the referenced table.';
              }
            }
          }
        }
      }
      resolve (true)
    })
  }

  /**
   * Shows load snippet dialog.
   */
  public loadSnippet() {
    if (!this.canLoadSnippet) {
      this.generalService.showFeedback('You need a proper permission.', 'errorMessage', 'Ok', 5000)
      return;
    }
    this.dialog.open(LoadSnippetDialogComponent, {
      width: '550px',
    }).afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.loadSnippet(filename).subscribe({
          next: (content: string) => {
            this.hlInput.hyperlambda = content;
            this.snippetName = filename;
          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')});
      }
    });
  }

  /**
   * Shows the save snippet dialog.
   */
  private saveSnippet() {
    if (!this.hlInput?.hyperlambda || this.hlInput?.hyperlambda === '') {
      this.generalService.showFeedback('Code editor is empty.', 'errorMessage')
      return;
    }

    if (!this.backendService.active?.access.sql.save_file) {
      this.generalService.showFeedback('You need a proper permission.', 'errorMessage', 'Ok', 5000)
      return;
    }
    this.dialog.open(SnippetNameDialogComponent, {
      width: '550px',
      data: this.snippetName || '',
    }).afterClosed().subscribe((filename: string) => {
      if (filename) {
        this.evaluatorService.saveSnippet(filename, this.hlInput.hyperlambda).subscribe({
          next: () => this.generalService.showFeedback('Snippet successfully saved', 'successMessage'),
          error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')});
      }
    });
  }

  /*
   * Will flush server side cache of endpoints (auth invocations) and re-retrieve these again.
   */
  private flushEndpointsAuthRequirements() {
    this.cacheService.delete('magic.auth.endpoints').subscribe({
      next: () => this.backendService.refetchEndpoints(),
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')});
  }

  private watchForActions() {
    this.codemirrorActionsSubscription = this.codemirrorActionsService.action.subscribe((action: string) => {
      switch (action) {
        case 'save':
          this.saveSnippet();
          break;

        case 'insertSnippet':
          this.loadSnippet();
          break;

        default:
          break;
      }
    })
  }

  ngOnDestroy(): void {
    if (this.dbLoadingSubscription) {
      this.dbLoadingSubscription.unsubscribe();
    }
    if (this.codemirrorActionsSubscription) {
      this.codemirrorActionsSubscription.unsubscribe();
    }
  }
}

const crudMethods: string[] = [
  'post',
  'get',
  'put',
  'delete'
]
