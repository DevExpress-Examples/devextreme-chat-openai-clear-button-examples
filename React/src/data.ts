import { type ChatTypes } from 'devextreme-react/chat';

export const OpenAIConfig = {
  dangerouslyAllowBrowser: true,
  deployment: 'demo-mini',
  endpoint: 'https://public-api.devexpress.com/demo-openai',
  apiVersion: '2024-02-01',
  apiKey: 'DEMO',
};

export const ALERT_TIMEOUT = 10000;

export const CHAT_DISABLED_CLASS = 'chat-disabled';

export const user: ChatTypes.User = {
  id: 'user',
};

export const assistant: ChatTypes.User = {
  id: 'assistant',
  name: 'Virtual Assistant',
};
