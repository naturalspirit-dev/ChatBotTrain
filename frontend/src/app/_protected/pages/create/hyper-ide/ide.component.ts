
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Component } from '@angular/core';
import { FileNode } from './models/file-node.model';

/**
 * Primary Hyper IDE component, allowing users to browse and edit files.
 */
@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss']
})
export class IdeComponent {

  currentFileData: FileNode;
  searchKey: string;

  showEditor(event: { currentFileData: any }) {

    this.currentFileData = event.currentFileData;
  }

  filterList(event: any) {

    this.searchKey = event.value;
  }
}
