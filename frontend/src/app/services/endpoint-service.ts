
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Endpoint } from '../models/endpoint';
import { saveAs } from "file-saver";

@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(private httpClient: HttpClient) { }

  getAllEndpoints() {
    return this.httpClient.get<Endpoint[]>(environment.apiURL + 'magic/modules/system/endpoints/endpoints');
  }

  generate(endpoints: any) {
    this.httpClient.post<ArrayBuffer>(
      environment.apiURL + 'magic/modules/system/endpoints/generate',
      endpoints, {
        observe: 'response',
        responseType: 'blob' as 'json',
      }).subscribe(res => {
        let file = new Blob([res.body], { type: 'application/zip' });
        let filename = 'magic-angular.zip';
        saveAs(file, filename);
      });
  }

  executeGet(url: string) {
    return this.httpClient.get<any>(environment.apiURL + url);
  }

  executeDelete(url: string) {
    return this.httpClient.delete<any>(environment.apiURL + url);
  }

  executePost(url: string, args: any) {
    return this.httpClient.post<any>(environment.apiURL + url, args);
  }

  executePut(url: string, args: any) {
    return this.httpClient.put<any>(environment.apiURL + url, args);
  }
}
