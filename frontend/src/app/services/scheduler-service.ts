
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TaskModel, TaskUpdateModel } from '../models/task-model';
import { TicketService } from './ticket-service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(
    private httpClient: HttpClient,
    private ticketService: TicketService) { }

  public listTasks(offset: number) {
    return this.httpClient.get<string[]>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/scheduler/list-tasks?offset=' + offset);
  }

  public getTask(name: string) {
    return this.httpClient.get<TaskModel>(
      this.ticketService.getBackendUrl() +
      `magic/modules/system/scheduler/get-task?name=${encodeURIComponent(name)}`);
  }

  public createTask(task: TaskModel) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/scheduler/create-task', task);
  }

  public updateTask(task: TaskUpdateModel) {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/scheduler/update-task', task);
  }

  public deleteTask(id: string) {
    return this.httpClient.delete<any>(
      this.ticketService.getBackendUrl() +
      `magic/modules/system/scheduler/delete-task?id=${encodeURIComponent(id)}`);
  }

  public isRunning() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/scheduler/is-running');
  }

  public turnOff() {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/scheduler/is-running', {
      value: false
    });
  }

  public turnOn() {
    return this.httpClient.post<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/scheduler/is-running', {
        value: true
    });
  }

  public nextDue() {
    return this.httpClient.get<any>(
      this.ticketService.getBackendUrl() +
      'magic/modules/system/scheduler/next-due');
  }
}
