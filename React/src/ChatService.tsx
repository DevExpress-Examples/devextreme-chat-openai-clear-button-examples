import { type RefObject } from 'react';
import { type ChatRef, type ChatTypes } from 'devextreme-react/chat';
import { type ButtonTypes } from 'devextreme-react/button';
import { DataSource, CustomStore } from 'devextreme-react/common/data';
import { AzureOpenAI, APIUserAbortError } from 'openai';
import { BehaviorSubject, Observable } from 'rxjs';
import { ALERT_TIMEOUT, assistant, AzureOpenAIConfig } from './data';

export class AppService {
  chatService: AzureOpenAI;

  store: ChatTypes.Message[] = [];

  messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

  alerts: ChatTypes.Alert[] = [];

  customStore?: CustomStore;

  dataSource?: DataSource;

  private readonly typingUsersSubject: BehaviorSubject<ChatTypes.User[]> = new BehaviorSubject<ChatTypes.User[]>([]);

  private readonly alertsSubject: BehaviorSubject<ChatTypes.Alert[]> = new BehaviorSubject<ChatTypes.Alert[]>([]);

  clearChat(chatRef: RefObject<ChatRef | null> | undefined): void {
    const widget = chatRef?.current?.instance();
    if (!widget) return;

    const removals: any = widget.getDataSource().items().map((item: any) => ({ type: 'remove', key: item.id }));

    this.store.length = 0;
    this.messages.length = 0;

    this.typingUsersSubject.next([]);
    this.setAlerts([]);

    widget.getDataSource().store().push(removals);
  }

  handleClearChatClick = (e: ButtonTypes.ClickEvent): void => {
    e.component.option('disabled', true);
    this.clearChat(this.chatInstance);
    this.abortCurrentRequest();
  };

  clearButtonOptions: ButtonTypes.Properties = {
    icon: 'clearhistory',
    hint: 'Clear Chat',
    disabled: true,
    onClick: this.handleClearChatClick,
  };

  controller = new AbortController();

  abortCurrentRequest(): void {
    this.controller.abort();
  }

  resetAbortController(): void {
    this.controller = new AbortController();
  }

  chatInstance: RefObject<ChatRef | null> | undefined;

  constructor(chatInstance: RefObject<ChatRef | null> | undefined) {
    this.chatService = new AzureOpenAI(AzureOpenAIConfig);
    this.initDataSource();
    this.typingUsersSubject.next([]);
    this.alertsSubject.next([]);
    this.chatInstance = chatInstance;
  }

  get typingUsers$(): Observable<ChatTypes.User[]> {
    return this.typingUsersSubject.asObservable();
  }

  get alerts$(): Observable<ChatTypes.Alert[]> {
    return this.alertsSubject.asObservable();
  }

  getDictionary(): object {
    return {
      en: {
        'dxChat-emptyListMessage': 'Chat is Empty',
        'dxChat-emptyListPrompt': 'AI Assistant is ready to answer your questions.',
        'dxChat-textareaPlaceholder': 'Ask AI Assistant...',
      },
    };
  }

  initDataSource(): void {
    this.customStore = new CustomStore({
      key: 'id',
      load: () => new Promise((resolve): void => {
        setTimeout(() => {
          resolve([...this.store]);
        }, 0);
      }),
      insert: (message: ChatTypes.Message) => new Promise((resolve): void => {
        setTimeout(() => {
          this.store.push(message);
          resolve(message);
        });
      }),
    });

    this.dataSource = new DataSource({
      store: this.customStore,
      paginate: false,
    });
  }

  async getAIResponse(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<any> {
    const params = {
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      model: AzureOpenAIConfig.deployment,
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

  async processMessageSending(setDisabled: Function, event: Event | undefined): Promise<void> {
    setDisabled(true);
    (event?.target as HTMLElement).blur();
    this.typingUsersSubject.next([assistant]);

    try {
      const aiResponse = await this.getAIResponse(this.messages);
      setTimeout(() => {
        this.typingUsersSubject.next([]);

        if (this.controller.signal.aborted) return;

        this.messages.push({ role: 'assistant', content: aiResponse ?? '' });
        this.renderAssistantMessage(aiResponse ?? '');
      }, 200);
    } catch (error) {
      (event?.target as HTMLElement).focus();
      this.typingUsersSubject.next([]);

      if (!(error instanceof APIUserAbortError)) {
        this.alertLimitReached();
      }
    } finally {
      (event?.target as HTMLElement).focus();
      setDisabled(false);
    }
  }

  updateLastMessage(text?: string | null | undefined): void {
    const items = this.dataSource?.items();
    const lastMessage = items?.at(-1);
    if (!lastMessage) return;

    const data = {
      text: text ?? 'Regenerating...',
    };

    this.dataSource?.store().push([{ type: 'remove', key: lastMessage.id }]);
    this.dataSource?.store().push([
      {
        type: 'insert',
        data: { ...lastMessage, ...data },
      },
    ]);
  }

  renderAssistantMessage(text: string | null): void {
    const message = {
      id: Date.now(),
      timestamp: new Date(),
      author: assistant,
      text,
    };

    this.dataSource?.store().push([{ type: 'insert', data: message }]);
  }

  alertLimitReached(): void {
    this.setAlerts([
      {
        message: 'Request limit reached, try again in a minute.',
      },
    ]);

    setTimeout((): void => {
      this.setAlerts([]);
    }, ALERT_TIMEOUT);
  }

  setAlerts(alerts: ChatTypes.Alert[]): void {
    this.alerts = alerts;
    this.alertsSubject.next(alerts);
  }

  async regenerate(): Promise<void> {
    try {
      const aiResponse = await this.getAIResponse(this.messages.slice(0, -1));
      this.updateLastMessage(aiResponse);
      const lastMsg = this.messages.at(-1);
      if (lastMsg) {
        lastMsg.content = aiResponse ?? '';
        this.messages = [...this.messages];
      }
    } catch (error) {
      const lastMsg = this.messages.at(-1);
      if (lastMsg) {
        this.updateLastMessage(lastMsg.content);
      }
      if (!(error instanceof APIUserAbortError)) {
        this.alertLimitReached();
      }
    }
  }

  onMessageEntered(event: ChatTypes.MessageEnteredEvent, setDisabled: (value: boolean) => void): void {
    this.clearButtonOptions = { ...this.clearButtonOptions, disabled: false };
    this.resetAbortController();

    let { message } = event;
    this.dataSource
      ?.store()
      .push([{ type: 'insert', data: { id: Date.now(), ...message } }]);

    this.messages.push({ role: 'user', content: message?.text ?? '' });

    this.processMessageSending(setDisabled, event.event);
  }
}
