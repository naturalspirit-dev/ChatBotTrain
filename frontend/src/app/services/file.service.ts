
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Utility component imports.
import { saveAs } from "file-saver";

// Application specific imports.
import { HttpService } from './http.service';
import { Response } from '../models/response.model';
import { MacroDefinition } from '../models/macro-definition.model';

/**
 * File service allowing you to read, download, upload and delete files.
 */
@Injectable({
  providedIn: 'root'
})
export class FileService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns a list of all files existing within the specified folder.
   * 
   * @param folder Folder from where to retrieve list of files from
   * @param filter Filter for which files to return
   */
  public listFiles(folder: string, filter: string = null) {

    // Dynamically building our query.
    let query = '?folder=' + encodeURIComponent(folder);
    if (filter) {
      query += '&filter=' + encodeURIComponent(filter);
    }

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-files' +
      query);
  }

  /**
   * Returns a list of all files existing within the specified folder recursively.
   * 
   * @param folder Folder from where to retrieve list of files from
   * @param sysFiles If true will return system files
   */
  public listFilesRecursively(folder: string, sysFiles: boolean) {

    // Dynamically building our query.
    let query = '?folder=' + encodeURIComponent(folder);

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-files-recursively' +
      query +
      '&sys=' + sysFiles);
  }

  /**
   * Returns a list of all folders existing within the specified folder.
   * 
   * @param folder Folder from where to retrieve list of folders from
   */
  public listFolders(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-folders?folder=' +
      encodeURIComponent(folder));
  }

  /**
   * Returns a list of all folders existing within the specified folder recursively.
   * 
   * @param folder Folder from where to retrieve list of folders from
   * @param sysFiles If true will return system folders
   */
  public listFoldersRecursively(folder: string, sysFiles: boolean) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string[]>(
      '/magic/system/file-system/list-folders-recursively?folder=' +
      encodeURIComponent(folder) +
      '&sys=' + sysFiles);
  }

  /**
   * Loads the specified file from backend.
   * 
   * @param filename Filename and full path of file to load.
   */
  public loadFile(filename: string) {

    // Making sure we copmmunicate that we want to have text result.
    const requestOptions = {
      responseType: 'text'
    };

    // Invoking backend and returning observable to caller.
    return this.httpService.get<string>(
      '/magic/system/file-system/file?file=' +
      encodeURIComponent(filename),
      requestOptions);
  }

  /**
   * Saves the specified file with the given filename.
   * 
   * @param filename Filename to save file as
   * @param content Content of file
   */
  public saveFile(filename: string, content: string) {

    // Passing in file as form data.
    const folder = filename.substr(0, filename.lastIndexOf('/') + 1);
    const formData: FormData = new FormData();
    const blob = new Blob([content], { type: 'text/plain'});
    formData.append('file', blob, filename.substr(filename.lastIndexOf('/') + 1));

    return this.httpService.put<any>(
      '/magic/system/file-system/file?folder=' +
      encodeURI(folder),
      formData
    );
  }

  /**
   * Renames the specified file or folder in the backend.
   * 
   * @param oldName File or folder to rename.
   * @param newName New name for file or folder.
   */
  public rename(oldName: string, newName: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>(
      '/magic/system/file-system/rename', {
        oldName,
        newName,
      });
  }

  /**
   * Deletes an existing file on the server.
   * 
   * @param file Path of file to delete
   */
  public deleteFile(file: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/system/file-system/file?file=' +
      encodeURIComponent(file));
  }

  /**
   * Downloads a file from backend.
   * 
   * @param path File to download
   */
  public downloadFile(path: string) {

    // Invoking backend to download file and opening up save-as dialog.
    this.httpService.download(
      '/magic/system/file-system/file?file=' +
      encodeURI(path)).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.split(';')[1].trim().split('=')[1].replace(/"/g, '');
        const file = new Blob([res.body]);
        saveAs(file, filename);
      });
  }

  /**
   * Uploads a file to your backend.
   * 
   * @param path Folder to upload file to
   * @param file File you want to upload
   */
  public uploadFile(path: string, file: any) {

    // Invoking backend with a form data object containing file.
    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpService.put<any>(
      '/magic/system/file-system/file?folder=' +
      encodeURI(path),
      formData
    );
  }

  /**
   * Downloads a file from backend.
   * 
   * @param path File to download
   */
  public downloadFolder(path: string) {

    // Invoking backend to download file and opening up save-as dialog.
    this.httpService.download(
      '/magic/system/file-system/download-folder?folder=' +
      encodeURI(path)).subscribe(res => {

        // Retrieving the filename, as provided by the server.
        const disp = res.headers.get('Content-Disposition');
        let filename = disp.substring(disp.indexOf('=') + 1);
        filename = filename.substring(1, filename.lastIndexOf('"'));
        const file = new Blob([res.body], { type: 'application/zip' });
        saveAs(file, filename);
      });
  }

  /**
   * Creates a new folder on the server.
   * 
   * @param folder Path for new folder
   */
  public createFolder(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.put<Response>(
      '/magic/system/file-system/folder', {
        folder
    });
  }

  /**
   * Deletes an existing folder on the server.
   * 
   * @param folder Path of folder to delete
   */
  public deleteFolder(folder: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.delete<Response>(
      '/magic/system/file-system/folder?folder=' +
      encodeURIComponent(folder));
  }

  /**
   * Returns macro definition to caller for specified macro.
   * 
   * @param file Full path of macro to retrieve meta information about
   */
  public getMacroDefinition(file: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<MacroDefinition>('/magic/system/ide/macro?macro=' +
      encodeURIComponent(file));
  }

  /**
   * Returns macro definition to caller for specified macro.
   * 
   * @param file Full path of macro to retrieve meta information about
   * @param args Arguments to macro execution
   */
  public executeMacro(file: string, args: any) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/system/ide/execute-macro', {
      macro: file,
      args
    });
  }

  /**
   * Uploads a zip file to your backend.
   * 
   * @param path Folder to upload file to
   * @param file File you want to upload
   */
  public installModule(file: File) {

    // Invoking backend with a form data object containing file.
    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.httpService.put<any>(
      '/magic/system/file-system/install-module',
      formData
    );
  }
}
