import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { DxChatComponent, type DxChatTypes } from 'devextreme-angular/ui/chat';
import { type DxButtonTypes } from 'devextreme-angular/ui/button';
import { Observable } from "rxjs";
import { AppService } from "../../app.service";
import { loadMessages } from "devextreme/localization";
import { DataSource } from 'devextreme-angular/common/data';
import { DxButtonModule, DxChatModule, DxToolbarModule } from 'devextreme-angular';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-full-page',
  imports: [DxButtonModule, DxChatModule, DxToolbarModule, AsyncPipe],
  templateUrl: './full-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './full-page.component.scss',
})
export class FullPageComponent {
  @ViewChild("aiChat", { static: false }) chatInstance!: DxChatComponent;

  dataSource: DataSource;

  user: DxChatTypes.User;

  typingUsers$: Observable<DxChatTypes.User[]> ;

  alerts$: Observable<DxChatTypes.Alert[]>;

  copyButtonIcon: string;

  isDisabled = false;

  regenerationText: string;

  clearButtonOptions: DxButtonTypes.Properties;

  constructor(private readonly appService: AppService) {
    loadMessages(this.appService.getDictionary());

    this.dataSource = this.appService.dataSource!;
    this.user = this.appService.user;
    this.alerts$ = this.appService.alerts$;
    this.typingUsers$ = this.appService.typingUsers$;
    this.regenerationText = this.appService.REGENERATION_TEXT;
    this.copyButtonIcon = "copy";
    this.clearButtonOptions = {
      icon: 'clearhistory',
      hint: 'Clear Chat',
      disabled: true,
      onClick: (e: DxButtonTypes.ClickEvent) => this.appService.handleClearChatClick(this.chatInstance)(e),
    };
  }

  convertToHtml(message: DxChatTypes.Message): string {
    return this.appService.convertToHtml(message.text || "");
  }

  async onMessageEntered(e: DxChatTypes.MessageEnteredEvent) {
    this.clearButtonOptions = { ...this.clearButtonOptions, disabled: false };
    this.isDisabled = true;
    try {
      await this.appService.onMessageEntered(e);
    } finally {
      this.isDisabled = false;
    }
  }

  onCopyButtonClick(message: DxChatTypes.Message) {
    navigator.clipboard?.writeText(message.text ?? "");

    this.copyButtonIcon = "check";

    setTimeout(() => {
      this.copyButtonIcon = "copy";
    }, 2500);
  }

  async onRegenerateButtonClick() {
    this.appService.updateLastMessage();
    this.appService.toggleDisabledState(true, undefined);
    this.isDisabled = true;

    try {
      await this.appService.regenerate();
    } finally {
      this.appService.toggleDisabledState(false, undefined);
      this.isDisabled = false;
    }
  }
}
