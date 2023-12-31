
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { NgModule } from '@angular/core';
import { ChatbotWizardComponent } from '../chatbot-wizard.component';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: ChatbotWizardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatbotWizardRoutingModule { }
