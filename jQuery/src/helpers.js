import {
  user, assistant, CHAT_DISABLED_CLASS, deployment, endpoint, apiVersion, apiKey, REGENERATION_TEXT,
} from './data.js';

let chatService;

$(() => {
  DevExpress.localization.loadMessages({
    'en': {
      'dxChat-emptyListMessage': 'Chat is Empty',
      'dxChat-emptyListPrompt': 'AI Assistant is ready to answer your questions.',
      'dxChat-textareaPlaceholder': 'Ask AI Assistant...',
    },
  });

  chatService = new AzureOpenAI({
    dangerouslyAllowBrowser: true,
    deployment,
    endpoint,
    apiVersion,
    apiKey,
  });
})

let controller = new AbortController();

function alertLimitReached(chatInstance) {
  chatInstance.option({
    alerts: [{
      message: 'Request limit reached, try again in a minute.',
    }],
  });

  setTimeout(() => {
    chatInstance.option({ alerts: [] });
  }, 10000);
}

function toggleDisabledState(disabled, chatInstance) {
  chatInstance.element().toggleClass(CHAT_DISABLED_CLASS, disabled);
}

export async function processMessageSending(chatInstance, messages, customStore, chatService) {
  toggleDisabledState(true, chatInstance);

  chatInstance.option({ typingUsers: [assistant] });

  try {
    const aiResponse = await getAIResponse(messages, chatService);

    setTimeout(() => {
      chatInstance.option({ typingUsers: [] });

      if (controller.signal.aborted) return;

      messages.push({ role: 'assistant', content: aiResponse });
      renderMessage(aiResponse, customStore);
    }, 200);
  } catch (error) {
    chatInstance.option({ typingUsers: [] });

    if (!(error instanceof APIUserAbortError)) {
      alertLimitReached(chatInstance);
    }
  } finally {
    toggleDisabledState(false, chatInstance);
  }
}
function renderMessage(text, customStore) {
  const message = {
    id: Date.now(),
    timestamp: new Date(),
    author: assistant,
    text,
  };

  customStore.push([{ type: 'insert', data: message }]);
}
export async function regenerate(chatInstance, messages, chatService, customStore) {
  toggleDisabledState(true, chatInstance);

  try {
    const aiResponse = await getAIResponse(messages.slice(0, -1), chatService);

    updateLastMessage(aiResponse, chatInstance, customStore);
    messages.at(-1).content = aiResponse;
  } catch {
    updateLastMessage(messages.at(-1).content);
    alertLimitReached();
  } finally {
    toggleDisabledState(false, chatInstance);
  }
}
export function updateLastMessage(text, chatInstance, customStore) {
  const { items } = chatInstance.option();
  const lastMessage = items.at(-1);
  const data = {
    text: text || REGENERATION_TEXT,
  };

  customStore.push([{
    type: 'update',
    key: lastMessage.id,
    data,
  }]);
}

async function getAIResponse(messagesAI, chatService) {
  const params = {
    messages: messagesAI || '',
    model: deployment,
    max_completion_tokens: 1000,
    temperature: 0.7,
  };

  const signalObj = {
    signal: controller.signal,
  };

  const response = await chatService.chat.completions.create(params, signalObj);
  const data = { choices: response.choices };

  return data.choices[0].message?.content;
}

export function convertToHtml(value) {
  return unified()
    .use(remarkParse)
    // eslint-disable-next-line spellcheck/spell-checker
    .use(remarkRehype)
    // eslint-disable-next-line spellcheck/spell-checker
    .use(rehypeStringify)
    .processSync(value)
    .toString();
}

export function abortCurrentRequest() {
  controller.abort();
}

export function resetController() {
  controller = new AbortController();
}

export const messageStore = [];
export const messages = [];

export const customStore = new DevExpress.data.CustomStore({
  key: 'id',
  load: () => {
    const d = $.Deferred();

    setTimeout(() => {
      d.resolve([...messageStore]);
    });

    return d.promise();
  },
  insert: (message) => {
    const d = $.Deferred();

    setTimeout(() => {
      messageStore.push(message);
      d.resolve();
    });

    return d.promise();
  },
});

export function onMessageEntered (e) {
  $('#clear-chat-button').dxButton('instance').option('disabled', false);
  resetController();

  const { message } = e;

  customStore.push([{ type: 'insert', data: { id: Date.now(), ...message } }]);
  messages.push({ role: 'user', content: message.text });

  processMessageSending(e.component, messages, customStore, chatService);
}

export function messageTemplate (data, element) {
  const { message } = data;

  if (message.text === REGENERATION_TEXT) {
    element.text(REGENERATION_TEXT);
    return;
  }

  const $textElement = $('<div>')
    .addClass('dx-chat-messagebubble-text')
    .html(convertToHtml(message.text))
    .appendTo(element);

  const $buttonContainer = $('<div>')
    .addClass('dx-bubble-button-container');

  $('<div>')
    .dxButton({
      icon: 'copy',
      stylingMode: 'text',
      hint: 'Copy',
      onClick: ({ component }) => {
        navigator.clipboard.writeText($textElement.text());
        component.option({ icon: 'check' });
        setTimeout(() => {
          component.option({ icon: 'copy' });
        }, 5000);
      },
    })
    .appendTo($buttonContainer);

  $('<div>')
    .dxButton({
      icon: 'refresh',
      stylingMode: 'text',
      hint: 'Regenerate',
      onClick: () => {
        updateLastMessage('', data.component, customStore);
        regenerate(data.component, messages, chatService, customStore);
      },
    })
    .appendTo($buttonContainer);

  $buttonContainer.appendTo(element);
}

export function clearChat(chatInstance) {
  const removals = chatInstance.getDataSource().items().map((item) => ({ type: 'remove', key: item.id }));

  messageStore.length = 0;
  messages.length = 0;

  chatInstance.option({ alerts: [], typingUsers: [] });

  chatInstance.getDataSource().store().push(removals);
}
