
import { Component, OnInit } from '@angular/core';
import { LogService } from 'src/app/services/log-service';
import { LogItem } from 'src/app/models/log-item';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ViewLogDetails } from './modals/view-log-details';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChartOptions, ChartType } from 'chart.js';
import { Label, SingleDataSet } from 'ng2-charts';
import * as moment from 'moment';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

  public offset = 0;
  public limit = 10;
  public items: LogItem[] = null;
  public count: number;
  public noErrors = 0;
  public displayedColumns: string[] = ['when', 'type', 'content', 'details'];
  public filter: string = null;
  public filterFormControl: FormControl;
  public live: boolean;

  // Statistics pie charts.
  public pieChartOptions: ChartOptions = {
    responsive: true,
  };
  public pieChartLabels: Label[] = [];
  public pieChartData: SingleDataSet = null;
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartPlugins = [];
  public pieChartColors = [{
    backgroundColor: [
      'rgba(180,180,180,0.8)',
      'rgba(120,120,120,0.8)',
    ]}];

  // Statistics bar charts.
  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartLabels: Label[] = [];
  public barChartData: SingleDataSet = null;
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = [];
  public barChartColors = [{
    backgroundColor: [
      'rgba(200,200,200,0.8)',
      'rgba(190,190,190,0.8)',
      'rgba(180,180,180,0.8)',
      'rgba(170,170,170,0.8)',
      'rgba(160,160,160,0.8)',
      'rgba(150,150,150,0.8)',
      'rgba(140,140,140,0.8)',
      'rgba(130,130,130,0.8)',
      'rgba(120,120,120,0.8)',
      'rgba(110,110,110,0.8)',
    ]}];

  constructor(
    private logService: LogService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.filterFormControl = new FormControl('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: any) => {
        this.filter = query;
        this.offset = 0;
        this.getItems();
      });
    this.getItems();
  }

  pollClicked(e: MatSlideToggleChange) {
    this.live = e.checked;
    this.poll();
  }

  poll() {
    if (this.live) {
      this.getItems();
      setTimeout(() => {
        this.poll();
      }, 5000);
    }
  }

  getItems() {

    // Getting log items in raw format according to filter.
    this.logService.listLogItems(
      this.filter,
      this.offset,
      this.limit).subscribe(res => {
      this.items = res;
    }, error => {
      this.showHttpError(error);
    });

    // Getting count of log items according to filter.
    this.logService.countLogItems(this.filter).subscribe(res => {
      this.count = res.result;
    }, error => {
      this.showHttpError(error);
    });

    // Counting number of errors in system.
    this.logService.countErrorItems().subscribe(res => {
      this.noErrors = res.result;
    }, error => {
      this.showHttpError(error);
    });

    // Getting statistics for our pie chart (type of error).
    this.logService.statistics().subscribe(res => {
      this.pieChartData = res.map(x => x.count);
      this.pieChartLabels = res.map(x => x.type);
      this.pieChartColors = [{
        backgroundColor: res.map(x => {
          if (x.type === 'error') {
            return 'rgba(255,180,180,0.8)';
          } else if (x.type === 'fatal') {
            return 'rgba(255,80,80,0.8)';
          } else if (x.type === 'info') {
            return 'rgba(120,120,120,0.8)';
          } else if (x.type === 'debug') {
            return 'rgba(80,180,80,0.8)';
          }
          throw 'Unknown log info type!';
        })
      }];
    });

    // Getting log items count according to date (10 last days).
    this.logService.statisticsDays().subscribe(res => {
      this.barChartData = res.map(x => x.count);
      this.barChartLabels = res.map(x => moment(new Date(x.date)).format("D. MMM"));
    });
  }

  paged(e: PageEvent) {
    this.offset = e.pageSize * e.pageIndex;
    this.getItems();
  }

  showDetails(item: LogItem) {
    this.dialog.open(ViewLogDetails, {
      width: '80%',
      data: item
    });
  }

  deleteAll() {
    this.logService.deleteAll().subscribe(res => {
      this.getItems();
    }, error => {
      this.showHttpError(error);
    });
  }

  showHttpError(error: any) {
    this.snackBar.open(error.error ? error.error.message : error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showOnlyErrors() {
    this.filterFormControl.setValue('error');
    this.getItems();
  }
}
