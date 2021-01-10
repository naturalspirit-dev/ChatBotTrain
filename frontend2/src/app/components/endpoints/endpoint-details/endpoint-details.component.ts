
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { Component, Input, OnInit } from '@angular/core';

// Application specific imports.
import { Endpoint } from '../models/endpoint.model';
import { Argument } from '../models/argument.model';
import { EndpointService } from '../services/endpoint.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { AddQueryParameterComponentDialog } from './add-query-parameter-dialog/add-query-parameter-dialog.component';

// CodeMirror options.
import json from '../../codemirror/options/json.json'
import json_readonly from '../../codemirror/options/json_readonly.json'

/**
 * Endpoint details component, showing information specific to a single
 * endpoint, and allowing user to invoke endpoint.
 */
@Component({
  selector: 'app-endpoint-details',
  templateUrl: './endpoint-details.component.html',
  styleUrls: ['./endpoint-details.component.scss']
})
export class EndpointDetailsComponent implements OnInit {

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptions = {
    json: json,
  };

  /**
   * CodeMirror options object, taken from common settings.
   */
  public cmOptionsReadonly = {
    json: json_readonly,
  };

  /**
   * Payload example for JSON type of endpoints.
   */
  public payload: string = null;

  /**
   * Result of invocation.
   */
  public result: string = null;

  /**
   * URL model for invoking endpoint.
   */
  public url: string = null;

  /**
   * Query parameters added to URL.
   */
  public query: any[] = [];

  /**
   * Model for instance.
   */
  @Input() public endpoint: Endpoint;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to be able to create add query value dialog
   * @param clipboard Needed to copy URL of endpoint
   * @param backendService Needed to retrieve base root URL for backend
   * @param feedbackService Needed to provide feedback to user
   * @param endpointService Needed to be able to invoke endpoint
   */
  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Model for URL that invokes endpoint.
    this.url = '/' + this.endpoint.path;

    // Checking if this is a JSON payload or not.
    if (this.endpoint.verb !== 'get' && this.endpoint.verb !== 'delete') {

      // JSON payload type.
      let payload = {};
      for (var idx of this.endpoint.input) {
        let type: any = idx.type;
        switch (type) {

          case "long":
            type = 42;
            break;

          case "date":
            type = new Date().toISOString();
            break;

          case "bool":
            type = true;
            break;

          case "string":
            type = "foo";
            break;
        }
        payload[idx.name] = type;
      }
      this.payload = JSON.stringify(payload, null, 2);
    }
  }

  /**
   * Returns string representation of authorization requirements for endpoint.
   * 
   * @param auth List of roles
   */
  public getAuth(auth: string[]) {
    return auth.join(', ');
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
  public copyUrl() {

    // Copies the currently edited endpoint's URL prepended by backend root URL.
    this.clipboard.copy(this.backendService.current.url + this.url);
  }

  /**
   * Returns arguments for endpoint.
   * 
   * @param args List of all arguments for endpoint
   * @param controlArguments Whether or not to return control arguments or non-control arguments
   */
  public getArguments(args: Argument[], controlArguments: boolean) {

    // Checking if this is not a CRUD read/count type of endpoint.
    if (this.endpoint.type === 'crud-read' || this.endpoint.type === 'crud-count') {

      // Read or count CRUD endpoint
      return args.filter(x => {
        switch (x.name) {
          case 'operator':
          case 'limit':
          case 'offset':
          case 'order':
          case 'direction':
            return controlArguments;
          default:
            return !controlArguments;
        }
      });
    } else {

      // Not a read or count CRUD endpoint.
      if (controlArguments)
        return [];
      return args;
    }
  }

  /**
   * Returns tooltip information for specified argument.
   * 
   * @param arg Argument to retrieve tooltip for
   */
  public getChipTooltip(arg: Argument) {

    // Checking if this is not a CRUD read/count type of endpoint.
    if (this.endpoint.type === 'crud-read' || this.endpoint.type === 'crud-count') {

      // Read or count CRUD endpoint.
      const query = this.query.filter(x => x.name == arg.name);
      if (query.length === 0) {
  
        // Argument has not been added to query paramaters for invocation.
        switch (arg.name) {

          case 'operator':
            return 'Boolean operator to use for conditions';

          case 'limit':
            return 'Maximum number of items to return';

          case 'offset':
            return 'Offset from where to return items';

          case 'order':
            return 'Column to sort by';

          case 'direction':
            return 'Direction to sort by';

          default:
            if (arg.name.indexOf('.') !== -1) {
  
              // Highly likely a CRUD conditional argument, such as 'xxx.eq', 'xxx.mteq', etc.
              const comparison = arg.name.substr(arg.name.lastIndexOf('.') + 1);
              const field = arg.name.substr(0, arg.name.lastIndexOf('.'));
              switch (comparison) {
  
                case 'eq':
                  return `'${field}' equal to ${arg.type}`;
  
                case 'neq':
                  return `'${field}' not equal to ${arg.type}`;
  
                case 'mteq':
                  return `'${field}' more than or equal to ${arg.type}`;
  
                case 'lteq':
                  return `'${field}' less than or equal to ${arg.type}`;
  
                case 'lt':
                  return `'${field}' less than ${arg.type}`;
  
                case 'mt':
                  return `'${field}' more than ${arg.type}`;
  
                case 'like':
                  return `'${field}' contains ${arg.type}`;
  
                default:
                  return query[0].value;
              }
            } else {
              return arg.type;
            }
        }
      } else {
  
        // Argument has been added to query paramaters for invocation.
        switch (arg.name) {

          case 'operator':
            return query[0].value === 'or' ? 'or conditions together (union)' : 'and conditions together (intersection)';

          case 'limit':
            return `Return maximum ${query[0].value} records`;

          case 'offset':
            return `Return items from record number ${query[0].value}`;

          case 'order':
            return `Sort by '${query[0].value}' column`;

          case 'direction':
            return `Sort ${query[0].value === 'asc' ? 'ascending' : 'descending'}`;

          default:
            if (arg.name.indexOf('.') !== -1) {
  
              // Highly likely a CRUD conditional argument, such as 'xxx.eq', 'xxx.mteq', etc.
              const comparison = arg.name.substr(arg.name.lastIndexOf('.') + 1);
              const field = arg.name.substr(0, arg.name.lastIndexOf('.'));
              switch (comparison) {
  
                case 'eq':
                  return `'${field}' equal to ${query[0].value}`;
  
                case 'neq':
                  return `'${field}' not equal to ${query[0].value}`;
  
                case 'mteq':
                  return `'${field}' more than or equal to ${query[0].value}`;
  
                case 'lteq':
                  return `'${field}' less than or equal to ${query[0].value}`;
  
                case 'lt':
                  return `'${field}' less than ${query[0].value}`;
  
                case 'mt':
                  return `'${field}' more than ${query[0].value}`;
  
                case 'like':
                  return `'${field}' contains ${query[0].value}`;
  
                default:
                  return query[0].value;
              }
            }
            return query[0].value;
          }
        }
      } else {

      // Not a read or count CRUD endpoint.
      const query = this.query.filter(x => x.name === arg.name);
      if (query.length > 0) {
        return `${arg.name} equals ${query[0].value}`;
      }
      return arg.type;
    }
  }

  /**
   * Returns true if specified query parameter is already in invocation list.
   * 
   * @param arg Argument to check for
   */
  public hasQueryParam(arg: Argument) {
    return this.query.filter(x => x.name === arg.name).length > 0;
  }

  /**
   * Invoked when user wants to add a query parameter to URL.
   * 
   * @param arg Argument to add
   */
  public addQueryParameter(arg: Argument) {

    // Showing modal dialog allowing user to add a new query parameter to URL.
    const argValue = this.query.filter(x => x.name == arg.name);
    const dialogRef = this.dialog.open(AddQueryParameterComponentDialog, {
      width: '550px',
      data: {
        argument: arg,
        all: this.endpoint.input,
        old: argValue.length > 0 ? argValue[0].value : null,
      }
    });

    dialogRef.afterClosed().subscribe((value: any) => {

      // Checking if modal dialog wants to create a query parameter.
      if (value || value === false) {

        // Verifying parameter is not already added, and if it is, we remove it first.
        if (this.query.filter(x => x.name === arg.name).length > 0) {
          this.query.splice(this.query.indexOf(this.query.filter(x => x.name === arg.name)[0]), 1);
        }

        // Adding query parameter to list of args, and rebuilding URL.
        this.query.push({
          name: arg.name,
          value: value,
        });
        this.buildUrl();
      }
    });
  }

  /**
   * Invoked when user wants to remove a query parameter from URL.
   * 
   * @param arg Argument to remove
   */
  public removeQueryParameter(arg: Argument) {

    // Removing query parameter from list of args, and rebuilding URL.
    this.query.splice(this.query.indexOf(this.query.filter(x => x.name === arg.name)[0]), 1);
    this.buildUrl();
  }

  /**
   * Invoked when user wants to invoke endpoint.
   */
  public invoke() {

    // Dynamically building our request according to user's specifications, and endpoint type.
    let invocation: Observable<any> = null;
    switch (this.endpoint.verb) {

      case 'get':
        invocation = this.endpointService.get(this.url);
        break;

      case 'delete':
        invocation = this.endpointService.delete(this.url);
        break;

      case 'post':
        invocation = this.endpointService.post(this.url, JSON.parse(this.payload));
        break;

      case 'put':
        invocation = this.endpointService.post(this.url, JSON.parse(this.payload));
        break;

      case 'patch':
        invocation = this.endpointService.post(this.url, JSON.parse(this.payload));
        break;
    }

    // Invoking backend now that we've got our observable.
    invocation.subscribe((res: any) => {

      // Binding result model to result of invocation.
      this.result = JSON.stringify(res || '{}', null, 2);

    }, (error: any) => {
      this.feedbackService.showError(error);
      this.result = null;
    });
  }

  /**
   * Invoked when user wants to close the result view of an invocation.
   */
  public close() {
    this.result = null;
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates URL with root URL and query parameters.
   */
  private buildUrl() {

    // Dynamically building our URL according to query parameters.
    let url = '/' + this.endpoint.path;
    if (this.query.length === 0) {
      this.url = url;
      return;
    }
    url += '?';
    for (let idx of this.query) {
      url += idx.name + '=' + encodeURIComponent(idx.value) + '&';
    }
    this.url = url.substr(0, url.length - 1);
  }
}
