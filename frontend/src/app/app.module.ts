
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OWL_MOMENT_DATE_TIME_ADAPTER_OPTIONS } from 'ng-pick-datetime-moment';
import { JwtModule } from '@auth0/angular-jwt';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import './extensions/hyperlambda.js';
import 'codemirror/addon/hint/sql-hint.js';

import { HomeComponent } from './components/home/home.component';
import { LogsComponent } from './components/logging/logs.component';
import { EndpointsComponent } from './components/endpoints/endpoints.component';
import { SetupComponent } from './components/setup/setup.component';
import { UsersComponent } from './components/users/users.component';
import { RolesComponent } from './components/roles/roles.component';
import { EvaluatorComponent } from './components/evaluator/evaluator.component';
import { LegendDialogComponent } from './components/evaluator/modals/legend-dialog';
import { ViewLogDetails } from './components/logging/modals/view-log-details';
import { FileDialogComponent } from './components/evaluator/modals/file-dialog';
import { FilesComponent } from './components/files/files.component';
import { NewFileDialogComponent } from './components/files/modals/new-file-dialog';
import { NewUserDialogComponent } from './components/users/modals/new-user-dialog';
import { NewRoleDialogComponent } from './components/roles/modals/new-role-dialog';
import { ConfirmDeletionDialogComponent } from './components/files/modals/confirm-deletion-dialog';
import { GetSaveFilenameDialogComponent } from './components/sql/modals/get-save-filename';
import { ConfirmDeletionTaskDialogComponent } from './components/scheduler/modals/confirm-deletion-dialog';
import { CreateValidatorDialogComponent } from './components/crudify/modals/create-validator-dialog';
import { AddRoleDialogComponent } from './components/users/modals/add-role-dialog';
import { CrudifyComponent } from './components/crudify/crudify.component';
import { environment } from 'src/environments/environment';
import { SqlComponent } from './components/sql/sql.component';
import { TasksComponent } from './components/scheduler/tasks.component';
import { DateFromPipe } from './pipes/date-from-pipe';
import { DateToPipe } from './pipes/date-to-pipe';
import { DynamicPipe } from './pipes/dynamic-pipe';
import { NewTaskDialogComponent } from './components/scheduler/modals/new-task-dialog';
import { NewDueDialog } from './components/scheduler/modals/new-due-dialog';
import { MarkedPipe } from './pipes/marked.pipe';

export function tokenGetter() {
  const token = localStorage.getItem('accessToken');
  if (token !== null && token !== undefined) {
    return JSON.parse(token).ticket;
  }
  return null;
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LogsComponent,
    EndpointsComponent,
    SetupComponent,
    UsersComponent,
    RolesComponent,
    EvaluatorComponent,
    LegendDialogComponent,
    ViewLogDetails,
    FileDialogComponent,
    FilesComponent,
    NewFileDialogComponent,
    NewUserDialogComponent,
    NewRoleDialogComponent,
    ConfirmDeletionDialogComponent,
    GetSaveFilenameDialogComponent,
    ConfirmDeletionTaskDialogComponent,
    NewTaskDialogComponent,
    NewDueDialog,
    CreateValidatorDialogComponent,
    AddRoleDialogComponent,
    CrudifyComponent,
    SqlComponent,
    TasksComponent,
    DateFromPipe,
    DateToPipe,
    DynamicPipe,
    MarkedPipe,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    JwtModule.forRoot({
      config: {
        tokenGetter,
        whitelistedDomains: environment.whitelistedDomains,
      }
    }),
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatRadioModule,
    MatMomentDateModule,
    CodemirrorModule,
  ],
  exports: [
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
  providers: [
    {
      provide: OWL_MOMENT_DATE_TIME_ADAPTER_OPTIONS,
      useValue: { useUtc: true }
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    NewFileDialogComponent,
    NewUserDialogComponent,
    NewRoleDialogComponent,
    LegendDialogComponent,
    ViewLogDetails,
    FileDialogComponent,
    NewTaskDialogComponent,
    NewDueDialog,
    ConfirmDeletionDialogComponent,
    GetSaveFilenameDialogComponent,
    ConfirmDeletionTaskDialogComponent,
    CreateValidatorDialogComponent,
    AddRoleDialogComponent]
})
export class AppModule { }
