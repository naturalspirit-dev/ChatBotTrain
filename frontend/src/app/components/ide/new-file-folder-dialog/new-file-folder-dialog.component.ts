
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// CodeMirror options according to file extensions.
import fileTypes from '../../files/file-editor/file-types.json'

/**
 * Helper class for passing parameters in and out of modal dialog.
 */
export class FileObject {

  /**
   * If true, the user wants to create a folder, otherwise a file.
   */
  isFolder: boolean;

  /**
   * Name of file object user wants to create.
   */
  name: string;

  /**
   * Path where user wants to create file object.
   */
  path: string;

  /**
   * All existing folders in system.
   */
   folders: string[];
  
  /**
   * All existing files in system.
   */
   files: string[];
}

/**
 * Component for creating a new file system object, either a folder or a file.
 */
@Component({
  selector: 'app-new-file-folder-dialog',
  templateUrl: './new-file-folder-dialog.component.html',
  styleUrls: ['./new-file-folder-dialog.component.scss']
})
export class NewFileFolderDialogComponent {

  // Known file extensions we've got editors for.
  private extensions = fileTypes;

  /**
   * Creates an instance of your component.
   * 
   * @param data File object type and name.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: FileObject) { }

  /**
   * Returns true if the filename is valid, otherwise false.
   */
  public pathValid() {

    // Verifying user has typed a path at all.
    if (!this.data.name || this.data.name.length === 0) {
      return false;
    }

    // Verifying path doesn't contain invalid characters.
    for (const idx of this.data.name) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789_-.'.indexOf(idx.toLowerCase()) === -1) {
        return false;
      }
    }

    // Making sure no other file/folder already exists with the same name.
    if (this.data.isFolder) {
      return this.data.folders.filter(x => x.toLowerCase() === this.data.path + this.data.name.toLowerCase() + '/').length === 0;
    } else {
      return this.data.files.filter(x => x.toLowerCase() === this.data.path + this.data.name.toLowerCase()).length === 0;
    }
  }
}
