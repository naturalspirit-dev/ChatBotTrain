
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

// Angular imports.
import { Pipe, PipeTransform } from '@angular/core';

// Utility 3rd party imports.
import { marked } from "marked";

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
