import { ref, type Ref } from 'vue';
import { AzureOpenAI, APIUserAbortError } from 'openai';
import { CustomStore, DataSource } from 'devextreme-vue/common/data';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { loadMessages } from 'devextreme/localization';
import type { DxChatTypes } from 'devextreme-vue/chat';
import { DxButtonTypes } from 'devextreme-vue/button';
import dxChat from 'devextreme/ui/chat';

const ALERT_TIMEOUT = 10000;
const AzureOpenAIConfig = {
  dangerouslyAllowBrowser: true,
  deployment: 'demo-mini',
  endpoint: 'https://public-api.devexpress.com/demo-openai',
  apiVersion: '2024-02-01',
  apiKey: 'DEMO',
};

const assistant: DxChatTypes.User = { id: 'assistant', name: 'Virtual Assistant' };

export function useChatLogic(chatInstance: Ref<{ instance: dxChat } | null>) {
  const dataSource = ref<DataSource | null>(null);
  const user = ref({ id: 'user' });
  const typingUsers = ref<Array<DxChatTypes.User>>([]);
  const alerts = ref<Array<DxChatTypes.Alert>>([]);
  const regenerationText = ref('Regenerating...');
  const copyButtonIcon = ref('copy');
  const isDisabled = ref(false);
  const store = ref([]);
  const messages = ref<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([]);
  const chatService = new AzureOpenAI(AzureOpenAIConfig);

  const clearButtonOptions = ref<DxButtonTypes.Properties>({
    icon: 'clearhistory',
    hint: 'Clear Chat',
    disabled: true,
    onClick: handleClearChatClick,
  })

  let controller = new AbortController();

  function abortCurrentRequest() {
    controller.abort();
  }

  function resetController() {
    controller = new AbortController();
  }

  const loadMessage = () => {
    loadMessages({
      en: {
        'dxChat-emptyListMessage': 'Chat is Empty',
        'dxChat-emptyListPrompt': 'AI Assistant is ready to answer your questions.',
        'dxChat-textareaPlaceholder': 'Ask AI Assistant...'
      }
    });
  };

  const initDataSource = () => {
    const customStore = new CustomStore({
      key: 'id',
      load: () => Promise.resolve([...store.value]),
      insert: (message) => {
        store.value.push(message);
        return Promise.resolve(message);
      }
    });

    dataSource.value = new DataSource({ store: customStore, paginate: false });
  };

  const getAIResponse = async(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => {
    const params = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: AzureOpenAIConfig.deployment,
      max_completion_tokens: 1000,
      temperature: 0.7,
    };

    const signalObj = {
      signal: controller.signal,
    };

    const response = await chatService.chat.completions.create(params, signalObj);
    return response.choices[0].message?.content;
  };

  const processMessageSending = async(e: DxChatTypes.MessageEnteredEvent) => {
    toggleDisabledState(true, e.event);
    typingUsers.value = [assistant];

    try {
      const aiResponse = await getAIResponse(messages.value);
      setTimeout(() => {
        typingUsers.value = [];

        if (controller.signal.aborted) return;

        messages.value.push({ role: 'assistant', content: aiResponse ?? '' });
        renderAssistantMessage(aiResponse ?? '');
      }, 200);
    } catch (error) {
      typingUsers.value = [];

      if (!(error instanceof APIUserAbortError)) {
        alertLimitReached();
      }
    } finally {
      toggleDisabledState(false, e.event);
    }
  };

  const updateLastMessage = (text?: string | null) => {
    let items = dataSource.value?.items();
    const lastMessage = items?.at(-1);
    const data = {
      text: text ?? regenerationText,
    };

    dataSource.value?.store().push([{
      type: 'update',
      key: lastMessage.id,
      data: data
    }]);
  };

  const renderAssistantMessage = (text: string) => {
    const message = {
      id: Date.now(),
      timestamp: new Date(),
      author: assistant,
      text
    };

    dataSource.value?.store().push([{ type: 'insert', data: message }]);
  };

  const alertLimitReached = () => {
    setAlerts([{ message: 'Request limit reached, try again in a minute.' }]);
    setTimeout(() => setAlerts([]), ALERT_TIMEOUT);
  };

  const setAlerts = (newAlerts: any[]) => {
    alerts.value = newAlerts;
  };

  const regenerate = async() => {
    try {
      const aiResponse = await getAIResponse(messages.value.slice(0, -1));
      updateLastMessage(aiResponse);
      const lastMsg = messages.value.at(-1);
      if (lastMsg) {
        lastMsg.content = aiResponse ?? '';
        messages.value = [...messages.value];
      }
    } catch {
      const lastMsg = messages.value.at(-1);
      if (lastMsg) updateLastMessage(lastMsg.content);
      alertLimitReached();
    }
  };

  const convertToHtml = (message: {text: string}) => {
    return unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(message.text || '')
      .toString();
  };

  const toggleDisabledState = (disabled: boolean, event?: { target?: EventTarget } | undefined) => {
    const element = event?.target as HTMLElement;
    isDisabled.value = disabled;

    if (element) {
      if (disabled) {
        element.blur();
      } else {
        element.focus();
      }
    }
  };

  const onMessageEntered = async(e: DxChatTypes.MessageEnteredEvent) => {
    clearButtonOptions.value = { ...clearButtonOptions.value, disabled: false };
    resetController();

    let { message } = e;
    dataSource.value?.store().push([{
      type: 'insert',
      data: { id: Date.now(), ...message }
    }]);

    messages.value.push({ role: 'user', content: message?.text ?? '' });
    await processMessageSending(e);
  };

  const onCopyButtonClick = (message: {text: string}) => {
    navigator.clipboard?.writeText(message.text ?? '');
    copyButtonIcon.value = 'check';
    setTimeout(() => copyButtonIcon.value = 'copy', 2500);
  };

  const onRegenerateButtonClick = async() => {
    updateLastMessage();
    toggleDisabledState(true);
    try {
      await regenerate();
    } finally {
      toggleDisabledState(false);
    }
  };

  function clearChat(chatRef: Ref<{ instance: dxChat } | null>) {
    const widget = chatRef.value?.instance;
    if (!widget) return;

    const removals: any = widget.getDataSource().items().map((item) => ({ type: 'remove', key: item.id }));

    store.value.length = 0;
    messages.value.length = 0;

    widget.option({ alerts: [], typingUsers: [] });

    widget.getDataSource().store().push(removals);
  }

  function handleClearChatClick(e: DxButtonTypes.ClickEvent) {
    e.component.option('disabled', true);
    clearChat(chatInstance);
    abortCurrentRequest();
  }

  return {
    dataSource,
    user,
    typingUsers,
    alerts,
    regenerationText,
    copyButtonIcon,
    loadMessage,
    initDataSource,
    convertToHtml,
    onMessageEntered,
    onCopyButtonClick,
    onRegenerateButtonClick,
    isDisabled,
    clearButtonOptions
  };
}
