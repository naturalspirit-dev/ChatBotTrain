import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { SharedModule } from 'src/app/shared.module';
import { ComponentsModule } from 'src/app/_general/components/components.module';
import { EndpointRoutingModule } from './endpoint.routing.module';
import { EndpointsComponent } from '../endpoints.component';
import { AutoGeneratorComponent } from '../auto-generator/auto-generator.component';
import { ManualGeneratorComponent } from '../manual-generator/manual-generator.component';
import { AddArgumentDialogComponent } from '../components/add-argument-dialog/add-argument-dialog.component';
import { SqlSnippetDialogComponent } from '../components/sql-snippet-dialog/sql-snippet-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { SingleTableConfigComponent } from '../components/single-table-config/single-table-config.component';
import { ForeignKeyDialogComponent } from '../components/foreign-key-dialog/foreign-key-dialog.component';
import { CmModule } from 'src/app/codemirror/_module/cm.module';



@NgModule({
  declarations: [
    EndpointsComponent,
    AutoGeneratorComponent,
    ManualGeneratorComponent,
    AddArgumentDialogComponent,
    SqlSnippetDialogComponent,
    SingleTableConfigComponent,
    ForeignKeyDialogComponent
  ],
  imports: [
    CommonModule,
    EndpointRoutingModule,
    ComponentsModule,
    CodemirrorModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    CmModule
  ]
})
export class EndpointModule { }