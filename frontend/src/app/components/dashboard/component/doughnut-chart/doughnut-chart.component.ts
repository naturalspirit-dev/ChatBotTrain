/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnDestroy, OnInit } from '@angular/core';

// Utility imports.
import { ThemeService } from 'src/app/services/theme.service';
import { SystemReport } from 'src/app/models/dashboard.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doughnut-chart',
  templateUrl: './doughnut-chart.component.html',
  styleUrls: ['./doughnut-chart.component.scss']
})
export class DoughnutChartComponent implements OnInit, OnDestroy {
  options: any;
  chartInstance: any;

  public colors = [];

  /**
   * The actual data received from the parent component, to be displayed on the chart.
   */
  @Input() data: SystemReport;

  /**
   * The main chart data.
   */
  public chartData: any = [];

  /**
   * Watches changes of the theme.
   */
  private subscribeThemeChange: Subscription;

  /**
   * Sets the current theme.
   */
  private theme: string = '';

  /**
   * 
   * @param themeService For listening to the changes on the theme.
   */
  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {

    /**
     * Setting chart color based on the selected theme
     */
    this.subscribeThemeChange = this.themeService.themeChanged.subscribe((val: any) => {
      this.theme = val;
      this.getOptions();
    });

    /**
     * waiting for the data to be ready
     * then call the preparation function
     */
    (async () => {
      while (!this.data)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (this.data) {
        this.chartDataPrep();
        this.getOptions();
      }
    })();
  }

  /**
     * the preparation of the data for the pie chart
     */
  chartDataPrep() {
    let errorLog = this.data.last_log_items.filter(n => n.type === 'error' || n.type === 'fatal').length;
    let successLog = this.data.last_log_items.filter(n => n.type !== 'error' && n.type !== 'fatal').length;

    this.chartData = [
      { value: errorLog, name: 'Failure' },
      { value: successLog, name: 'Success' }
    ];
  }

  /**
   * Unsubscribes from the themeChange observable on page leave, for performance protection
   */
  ngOnDestroy(): void {
    this.subscribeThemeChange.unsubscribe();
  }

  getOptions() {
    this.options = {
      tooltip: {
        trigger: 'item',
        appendToBody: true
      },
      legend: {
        orient: 'horizontal',
        left: 'top',
        type: 'scroll',
        textStyle: {
          color: this.theme === 'light' ? 'black' : 'white'
        },
        pageIconColor: this.theme === 'light' ? 'black' : 'white',
        pageTextStyle: {
          color: this.theme === 'light' ? 'black' : 'white'
        }
      },
      series: [
        {
          // name: 'Access From',
          type: 'pie',
          radius: '50%',
          data: this.chartData,
          color: ['#ee6666','#91cc75'],
          label: {
            color: this.theme === 'light' ? 'black' : 'white'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
  }
}
