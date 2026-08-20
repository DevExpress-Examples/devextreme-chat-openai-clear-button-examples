/** OpenAI integration */
/** doc: https://github.com/openai/openai-node?tab=readme-ov-file#usage */
import { user } from './../data.js';
import { abortCurrentRequest, messageTemplate, customStore, onMessageEntered, clearChat } from './../helpers.js';

$(() => {
  const instance = $('#dx-ai-chat').dxChat({
    dataSource: customStore,
    reloadOnChange: false,
    showAvatar: false,
    showDayHeaders: false,
    user,
    onMessageEntered,
    messageTemplate,
  }).dxChat('instance');

  $('#ai-chat-toolbar').dxToolbar({
    items: [{
      location: 'before',
      text: 'AI Assistant',
    }, {
      widget: 'dxButton',
      location: 'after',
      options: {
        elementAttr: { id: 'clear-chat-button'},
        icon: 'clearhistory',
        hint: 'Clear Chat',
        disabled: true,
        onClick(e) {
          e.component.option('disabled', true);
          clearChat(instance);
          abortCurrentRequest();
        }
      }
    }]
  })
});
