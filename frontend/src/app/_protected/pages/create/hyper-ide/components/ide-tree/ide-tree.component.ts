
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { FlatTreeControl } from '@angular/cdk/tree';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';
import { EndpointService } from 'src/app/_general/services/endpoint.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Endpoint } from 'src/app/_protected/models/common/endpoint.model';
import { ExecuteMacroDialogComponent } from '../execute-macro-dialog/execute-macro-dialog.component';
import { IncompatibleFileDialogComponent } from '../incompatible-file-dialog/incompatible-file-dialog.component';
import { NewFileFolderDialogComponent } from '../new-file-folder-dialog/new-file-folder-dialog.component';
import { Macro, SelectMacroDialogComponent } from '../select-macro-dialog/select-macro-dialog.component';
import { FileNode } from '../../models/file-node.model';
import { FlatNode } from './models/flat-node.model';
import { MacroDefinition } from '../../models/macro-definition.model';
import { TreeNode } from './models/tree-node.model';
import { CodemirrorActionsService } from '../../services/codemirror-actions.service';
import { FileService } from '../../services/file.service';

/**
 * Tree component for Hyper IDE displaying files and folders, allowing user
 * to select and open files, and/or switch to open file, rename file, or close open files.
 */
@Component({
  selector: 'app-ide-tree',
  templateUrl: './ide-tree.component.html',
  styleUrls: ['./ide-tree.component.scss']
})
export class IdeTreeComponent implements OnInit {

  private openFolder: FlatNode;
  private root: TreeNode = {
    name: '',
    path: '/',
    isFolder: true,
    children: [],
    level: 0,
    systemFile: false,
  };

  @Input() searchKey: string;
  
  @Output() showEditor: EventEmitter<any> = new EventEmitter<any>();
  @Output() clearEditorHistory: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() setFocusToActiveEditor: EventEmitter<any> = new EventEmitter<any>();

  endpoints: Endpoint[];
  systemFiles: boolean = false;

  treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);
  dataSource = new MatTreeFlatDataSource(this.treeControl, treeFlattener);
  openFiles: FileNode[] = [];
  currentFileData: FileNode;
  activeFolder: string = '/';
  fileInput: string;
  zipFileInput: string;
  showRenameBox: TreeNode = null;
  currentSelection: string = '';

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private fileService: FileService,
    private generalService: GeneralService,
    private endpointService: EndpointService,
    private codemirrorActionsService: CodemirrorActionsService) { }

  ngOnInit() {
    this.getFilesFromServer().then((res: boolean) => {
      if (res === true) {
        this.dataSource.data = this.root.children;
        this.getEndpoints();
      }
    });
  }

  getFilesFromServer(folder: string = '/') {
    return new Promise<boolean>(resolve => {

      // Helper function to insert files and folders correctly into TreeNode hierarchy.
      const addToRoot = (objects: string[], isFolder: boolean) => {
        for (const idx of objects) {
          const entities = idx.split('/').filter(x => x !== '');
          let parent = this.root;
          let level = 1;
          for (const idxPeek of entities.slice(0, -1)) {
            parent = parent.children.filter(x => x.name === idxPeek)[0];
            level += 1;
          }
          parent.children.push({
            name: entities[entities.length - 1],
            path: idx,
            isFolder: isFolder,
            level: level,
            children: [],
            systemFile: this.isSystemPath(idx),
          });
        }
      }

      // Getting folders recursively.
      this.fileService.listFoldersRecursively(folder, this.systemFiles).subscribe({
        next: (folders: string[]) => {

          addToRoot(folders || [], true);

          // Getting files recursively.
          this.fileService.listFilesRecursively(folder, this.systemFiles).subscribe({
            next: (files: string[]) => {

              addToRoot(files || [], false);
              resolve(true);
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage', 'Ok', 4000)
          });
        },
        error: (error: any) => {
          resolve(false);
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        }
      });
    });
  }

  selectMacro() {
    const dialogRef = this.dialog.open(SelectMacroDialogComponent, {
      width: '550px',
      data: {
        name: '',
      },
    });
    dialogRef.afterClosed().subscribe((result: Macro) => {
      if (result) {
        this.executeMacro(result.name);
      }
    });
  }

  openFile(file: TreeNode) {

    // Checking if file is already open.
    const alreadyOpen = this.openFiles.filter(x => x.path === file.path).pop();
    if (alreadyOpen) {

      // File is already open.
      this.currentFileData = alreadyOpen;
      this.showEditor.emit({
        currentFileData: this.currentFileData
      });

    } else {

      // File is not open from before.
      const cmOptions = this.getCodeMirrorOptions(file.path);
      if (cmOptions === null) {

        // No registered editor for file, asking user what to do with file.
        const dialog = this.dialog.open(IncompatibleFileDialogComponent, {
          width: '550px',
          data: {
            name: file.name,
          },
        });
        dialog.afterClosed().subscribe((data: { deleteFile: false, download: false, unzip: false }) => {

          if (data && data.download) {

            // Downloading file.
            this.downloadActiveFile(file.path);

          } else if (data && data.deleteFile) {

            // Deleting file.
            this.deleteFile(file.path, false);

          } else if (data && data.unzip) {

            // Unzipping file.
            this.fileService.unzip(file.path).subscribe({
              next: () => {

                // Updating parent folder since unzip operation highly likely produced additional files and/or folder for us.
                this.updateFileObject(TreeNode.parentFolder(file));
              },
              error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
            });
          }
        });
        return;
      }

      // File type has a registered CodeMirror editor.
      this.fileService.loadFile(file.path).subscribe({
        next: (content: string) => {
          this.openFiles.push({
            name: file.name,
            path: file.path,
            folder: file.path.substring(0, file.path.lastIndexOf('/') + 1),
            content: content,
            options: cmOptions,
          });

          this.currentFileData = this.openFiles.filter(x => x.path === file.path)[0];
          this.showEditor.emit({ currentFileData: this.currentFileData })

          // Hack to make sure initial loading of file does not become an "undo" operation.
          setTimeout(() => {
            this.scrollToLastOpenFile();
            this.clearEditorHistory.emit(true);
          }, 1);

        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    }

    // When a file is opened, we set the active folder to the file's parent folder.
    this.activeFolder = TreeNode.parentFolder(file);
  }

  deleteActiveFile() {
    this.deleteFile(this.currentFileData.path);
  }

  deleteFile(path: string, askForConfirmation: boolean = true) {

    // Callback invoked when file should be deleted.
    const deleteFileImplementation = () => {

      this.fileService.deleteFile(path).subscribe({
        next: () => {

          // Updating parent folder.
          this.updateFileObject(TreeNode.parentFolderFromPath(path));
    
          // Making sure we close file if it's currently open.
          if (this.currentFileData?.path === path) {
            this.closeFileImpl();
          }
    
          // Making sure we remove file from list of open files.
          const open = this.openFiles.findIndex(x => x.path === path);
          if (open !== -1) {
            this.openFiles.splice(open, 1);
          }

          // Providing feedback to user.
          this.generalService.showFeedback('File was deleted successfully', 'successMessage');

        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    };

    if (askForConfirmation === false) {

      // Deleting file immediately without asking for confirmation.
      deleteFileImplementation();

    } else {

      // Asking user to confirm action.
      this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: 'Confirm operation',
          description_extra: `This operation is permanent, please confirm you wish to delete;<br/><span class="fw-bold">${path}</span>`,
          action_btn: 'Delete',
          action_btn_color: 'warn',
          bold_description: true
        }
      }).afterClosed().subscribe((result: string) => {

        if (result === 'confirm') {

          deleteFileImplementation();
        }
      });
    }
  }

  deleteActiveFolder() {
    this.deleteFolder(this.activeFolder);
  }

  deleteFolder(path: string) {

    // Making sure user doesn't delete system folders.
    if (this.isSystemFolder(path)) {
      this.generalService.showFeedback('You cannot delete system folders', 'errorMessage', 'Ok', 3000);
      return;
    }

    // Asking user to confirm action.
    this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Delete entire folder`,
        description_extra: `You are deleting the following folder: <br/> <span class="fw-bold">${path}</span> <br/><br/> Do you want to continue?`,
        action_btn: 'Delete',
        action_btn_color: 'warn',
        bold_description: true
      }
    }).afterClosed().subscribe((result: string) => {

      if (result === 'confirm') {

        // Deleting folder on server.
        this.fileService.deleteFolder(path).subscribe({

          next: () => {

            // Updating parent folder.
            this.updateFileObject(TreeNode.parentFolderFromPath(path));

            // Making sure we turn parent folder to currently active folder.
            this.activeFolder = TreeNode.parentFolderFromPath(path);

            // Checking if currently active open file is inside of deleted folder.
            if (this.currentFileData?.folder.startsWith(path)) {
              this.closeFileImpl();
            }

            // Databinding tree again now that folder has been removed.
            this.dataBindTree();

            // Showing feedback to user.
            this.generalService.showFeedback('Folder successfully deleted', 'successMessage');

          },
          error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        });
      }
    });
  }

  dataBindTree() {
    const expanded: FlatNode[] = [];
    for (const idx of this.treeControl.dataNodes) {
      if (this.treeControl.isExpanded(idx)) {
        expanded.push(idx);
        expanded.push(this.openFolder);
      }
    }

    this.dataSource.data = this.root.children;

    for (const idx of this.treeControl.dataNodes) {
      if (expanded.filter(x => (<any>x)?.node?.path === (<any>idx).node.path).length > 0) {
        this.treeControl.expand(idx);
      }
    }
  }

  closeFileImpl(file: any = null) {
    let idx: number;
    file = file || this.currentFileData;
    let isActiveFile = false;
    this.openFiles.forEach(element => {
      if (element.path === file.path) {
        idx = this.openFiles.indexOf(element);
        if (this.currentFileData.path === file.path) {
          isActiveFile = true;
        }
      }
    });
    this.openFiles.splice(idx, 1);

    if (!isActiveFile) {
      return;
    }

    if (this.openFiles.length === 0) {
      this.currentFileData = null;
    } else {
      if (idx === 0) {
        this.currentFileData = this.openFiles.filter(x => x.path === this.openFiles[0].path)[0];
      } else {
        this.currentFileData = this.openFiles.filter(x => x.path === this.openFiles[idx - 1].path)[0];
      }
    }
    this.showEditor.emit({ currentFileData: this.currentFileData })
    this.setFocusToActiveEditor.emit();
    this.cdr.detectChanges();
  }

  showRenameInput(item: TreeNode) {
    this.showRenameBox = item;
    setTimeout(() => {
      (document.querySelector('#renameFile') as HTMLElement).focus();
    }, 10);
  }

  renameActiveFile(event: { file: any, name: string }) {
    let path: string = '';
    event.file.node ? path = event.file.node.path : path = event.file.path;
    if (event.name !== '' && event.name !== event.file.name && this.nameValidation(event.name)) {
      this.fileService.rename(path, event.name).subscribe({
        next: () => {
          const treeNode = this.findTreeNodeFolder(this.root, path);
          treeNode.name = event.name;
          treeNode.path = event.file.path;
          event.file.name = treeNode.name;
          path = treeNode.path;
          event.file.node && this.currentFileData ? this.currentFileData.path = path : '';
          this.dataBindTree();
          this.cdr.detectChanges();
          this.generalService.showFeedback('File successfully renamed', 'successMessage');
          this.getEndpoints();
          this.showRenameBox = null;
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      })
    } else if (!this.nameValidation(event.name)) {
      this.generalService.showFeedback('Invalid characters', 'errorMessage');
    } else {
      this.showRenameBox = null;
      return;
    }
  }

  renameActiveFolder(folder: any, name?: string) {
    let givenName: string;
    name !== undefined ? givenName = name : givenName = folder.newName;

    if (givenName !== '' && givenName !== folder.name && this.nameValidation(givenName)) {
      const newName = folder.node.path.toString().replace(folder.name, givenName);
      this.fileService.rename(folder.node.path, newName).subscribe({
        next: () => {
          var toUpdate = folder.node.path.substring(0, folder.node.path.length - 1);
          toUpdate = toUpdate.substring(0, toUpdate.lastIndexOf('/') + 1);
          if (this.currentFileData) {
            this.currentFileData.path = this.currentFileData.path.toString().replace(folder.name, givenName);
            this.currentFileData.folder = this.currentFileData.path.toString().replace(folder.name, givenName);
          }

          this.updateFileObject(toUpdate);
          this.cdr.detectChanges();
          this.generalService.showFeedback('Folder successfully renamed', 'successMessage');
          this.showRenameBox = null;
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      })

    } else if (!this.nameValidation(givenName)) {
      this.generalService.showFeedback('Invalid characters', 'errorMessage');
    } else {
      this.showRenameBox = null;
      return;
    }
  }

  createNewFileObject(type: string) {
    const folders = this.getFolders();
    const files = this.getFiles();
    const dialogRef = this.dialog.open(NewFileFolderDialogComponent, {
      width: '550px',
      data: {
        isFolder: (type === 'folder'),
        name: '',
        path: this.activeFolder,
        folders: folders,
        files: files,
        type: type
      },
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        let path = result.path + result.name;

        if (type === 'folder') {
          path += '/';
          this.fileService.createFolder(path).subscribe({
            next: () => {
              this.generalService.showFeedback('Folder successfully created', 'successMessage');
              this.sort({ dialogResult: result, objectPath: path })
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
          });
        } else {
          this.fileService.saveFile(path, '').subscribe({
            next: () => {
              this.generalService.showFeedback('File successfully created', 'successMessage');
              this.sort({ dialogResult: result, objectPath: path })
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
          });
        }
      }
    });
  }

  downloadActiveFile(path?: string) {
    if (!path && this.currentFileData) {
      this.fileService.downloadFile(this.currentFileData.path);
    }
    if (path) {
      this.fileService.downloadFile(path);
    }
  }

  downloadFolder() {
    if (this.activeFolder) {
      this.fileService.downloadFolder(this.activeFolder);
    }
  }

  selectFolder(folder: FlatNode) {
    this.activeFolder = folder.node.path;
    this.openFolder = folder;
  }

  uploadFiles(files: FileList) {
    for (let idx = 0; idx < files.length; idx++) {
      this.fileService.uploadFile(this.activeFolder, files.item(idx)).subscribe({
        next: () => {
          this.generalService.showFeedback('File was successfully uploaded', 'successMessage');
          this.fileInput = null;
          if (idx === (files.length - 1)) {
            this.updateFileObject(this.activeFolder);
          }
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    };
  }

  updateFileObject(fileObject: string) {
    let folder = fileObject;
    let isFile = false;
    if (!fileObject.endsWith('/')) {
      folder = folder.substring(0, folder.lastIndexOf('/') + 1);
      isFile = true;
    }

    let parent = this.root;
    const entities = folder.split('/').filter(x => x !== '');
    for (const idxPeek of entities.slice(0, entities.length)) {
      parent = parent.children.filter(x => x.name === idxPeek)[0];
    }
    parent.children = [];

    this.getFilesFromServer(folder).then((success: any) => {
      if (success) {
        if (isFile) {
          this.fileService.loadFile(fileObject).subscribe({
            next: async (content: string) => {

              if (this.getCodeMirrorOptions(fileObject) !== null) {
                this.openFiles.push({
                  name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
                  path: fileObject,
                  folder: fileObject.substring(0, fileObject.lastIndexOf('/') + 1),
                  content: content,
                  options: this.getCodeMirrorOptions(fileObject),
                });
                this.currentFileData = this.openFiles.filter(x => x.path === fileObject)[0];
                this.showEditor.emit({ currentFileData: this.currentFileData });
                this.setFocusToActiveEditor.emit();
              }
              this.cdr.detectChanges();

              // If the code mirror can't open the file.
              // Lets the user decide what to do with it.
              if (this.getCodeMirrorOptions(fileObject) === null) {
                this.dialog.open(IncompatibleFileDialogComponent, {
                  width: '550px',
                  data: {
                    name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
                  },
                }).afterClosed().subscribe(async (data: { deleteFile: false, download: false }) => {
                  const objectToDelete: any = {
                    name: fileObject.substring(fileObject.lastIndexOf('/') + 1),
                    path: fileObject,
                    folder: fileObject.substring(0, fileObject.lastIndexOf('/') + 1),
                    content: content,
                    options: this.getCodeMirrorOptions(fileObject)
                  }
                  if (data && data.download) {
                    this.downloadActiveFile(fileObject);
                  } else if (data && data.deleteFile) {
                    this.deleteFile(objectToDelete, false);
                  }
                });
                return;
              }
            },
            error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
          })
        } else {
          this.dataBindTree();
          this.getEndpoints();
          this.cdr.detectChanges();
        }
      }
    })
  }

  isExpandable(_: number, node: FlatNode) {
    return node.expandable;
  }

  filterLeafNode(node: FlatNode, searchKeyword: string): boolean {
    if (!searchKeyword) {
      return false
    }
    return node.name.toLowerCase()
      .indexOf(searchKeyword?.toLowerCase()) === -1
  }

  filterParentNode(node: FlatNode, searchKeyword: string): boolean {
    if (!searchKeyword || node.name.toLowerCase().indexOf(searchKeyword?.toLowerCase()) !== -1) {
      return false
    }
    const descendants = this.treeControl.getDescendants(node)

    if (descendants.some((descendantNode) => descendantNode.name.toLowerCase().indexOf(searchKeyword?.toLowerCase()) !== -1)) {
      return false
    }
    return true
  }

  installModule(file: FileList) {
    if (file[0].name.split('.')[1] === 'zip') {
      this.fileService.installModule(file.item(0)).subscribe({
        next: () => {
          this.generalService.showFeedback('File was successfully uploaded', 'successMessage');
          this.zipFileInput = null;
          this.updateFileObject('/modules/');
        },
        error: (error: any) => this.generalService.showFeedback(error)
      });
    } else {
      this.generalService.showFeedback('Only zip files without . are accepted', 'errorMessage', 'Ok', 5000);
    }
  }

  /*
   * Private helper methods.
   */

  private getFolders(current: any = this.root) {
    const result: string[] = [];
    if (current.isFolder) {
      result.push(current.path);
    }
    for (const idx of current.children.filter(x => x.isFolder)) {
      const inner = this.getFolders(idx);
      for (const idxInner of inner) {
        result.push(idxInner);
      }
    }
    return result;
  }

  private getFiles(current: any = this.root) {
    let result: string[] = [];
    for (const idx of current.children.filter(x => !x.isFolder)) {
      result.push(idx.path);
    }
    for (const idx of current.children.filter(x => x.isFolder)) {
      result = result.concat(this.getFiles(idx));
    }
    return result;
  }

  private sort(event: any) {
    const node = this.findTreeNodeFolder(this.root, event.dialogResult.path);
    const sorter = () => {
      node.children.sort((lhs: TreeNode, rhs: TreeNode) => {
        if (lhs.isFolder && !rhs.isFolder) {
          return -1;
        } else if (!lhs.isFolder && rhs.isFolder) {
          return 1;
        }
        const lhsLowers = lhs.path.toLowerCase();
        const rhsLowers = rhs.path.toLowerCase();
        if (lhsLowers < rhsLowers) {
          return -1;
        } else if (lhsLowers > rhsLowers) {
          return 1;
        }
        return 0;
      });
    };
    if (event.dialogResult.isFolder) {
      node.children.push({
        name: event.dialogResult.name,
        path: event.objectPath,
        isFolder: true,
        level: event.dialogResult.path.split('/').filter(x => x !== '').length + 1,
        children: [],
        systemFile: this.isSystemPath(event.objectPath),
      });
      sorter();
      this.dataBindTree();
    } else {
      node.children.push({
        name: event.dialogResult.name,
        path: event.objectPath,
        isFolder: false,
        level: event.dialogResult.path.split('/').filter(x => x !== '').length + 1,
        children: [],
        systemFile: this.isSystemPath(event.objectPath),
      });

      sorter();
      this.dataBindTree();
      this.cdr.detectChanges();
      this.getEndpoints();
      this.updateFileObject(event.objectPath);
    }
  }

  private findTreeNodeFolder(node: TreeNode, path: string): TreeNode {
    if (node.path === path) {
      return node;
    }
    for (const idx of node.children) {
      const tmpResult = this.findTreeNodeFolder(idx, path);
      if (tmpResult) {
        return tmpResult
      }
    }
    return null;
  }

  private executeMacro(file: string) {
    this.fileService.getMacroDefinition(file).subscribe({
      next: (result: MacroDefinition) => {

        /*
         * Filling out default values for anything we can intelligently figure
         * out according to selected folder.
         */
        const splits = this.activeFolder.split('/');
        if (splits.length === 4 && splits[1] === 'modules') {
          const moduleArgs = result.arguments.filter(x => x.name === 'module' || x.name === 'database');
          if (moduleArgs.length > 0) {
            for (const idx of moduleArgs) {
              idx.value = splits[2];
            }
          }
        }
        const authArgs = result.arguments.filter(x => x.name === 'auth');
        if (authArgs.length > 0) {
          for (const idx of authArgs) {
            idx.value = 'root';
          }
        }
        const dialogRef = this.dialog.open(ExecuteMacroDialogComponent, {
          width: '500px',
          data: result,
        });
        dialogRef.afterClosed().subscribe((result: MacroDefinition) => {
          if (result && result.name) {
            const payload = {};
            for (const idx of result.arguments.filter(x => x.value)) {
              payload[idx.name] = idx.value;
            }
            this.fileService.executeMacro(file, payload).subscribe({
              next: (exeResult: any) => {
                this.generalService.showFeedback('Macro successfully executed', 'successMessage');
                if (exeResult.result === 'folders-changed') {

                  this.dialog.open(ConfirmationDialogComponent, {
                    width: '500px',
                    data: {
                      title: `Refresh folders`,
                      description_extra: 'Macro execution changed your file system, do you want to refresh your files and folders?',
                      action_btn: 'Refresh',
                      action_btn_color: 'primary',
                      bold_description: true
                    }
                  }).afterClosed().subscribe((result: string) => {
                    if (result === 'confirm') {
                      this.getFilesFromServer().then();
                    }
                  })
                } else if (exeResult.result.startsWith('folders-changed|')) {
                  var fileObject = exeResult.result.split('|')[1];
                  this.updateFileObject(fileObject);
                }
              },
              error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
            });
          } else if (result) {
            this.selectMacro();
          }
        });
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private getEndpoints() {
    this.endpointService.endpoints().subscribe({
      next: (result: Endpoint[]) => {
        this.endpoints = result;
        this.cdr.detectChanges();
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private nameValidation(name: string) {
    if (!name || name.length === 0) {
      return false;
    }
    for (const idx of name) {
      if ('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_-.'.indexOf(idx.toLowerCase()) === -1) {
        return false;
      }
    }
    return true
  }

  private removeNode(path: string, node: TreeNode = this.root) {
    const toBeRemoved = node.children.filter(x => x.path === path);
    if (toBeRemoved.length > 0) {
      node.children.splice(node.children.indexOf(toBeRemoved[0]), 1);
      return true;
    }
    for (const idx of node.children.filter(x => path.startsWith(x.path))) {
      if (this.removeNode(path, idx)) {
        return true;
      }
    }
    return false;
  }

  private getCodeMirrorOptions(path: string) {
    return this.codemirrorActionsService.getActions(path);
  }

  private scrollToLastOpenFile() {
    const el = document.getElementById('active');
    if (el)
      el.scrollIntoView();
  }

  private isSystemPath(path: string) {
    return path.startsWith('/system/') ||
      path.startsWith('/misc/') ||
      path.startsWith('/data/') ||
      path.startsWith('/config/');
  }

  private isSystemFolder(path: string) {
    return path === '/' ||
      path === '/system/' ||
      path === '/modules/' ||
      path === '/data/' ||
      path === '/config/' ||
      path === '/etc/';
  }
}

// Transforms from internal data structure to tree control's expectations.
const _transformer = (node: TreeNode, level: number) => {
  return {
    expandable: node.isFolder,
    name: node.name,
    level: level,
    node: node,
  };
};

const treeFlattener = new MatTreeFlattener(_transformer, node => node.level, node => node.expandable, node => node.children);