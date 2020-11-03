
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Endpoint } from '../../models/endpoint';
import { EndpointService } from '../../services/endpoint-service';
import { MatInput } from '@angular/material/input';
import { MatSelectChange } from '@angular/material/select';
import { saveAs } from 'file-saver';
import { TicketService } from 'src/app/services/ticket-service';

@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrls: ['./endpoints.component.scss']
})
export class EndpointsComponent implements OnInit {

  @ViewChild('queryParamaters') queryParametersInput: MatInput;
  public displayedColumns: string[] = ['url', 'auth', 'verb', 'type', 'returns', 'selected'];
  public displayedSecondRowColumns: string[] = ['details'];
  public endpoints: any[] = [];
  public filter = '';
  public name = '';
  public showSystemEndpoints = false;
  public isFetching = false;
  public templates: string[] = [];
  public selectedTemplate = '';
  public templateDescription = '';
  public copyright = 'This file was automatically generated by Magic. Read more at https://polterguy.github.io';
  public sortingColumn: string = '';

  constructor(
    private service: EndpointService,
    private ticketService: TicketService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.isFetching = true;
    this.service.getAllEndpoints().subscribe((res) => {
      this.endpoints = (res || []).map(x => {
        return {
          endpoint: x,
          extra: null,
          selected: !x.path.startsWith('magic/modules/system/') &&
          !x.path.startsWith('magic/modules/magic/'),
        };
      });
      this.isFetching = false;
      if (!this.hasSelectedEndpoints()) {
        this.showError('You have to crudify at least one database table before there is anything here of interest');
      }
    }, err => {
      this.showError(err.error.message);
      this.isFetching = false;
    });
    this.service.getAllTemplates().subscribe(res => {
      this.templates = res;
    }, error => {
      this.showError(error.error.message);
    });
  }

  getFilterText() {
    return 'Search among ' + this.getFilteredSystemEndpoints().length + ' endpoints ...';
  }

  getFilteredEndpoints() {
    if (this.filter === '') {
      return this.getFilteredSystemEndpoints();
    }
    return this.getFilteredSystemEndpoints().filter(x => {
      return x.endpoint.verb === this.filter ||
        x.endpoint.path.indexOf(this.filter) > -1 ||
        (x.endpoint.type && x.endpoint.type.indexOf(this.filter) > -1) ||
        (x.endpoint['Content-Type'] && x.endpoint['Content-Type'].indexOf(this.filter) > -1) ||
        (x.endpoint.auth && x.endpoint.auth.filter((y: string) => y === this.filter).length > 0);
    });
  }

  hasSelectedEndpoints() {
    return this.endpoints.filter(x => x.selected).length > 0 ||
      this.endpoints.filter(x => x.endpoint.path.includes('/roles-count')).length > 0;
  }

  getFilteredSystemEndpoints() {
    if (this.showSystemEndpoints === true) {
      return this.endpoints;
    }
    return this.endpoints
      .filter(x => x.endpoint.path.indexOf('magic/modules/system/') !== 0 &&
        x.endpoint.path.indexOf('magic/modules/magic/') !== 0);
  }

  concatenateAuth(auth: string[]) {
    if (auth === null || auth === undefined) {
      return '';
    }
    return auth.join(',');
  }

  getEndpointType(type: string) {
    if (type !== undefined && type !== null && type !== '') {
      return type.substr(5);
    }
    return '';
  }

  getDescription(item: Endpoint) {
    if (item.description !== undefined) {
      return item.description;
    }
    if (item.type) {
      return item.type.substr(5) + ' ' + item.path.substr(item.path.lastIndexOf('/') + 1);
    }
  }

  getClassForDetails(el: any) {
    if (el.extra !== null && el.extra.visible) {
      return 'has-details';
    }
    return 'no-details';
  }

  getClassForRow(row: any) {
    if (row.extra !== null && row.extra.visible) {
      return 'selected';
    }
    return '';
  }

  sortEndpoints(col: string) {
    this.sortingColumn = col;
    this.endpoints = this.endpoints.sort((lhs, rhs) => {
      if (lhs.endpoint[col] < rhs.endpoint[col]) {
        return -1;
      } else if (lhs.endpoint[col] > rhs.endpoint[col]) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  getCodeMirrorOptions() {
    return {
      lineNumbers: true,
      theme: 'mbo',
      mode: 'hyperlambda',
      tabSize: 3,
      indentUnit: 3,
      indentAuto: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
        Tab: 'indentMore',
        'Ctrl-Space': 'autocomplete',
      }
    };
  }

  selectEndpoint(el: any) {

    // Checking if we can just toggle its visibility.
    if (el.extra !== null) {
      if (el.extra.visible) {
        el.extra.visible = false;
        el.extra.endpointResult = null;
        el.extra.image = null;
      } else {
        el.extra.visible = true;
      }
      return;
    }

    switch (el.endpoint.verb) {
      case 'post':
      case 'put':
        el.extra = {
          isJsonArguments: true,
          isBodyArguments: false,
          arguments: JSON.stringify(el.endpoint.input, null, 2),
          queryParameters: null,
          endpointResult: null,
          image: null,
          visible: true,
        };
        break;

      case 'get':
      case 'delete':
      case 'patch':
        const args = [];
        for (const idx in el.endpoint.input) {
          if (Object.prototype.hasOwnProperty.call(el.endpoint.input, idx)) {
            if (el.endpoint.verb !== 'patch' || idx !== 'body') {
              args.push({
                name: idx,
                type: el.endpoint.input[idx],
              });
            }
          }
        }
        if (el.endpoint.verb === 'patch') {
          el.extra = {
            isBodyArguments: true,
            queryParameters: args,
            arguments: '',
            endpointResult: null,
            image: null,
            visible: true,
            body: '',
          };
        } else {
          el.extra = {
            isJsonArguments: false,
            isBodyArguments: false,
            arguments: '',
            queryParameters: args,
            endpointResult: null,
            image: null,
            visible: true,
          };
        }
        break;
      }
  }

  argumentClicked(el: any, name: string) {
    let args = el.extra.arguments;
    if (args.length > 0) {
      if (args.indexOf(name + '=') !== -1) {
        this.showError('You cannot set the same argument twice');
        return;
      }
      args += '&' + name + '=';
    } else {
      args += name + '=';
    }
    el.extra.arguments = args;
  }

  evaluate(el: any) {

    let path = el.endpoint.path;
    if (!el.extra.isJsonArguments && el.extra.arguments !== '') {
      path += '?' + el.extra.arguments;
    }

    switch (el.endpoint.verb) {

      case 'get':

        // Special case for image types.
        if (el.endpoint['Content-Type'] && el.endpoint['Content-Type'].startsWith('image'))
        {
          el.extra.image = this.ticketService.getBackendUrl() + path;
        }
        else
        {
          this.service.executeGet(path).subscribe((res) => {
            el.extra.endpointResult = JSON.stringify(res || [], null, 2);
            this.showHttpSuccess('Endpoint successfully evaluated');
          }, (error) => {
            this.showError(error.error.message);
          });
        }
        break;

      case 'delete':
        this.service.executeDelete(path).subscribe((res) => {
          el.extra.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showError(error.error.message);
        });
        break;

      case 'post':
        this.service.executePost(path, JSON.parse(el.extra.arguments)).subscribe((res) => {
          el.extra.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showError(error.error.message);
        });
        break;

      case 'put':
        this.service.executePut(path, JSON.parse(el.extra.arguments)).subscribe((res) => {
          el.extra.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showError(error.error.message);
        });
        break;

      case 'patch':
        this.service.executePatch(path, el.extra.body).subscribe((res) => {
          el.extra.endpointResult = JSON.stringify(res || [], null, 2);
          this.showHttpSuccess('Endpoint successfully evaluated');
        }, (error) => {
          this.showError(error.error.message);
        });
        break;
      }
    return false;
  }

  generateFrontEnd() {
    if (this.name === null || this.name === undefined || this.name === '') {
      this.showError('You have to provide a name for your app');
      return;
    }
    const toGenerate = this.endpoints.filter(x => x.selected).map(x => x.endpoint);
    const args = {
      endpoints: toGenerate,
      apiUrl: this.ticketService.getBackendUrl(),
      name: this.name,
      templateName: this.selectedTemplate,
      copyright: this.copyright,
    };
    this.isFetching = true;
    this.service.generate(args).subscribe(res => {
      const file = new Blob([res.body], { type: 'application/zip' });
      const disposition = res.headers.get('Content-Disposition');
      const startIndex = disposition.indexOf('filename=') + 10;
      const endIndex = disposition.length - 1;
      const filename = disposition.substring(startIndex, endIndex);
      saveAs(file, filename);
      this.isFetching = false;
    }, error => {
      this.showError(error.error.message);
      this.isFetching = false;
    });
  }

  templateChanged(e: MatSelectChange) {
    this.selectedTemplate = e.value;
    this.service.getTemplateMarkdown(e.value).subscribe(res => {
      this.templateDescription = res.markdown;
    }, error => {
      this.showError(error.error.message);
    });
  }

  showError(error: string) {
    this.snackBar.open(error, 'Close', {
      duration: 10000,
      panelClass: ['error-snackbar'],
    });
  }

  showHttpSuccess(msg: string) {
    this.snackBar.open(msg, null, {
      duration: 2000,
    });
  }
}
