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
import { DxButtonTypes } from "devextreme-angular/ui/button";

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

  store: Array<{ id: number; timestamp: Date; author: DxChatTypes.User; text: string }> = [];
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
  alerts: DxChatTypes.Alert[] = [];

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

  resetController() {
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
            resolve([...this.store]);
          }, 0);
        });
      },
      insert: (message) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.store.push(message);
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

    const signalObj = {
      signal: this.controller.signal,
    };

    const response = await this.chatService.chat.completions.create(params, signalObj);

    const data = { choices: response.choices };

    return data.choices[0].message?.content;
  }

  async processMessageSending(e: DxChatTypes.MessageEnteredEvent) {
    this.toggleDisabledState(true, e.event);

    this.typingUsersSubject.next([this.assistant]);
    try {
      const aiResponse = await this.getAIResponse(this.messages);
      setTimeout(() => {
        this.typingUsersSubject.next([]);

        if (this.controller.signal.aborted) return;

        this.messages.push({ role: "assistant", content: aiResponse ?? "" });
        this.renderAssistantMessage(aiResponse ?? "");
      }, 200);
    } catch (error) {
      this.typingUsersSubject.next([]);
      
      if (!(error instanceof APIUserAbortError)) {
        this.alertLimitReached();
      }
    } finally {
      this.toggleDisabledState(false, e.event);
    }
  }

  updateLastMessage(text?: string | null | undefined) {
    const items = this.dataSource?.items();
    const lastMessage = items?.at(-1);
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

  alertLimitReached() {
    this.setAlerts([
      {
        message: "Request limit reached, try again in a minute.",
      },
    ]);

    setTimeout(() => {
      this.setAlerts([]);
    }, this.ALERT_TIMEOUT);
  }

  setAlerts(alerts: DxChatTypes.Alert[]) {
    this.alerts = alerts;
    this.alertsSubject.next(alerts);
  }

  async regenerate() {
    try {
      const aiResponse = await this.getAIResponse(this.messages.slice(0, -1));

      this.updateLastMessage(aiResponse);
      const lastMsg = this.messages.at(-1);
      if (lastMsg) {
          lastMsg.content = aiResponse ?? '';
          this.messages = [...this.messages];
      }
    } catch {
      const lastMsg = this.messages.at(-1);
      if (lastMsg) {
        this.updateLastMessage(lastMsg.content);
    }
      this.alertLimitReached();
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
    this.resetController();

    let { message } = event;
    this.dataSource
      ?.store()
      .push([{ type: "insert", data: { id: Date.now(), ...message } }]);

    this.messages.push({ role: "user", content: message?.text ?? "" });
    await this.processMessageSending(event);
  }

  clearChat(chatInstance: DxChatComponent) {
    const removals: any = chatInstance.instance.getDataSource().items().map((item) => ({ type: 'remove', key: item.id }));

    this.store.length = 0;
    this.messages.length = 0;

    chatInstance.instance.option({ alerts: [], typingUsers: [] });

    chatInstance.instance.getDataSource().store().push(removals);
  }

  handleClearChatClick = (chatInstance: DxChatComponent) => (e: DxButtonTypes.ClickEvent) => {
    e.component.option('disabled', true);
    this.clearChat(chatInstance);
    this.abortCurrentRequest();
  }
}
