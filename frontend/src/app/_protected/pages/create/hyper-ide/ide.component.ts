
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { FileNode } from './_models/file-node.model';

/**
 * Primary Hyper IDE component, allowing users to browse and edit files.
 */
@Component({
  selector: 'app-ide',
  templateUrl: './ide.component.html',
  styleUrls: ['./ide.component.scss']
})
export class IdeComponent implements OnInit {

  /**
   * Currently selected file.
   */
  currentFileData: FileNode;

  /**
   * Filtering key for files in tree.
   */
  searchKey: Observable<string>;

  /**
   * Type of IDE, canbe 'backend' or 'frontend'.
   */
  public type: Observable<string>;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.type = data.type;
    });
  }

  public showEditor(event: { currentFileData: any }) {
    this.currentFileData = event.currentFileData;
  }

  public filterList(event: any) {
    this.searchKey = event;
  }
}
