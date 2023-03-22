
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Helper component to create HTML required to embed chatbot in HTML.
 */
@Component({
  selector: 'app-machine-learning-embed-ui',
  templateUrl: './machine-learning-embed-ui.component.html'
})
export class MachineLearningEmbedUiComponent implements OnInit {

  theme: string = 'chess';
  themes: string[] = [];
  type: string = null;
  header: string = 'Ask about our services or products';
  buttonTxt: string = 'AI Chat';
  search: boolean = false;
  chat: boolean = true;
  markdown: boolean = true;
  speech: boolean = false;
  placeholder: string = 'Search ...';
  buttonTxtSearch: string = 'AI Search';
  maxSearch: number = 5;
  currentTabIndex: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private clipboard: Clipboard,
    private backendService: BackendService,
    private openAiService: OpenAIService,
    private dialogRef: MatDialogRef<MachineLearningEmbedUiComponent>,
    private generalService: GeneralService) {
      this.type = this.data.type;
    }

  ngOnInit() {

    console.log(this.data);
    if (this.data.search === true) {
      this.search = true;
    }

    // Retrieving all themes from the backend.
    this.openAiService.themes().subscribe({
      next: (themes: string[]) => {

        this.themes = themes;
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  selectedIndexChange(tabIndex: number) {

    this.currentTabIndex = tabIndex;
  }

  getChatbotEmbed() {

    return `<script src="${this.backendService.active.url}/magic/system/openai/include-javascript?markdown=${this.markdown ? 'true' : 'false'}&speech=${this.speech ? 'true' : 'false'}&search=${this.search ? 'true' : 'false'}&chat=${this.chat ? 'true' : 'false'}&css=${encodeURIComponent(this.theme)}&file=default&type=${encodeURIComponent(this.type)}&header=${encodeURIComponent(this.header)}&button=${encodeURIComponent(this.buttonTxt)}" defer></script>`;
  }

  getSearchEmbed() {

    return `<script src="${this.backendService.active.url}/magic/system/openai/include-search?css=${encodeURIComponent(this.theme)}&type=${encodeURIComponent(this.type)}&placeholder=${encodeURIComponent(this.placeholder)}&button=${encodeURIComponent(this.buttonTxtSearch)}&max=${this.maxSearch}" defer></script>`;
  }

  embed() {

    switch (this.currentTabIndex) {

      case 0:
        this.embedChatbot();
        break;

      case 1:
        this.embedSearch();
        break;
    }
  }

  embedChatbot() {

    if (this.search === false && this.chat === false) {

      this.generalService.showFeedback('You have to choose at least one of chat or search', 'errorMessage');
      return;
    }

    this.clipboard.copy(this.getChatbotEmbed());
    this.generalService.showFeedback('HTML to include chatbot can be found on your clipboard', 'successMessage');
    if (this.data.noClose !== true) {
      this.dialogRef.close();
    }
  }

  embedSearch() {

    this.clipboard.copy(this.getSearchEmbed());
    this.generalService.showFeedback('HTML to include search widget can be found on your clipboard', 'successMessage');
    if (this.data.noClose !== true) {
      this.dialogRef.close();
    }
  }
}
