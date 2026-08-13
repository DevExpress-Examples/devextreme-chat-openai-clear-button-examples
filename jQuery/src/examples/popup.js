/** OpenAI integration */
/** doc: https://github.com/openai/openai-node?tab=readme-ov-file#usage */
import { user, deployment, endpoint, apiVersion, apiKey, REGENERATION_TEXT } from './../data.js';
import { abortCurrentRequest, messageTemplate, customStore, onMessageEntered, clearChat } from './../helpers.js';

$(() => {
  $('#open-drawer-button').dxButton({
    text: 'Reveal AI Chat',
    icon: 'chatsparkleoutline',
    onClick(e) {
      popup.show();
    },
  })

  const popup = $('#popup').dxPopup({
    toolbarItems: [{
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
          clearChat($('#dx-ai-chat').dxChat('instance'));
          abortCurrentRequest();
        }
      }
    }],
    contentTemplate(data) {
      return $('<div>').dxChat({
        elementAttr: { id: 'dx-ai-chat' },
        dataSource: customStore,
        reloadOnChange: false,
        showAvatar: false,
        showDayHeaders: false,
        user,
        onMessageEntered,
        messageTemplate,
      });
    },
    width: 900,
  }).dxPopup('instance');
});
