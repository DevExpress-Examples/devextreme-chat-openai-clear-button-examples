import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { DxChatComponent, type DxChatTypes } from 'devextreme-angular/ui/chat';
import { type DxButtonTypes } from 'devextreme-angular/ui/button';
import { Observable } from "rxjs";
import { AppService } from "../../app.service";
import { loadMessages } from "devextreme/localization";
import { DataSource } from 'devextreme-angular/common/data';
import { DxButtonModule, DxChatModule, DxToolbarModule, DxDrawerModule } from 'devextreme-angular';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-drawer',
  imports: [DxButtonModule, DxChatModule, DxToolbarModule, DxDrawerModule, AsyncPipe],
  templateUrl: './drawer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent {
  @ViewChild("aiChat", { static: false }) chatInstance!: DxChatComponent;

  dataSource: DataSource;

  user: DxChatTypes.User;

  typingUsers$: Observable<DxChatTypes.User[]> ;

  alerts$: Observable<DxChatTypes.Alert[]>;

  copyButtonIcon: string;

  isDisabled = false;

  regenerationText: string;

  clearButtonOptions: DxButtonTypes.Properties;
  closeDrawerButtonOptions: DxButtonTypes.Properties = {
    icon: 'close',
    hint: 'Close AI Assistant',
    onClick: () => {
      this.drawerOpened = false;
      this.toggleDrawerButtonText = 'Reveal AI Chat';
      this.toggleDrawerButtonIcon = 'showpanel';
    }
  };

  drawerOpened: boolean = false;
  toggleDrawerButtonText: string = 'Reveal AI Chat';
  toggleDrawerButtonIcon: string = 'showpanel';

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

  handleRevealAIChatClick() {
    this.drawerOpened = !this.drawerOpened;

    if (this.drawerOpened) {
      this.toggleDrawerButtonText = 'Hide AI Chat';
      this.toggleDrawerButtonIcon = 'hidepanel';
    } else {
      this.toggleDrawerButtonText = 'Reveal AI Chat';
      this.toggleDrawerButtonIcon = 'showpanel';
    }
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
