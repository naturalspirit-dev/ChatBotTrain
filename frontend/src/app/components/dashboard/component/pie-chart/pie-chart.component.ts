/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

// Utility imports.
import { ThemeService } from 'src/app/services/theme.service';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective, Label, SingleDataSet } from 'ng2-charts';
import { SystemReport } from 'src/app/models/dashboard.model';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

// Importing global chart colors.
import lightThemeColors from '../../_pie_chart_colors.json';
import darkThemeColors from '../../_bar_chart_colors.json';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit, OnDestroy {

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public colors = [];
  private subscribeThemeChange: Subscription;
  private theme: string = '';

  // chart options
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true, 
    maintainAspectRatio: true,
    aspectRatio: 5 / 3.75,
    legend: {
      display: false
    },
    plugins: {
      datalabels: {
        align: 'center',
        
        padding: 0,
        offset: 0,
        color: (context) => {
          return (this.theme === 'light') ? 'black' : 'white'
        },
        font: (context) => {
          var w = context.chart.width;
          return {
            size: w < 512 ? 12 : 14,
            weight: 'bold'
          };
        },
        formatter: (value, context) => {
          return context.chart.data.labels[context.dataIndex] + ' \n' + context.chart.data.datasets[0].data[context.dataIndex] + ' files';
        }
      }
    },
    layout: {
      padding: 0
    },
    tooltips: {
      borderWidth: 1,
      caretPadding: 15,
      displayColors: false,
      callbacks: {
        label: (tooltipItem, data) => {
          const datasetLabel = this.pieChartLabels[tooltipItem.index] || '';
          return  datasetLabel + ':';
        },
        footer: (tooltipItem, data) => {
          const datasetLabelLoc = this.pieChartLocLabel[tooltipItem[0].index] || '';
          return [datasetLabelLoc + ' lines of code'];
        }
      }
    }
  };

  @Input() data: SystemReport;
  public pieChartLabels: Label[] = [];
  public pieChartLocLabel: string[] = [];
  public pieChartData: SingleDataSet = [];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartPlugins = [pluginDataLabels];
  
  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {

    /**
     * Setting chart color based on the selected theme
     */
    this.subscribeThemeChange = this.themeService.themeChanged.subscribe((val: any) => {
      this.colors = (val === 'light') ? lightThemeColors : darkThemeColors;
      this.theme = val;
    });
    
    /**
     * waiting for the data to be ready
     * then call the preparation function
     */
    (async () => {
      while (!this.data)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (this.data) {
        this.pieChartDataPrep();
      }
    })();
  }

  /**
     * the preparation of the data for the pie chart
     */
  pieChartDataPrep(){
    let keys = Object.keys(this.data.modules);
    let valuesFiles = [];
    let valuesLoc = [];
    keys.forEach((key)  => {
      valuesFiles.push(this.data.modules[key].files);
      valuesLoc.push(this.data.modules[key].loc);
    })

    this.pieChartLabels = keys;
    this.pieChartData = valuesFiles;
    this.pieChartLocLabel = valuesLoc;
  }

  /**
   * Unsubscribes from the themeChange observable on page leave, for performance protection
   */
  ngOnDestroy(): void {
    this.subscribeThemeChange.unsubscribe();
  }

}
