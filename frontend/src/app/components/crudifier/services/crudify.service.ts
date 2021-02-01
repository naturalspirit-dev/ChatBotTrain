
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Crudify } from '../models/crudify.model';
import { LocResult } from '../models/loc-result.model';
import { CustomSql } from '../models/custom-sql.model';
import { Response } from 'src/app/models/response.model';
import { HttpService } from '../../../services/http.service';
import { of } from 'rxjs';

/**
 * Crudify service, allows you to crudify your databases.
 */
@Injectable({
  providedIn: 'root'
})
export class CrudifyService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns all available input reactors from backend.
   */
  public getInputReactor() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any[]>('/magic/modules/system/crudifier/input-reactors');
  }

  /**
   * Crudifies a database table for a specified HTTP verb.
   * 
   * @param data Input for process
   */
  public crudify(data: Crudify) {

    // Sanity checking invocation, returning early if we cannot generate endpoint.
    let generate = true;
    if (data.verb === 'post' && data.args.columns.length === 0 && data.args.primary.length === 0) {
      generate = false;
    }
    if (data.verb === 'put' && data.args.columns.length === 0) {
      generate = false;
    }
    if (data.verb === 'delete' && data.args.primary.length === 0) {
      generate = false;
    }
    if (!generate) {
      return of<LocResult>({
        loc: 0,
        result: 'Endpoint not created'
      });
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.post<LocResult>('/magic/modules/system/crudifier/crudify', data);
  }

  /**
   * Generates an SQL endpoint for a specified HTTP verb.
   * 
   * @param data Input for process
   */
  public generateSqlEndpoint(data: CustomSql) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/modules/system/crudifier/custom-sql', data);
  }
}
