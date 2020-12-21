
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * From now pipe, displaying how many seconds/minutes/hours/etc from now a date is.
 */
@Pipe({
  name: 'from'
})
export class DateFromPipe implements PipeTransform {

  transform(value: any) {
    const dateWhen = new Date(value).getTime();
    const now = new Date().getTime();
    const deltaSeconds = Math.round((dateWhen - now) / 1000);
    if (deltaSeconds < 180) {
      return `${deltaSeconds} seconds from now`;
    }
    const deltaMinutes = Math.round(deltaSeconds / 60);
    if (deltaMinutes < 60) {
      return `${deltaMinutes} minutes from now`;
    }
    const deltaHours = Math.round(deltaMinutes / 60);
    if (deltaHours < 24) {
      return `${deltaHours} hours from now`;
    }
    const deltaDays = Math.round(deltaHours / 24);
    if (deltaDays < 60) {
      return `${deltaDays} days from now`;
    }
    const deltaWeeks = Math.round(deltaDays / 7);
    if (deltaWeeks < 20) {
      return `${deltaWeeks} weeks from now`;
    }
    const deltaMonths = Math.round(deltaWeeks / 4.2);
    return `${deltaMonths} months from now`;
  }
}
