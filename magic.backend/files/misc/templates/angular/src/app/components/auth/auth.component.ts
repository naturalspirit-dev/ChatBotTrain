
import { Component, OnInit } from '@angular/core';
import { AuthService, AuthFilter } from 'src/app/auth-service';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material';
import { CreateRoleDialogComponent } from './modals/create-role-dialog';
import { CreateUserDialogComponent } from './modals/create-user-dialog';
import { EditUserDialogComponent } from './modals/edit-user-dialog';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  private userColumns: string[] = ['username', 'delete'];
  private roleColumns: string[] = ['name', 'delete'];
  private users: any[] = null;
  private roles: any[] = null;
  private userCount: number = 0;
  private roleCount: number = 0;
  private search: FormControl;
  private userFilter: AuthFilter = {
    limit: 10,
    offset: 0,
  };
  private roleFilter: AuthFilter = {
    limit: 10,
    offset: 0,
  };

  constructor(
    private service: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.getUsers();
    this.getRoles();
    this.getUsersCount();
    this.getRolesCount();
    this.search = new FormControl('');
    this.search.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(query => {
        this.userFilter.filter = query;
        this.getUsers();
      });
  }

  getUsers(callback: Function = null) {
    this.service.getUsers(this.userFilter).subscribe(res => {
      this.users = res;
      if (callback !== null) {
        callback();
      }
    }, error => {
      this.snackBar.open(error, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  getRoles(callback: Function = null) {
    this.service.getRoles(this.roleFilter).subscribe(res => {
      this.roles = res;
      if (callback !== null) {
        callback();
      }
    }, error => {
      this.snackBar.open(error, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  getUsersCount() {
    this.service.getUsersCount().subscribe(res => {
      this.userCount = res.count;
    }, error => {
      this.snackBar.open(error, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  getRolesCount() {
    this.service.getRolesCount().subscribe(res => {
      this.roleCount = res.count;
    }, error => {
      this.snackBar.open(error, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }

  createNewRole() {
    const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
      data: {
        name: '',
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {
        this.getRoles(() => {
          this.snackBar.open('Role was successfully created', 'Close', {
            duration: 2000
          });
        });
        this.getRolesCount();
      }
    });
  }

  createNewUser() {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      data: {
        name: '',
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {
        this.getUsers(() => {
          this.snackBar.open('User was successfully created', 'Close', {
            duration: 2000
          });
        });
        this.getUsersCount();
      }
    });
  }

  deleteUser(username: string) {
    this.service.deleteUser(username).subscribe(res => {
      this.getUsers(() => {
        this.snackBar.open('User was succesfully deleted', 'Close', {
          duration: 2000,
        });
      });
      this.getUsersCount();
    });
  }

  deleteRole(name: string) {
    this.service.deleteRole(name).subscribe(res => {
      this.getRoles(() => {
        this.snackBar.open('Role was succesfully deleted', 'Close', {
          duration: 2000,
        });
      });
      this.getRolesCount();
    });
  }

  usersPaged(e: PageEvent) {
    this.userFilter.limit = e.pageSize;
    this.userFilter.offset = e.pageSize * e.pageIndex;
    this.getUsers();
  }

  rolesPaged(e: PageEvent) {
    this.roleFilter.limit = e.pageSize;
    this.roleFilter.offset = e.pageSize * e.pageIndex;
    this.getRoles();
  }

  editUser(username: string) {
    if (username === 'root') {
      this.snackBar.open('Root user cannot be edited!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      return;
    }
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      data: {
        username,
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res !== null && res !== undefined) {
      }
    });
  }
}
