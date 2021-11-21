
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Endpoint } from '../../endpoints/models/endpoint.model';

/**
 * Helper class for passing parameters in and out of modal dialog.
 */
export class EndpointModel {

  /**
   * Filename for endpoint.
   */
  filename: string;

  /**
   * HTTP verb file encapsulates.
   */
  verb: string;

  /**
   * URL to invoke file.
   */
  url: string;

  /**
   * Endpoint data for data component.
   */
  endpoint: Endpoint;
}

/**
 * Component for executing an endpoint file through a modal window.
 */
@Component({
  selector: 'app-execute-endpoint-dialog',
  templateUrl: './execute-endpoint-dialog.component.html',
  styleUrls: ['./execute-endpoint-dialog.component.scss']
})
export class ExecuteEndpointDialogComponent {

  /**
   * Creates an instance of your component.
   * 
   * @param data Filename wrapping endpoint
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: EndpointModel) { }
}
