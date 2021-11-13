
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular imports.
import { Pipe, PipeTransform } from '@angular/core';

// Utility 3rd party imports.
import * as marked from "marked";

/**
 * Markdown pipe, transforming Markdown to HTML.
 */
@Pipe({
  name: 'marked'
})
export class MarkedPipe implements PipeTransform {

  /**
   * Transforms Markdown to HTML, and returns to caller.
   * 
   * @param value Markdown to transform to HTML
   */
  transform(value: any): any {
    if (!value || value.length === 0) {
      return '';
    }
    return marked(value);
  }
}
