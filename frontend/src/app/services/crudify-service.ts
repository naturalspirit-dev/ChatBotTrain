
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CrudifyModel } from '../models/crudify-model';
import { CustomSQLModel } from '../models/custom-sql-model';
import { CrudifyResult } from '../models/endpoint-result-model';

@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  constructor(private httpClient: HttpClient) { }

  public getDatabases() {
    return this.httpClient.get<any[]>(environment.apiURL + 'magic/modules/mysql/databases');
  }

  public getTables(database: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL +
      'magic/modules/mysql/tables?database=' + encodeURI(database));
  }

  public getColumns(database: string, table: string) {
    return this.httpClient.get<any[]>(
      environment.apiURL +
      'magic/modules/mysql/columns?database=' + encodeURI(database) +
      '&table=' + encodeURI(table));
  }

  public generateCrudEndpoints(model: CrudifyModel) {
    return this.httpClient.post<CrudifyResult>(
      environment.apiURL + 'magic/modules/mysql/crudify', model);
  }

  public createCustomSqlEndpoint(model: CustomSQLModel) {
    return this.httpClient.post<CrudifyResult>(
      environment.apiURL + 'magic/modules/mysql/custom-sql', model);
  }
}
