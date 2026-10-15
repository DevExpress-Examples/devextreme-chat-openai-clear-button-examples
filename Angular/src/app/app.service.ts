import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { AzureOpenAI, APIUserAbortError } from "openai";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { DxChatComponent, type DxChatTypes } from 'devextreme-angular/ui/chat';
import { DataSource } from 'devextreme-angular/common/data';
import { CustomStore } from 'devextreme-angular/common/data';
import { type DxButtonTypes } from "devextreme-angular/ui/button";

@Injectable({
  providedIn: "root",
})
export class AppService {
  chatService: AzureOpenAI;

  AzureOpenAIConfig = {
    dangerouslyAllowBrowser: true,
    deployment: 'demo-mini',
    endpoint: 'https://public-api.devexpress.com/demo-openai',
    apiVersion: '2024-02-01',
    apiKey: 'DEMO',
  };

  REGENERATION_TEXT = "Regenerating...";
  ALERT_TIMEOUT = 10000;

  user: DxChatTypes.User = {
    id: "user",
  };

  assistant: DxChatTypes.User = {
    id: "assistant",
    name: "Virtual Assistant",
  };

  chatMessages: Array<{ id: number; timestamp: Date; author: DxChatTypes.User; text: string }> = [];
  aiMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
  alerts: DxChatTypes.Alert[] = [];
  private alertTimeout: ReturnType<typeof setTimeout> | undefined;

  customStore: CustomStore | undefined;

  dataSource: DataSource | undefined;

  typingUsersSubject: BehaviorSubject<DxChatTypes.User[]> = new BehaviorSubject<DxChatTypes.User[]>([]);

  alertsSubject: BehaviorSubject<DxChatTypes.Alert[]> = new BehaviorSubject<DxChatTypes.Alert[]>([]);

  constructor() {
    this.chatService = new AzureOpenAI(this.AzureOpenAIConfig);
    this.initDataSource();
    this.typingUsersSubject.next([]);
    this.alertsSubject.next([]);
  }

  controller = new AbortController();

  abortCurrentRequest() {
    this.controller.abort();
  }

  resetAbortController() {
    this.controller = new AbortController();
  }

  get typingUsers$(): Observable<DxChatTypes.User[]> {
    return this.typingUsersSubject.asObservable();
  }

  get alerts$(): Observable<DxChatTypes.Alert[]> {
    return this.alertsSubject.asObservable();
  }

  getDictionary() {
    return {
      en: {
        "dxChat-emptyListMessage": "Chat is Empty",
        "dxChat-emptyListPrompt": "AI Assistant is ready to answer your questions.",
        "dxChat-textareaPlaceholder": "Ask AI Assistant...",
      },
    };
  }

  toggleDisabledState(disabled: boolean, event?: { target?: EventTarget } | undefined) {
    const element = event?.target as HTMLElement;

    if (element) {
      if (disabled) {
        element.blur();
      } else {
        element.focus();
      }
    }
  }

  initDataSource() {
    this.customStore = new CustomStore({
      key: "id",
      load: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([...this.chatMessages]);
          }, 0);
        });
      },
      insert: (message) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.chatMessages.push(message);
            resolve(message);
          });
        });
      },
    });

    this.dataSource = new DataSource({
      store: this.customStore,
      paginate: false,
    });
  }

  async getAIResponse(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>) {
    const params = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: this.AzureOpenAIConfig.deployment,
      max_completion_tokens: 1000,
      temperature: 0.7,
    };

    const requestOptions = {
      signal: this.controller.signal,
      maxRetries: 0,
    };

    const response = await this.chatService.chat.completions.create(params, requestOptions);

    const data = { choices: response.choices };

    return data.choices[0].message?.content;
  }

  async processMessageSending(e: DxChatTypes.MessageEnteredEvent) {
    this.toggleDisabledState(true, e.event);

    this.typingUsersSubject.next([this.assistant]);
    try {
      const aiResponse = await this.getAIResponse(this.aiMessages);
      setTimeout(() => {
        this.typingUsersSubject.next([]);

        if (this.controller.signal.aborted) return;

        this.aiMessages.push({ role: "assistant", content: aiResponse ?? "" });
        this.renderAssistantMessage(aiResponse ?? "");
      }, 200);
    } catch (error: unknown) {
      this.typingUsersSubject.next([]);
      
      if (!(error instanceof APIUserAbortError)) {
        this.alertError(this.getErrorMessage(error));
      }
    } finally {
      this.toggleDisabledState(false, e.event);
    }
  }

  updateLastMessage(text?: string | null | undefined) {
    const items = this.dataSource?.items();
    const lastMessage = items?.at(-1);
    if (!lastMessage) return;

    const data = {
      text: text ?? this.REGENERATION_TEXT,
    }
    this.dataSource?.store().push([
      {
        type: "update",
        key: lastMessage.id,
        data: data,
      },
    ]);
  }

  renderAssistantMessage(text: string | null) {
    const message = {
      id: Date.now(),
      timestamp: new Date(),
      author: this.assistant,
      text,
    };

    this.dataSource?.store().push([{ type: "insert", data: message }]);
  }

  getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
  }

  alertError(message: string) {
    this.clearAlertTimeout();
    this.setAlerts([
      {
        message,
      },
    ]);

    this.alertTimeout = setTimeout(() => {
      this.alertTimeout = undefined;
      this.setAlerts([]);
    }, this.ALERT_TIMEOUT);
  }

  private clearAlertTimeout(): void {
    if (this.alertTimeout === undefined) return;

    clearTimeout(this.alertTimeout);
    this.alertTimeout = undefined;
  }

  setAlerts(alerts: DxChatTypes.Alert[]) {
    if (!alerts.length) this.clearAlertTimeout();
    this.alerts = alerts;
    this.alertsSubject.next(alerts);
  }

  async regenerate() {
    this.setAlerts([]);

    try {
      const aiResponse = await this.getAIResponse(this.aiMessages.slice(0, -1));

      this.updateLastMessage(aiResponse);
      const lastMsg = this.aiMessages.at(-1);
      if (lastMsg) {
        lastMsg.content = aiResponse ?? '';
        this.aiMessages = [...this.aiMessages];
      }
    } catch (error: unknown) {
      const lastMsg = this.aiMessages.at(-1);
      if (lastMsg) {
        this.updateLastMessage(lastMsg.content);
      }
      if (!(error instanceof APIUserAbortError)) {
        this.alertError(this.getErrorMessage(error));
      }
    }
  }

  convertToHtml(value: string) {
    const result = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(value)
      .toString();

    return result;
  }

  async onMessageEntered(event: DxChatTypes.MessageEnteredEvent) {
    this.setAlerts([]);
    this.resetAbortController();

    const { message } = event;
    this.dataSource
      ?.store()
      .push([{ type: "insert", data: { id: Date.now(), ...message } }]);

    this.aiMessages.push({ role: "user", content: message?.text ?? "" });
    await this.processMessageSending(event);
  }

  clearChat(chatInstance: DxChatComponent) {
    const removals: any = chatInstance.instance.getDataSource().items().map((item) => ({ type: 'remove', key: item.id }));

    this.chatMessages.length = 0;
    this.aiMessages.length = 0;

    this.clearAlertTimeout();
    chatInstance.instance.option({ alerts: [], typingUsers: [] });

    chatInstance.instance.getDataSource().store().push(removals);
  }

  handleClearChatClick = (chatInstance: DxChatComponent) => (e: DxButtonTypes.ClickEvent) => {
    e.component.option('disabled', true);
    this.clearChat(chatInstance);
    this.abortCurrentRequest();
  }
}
