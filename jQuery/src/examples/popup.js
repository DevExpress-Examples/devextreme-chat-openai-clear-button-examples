/** OpenAI integration */
/** doc: https://github.com/openai/openai-node?tab=readme-ov-file#usage */
import { user, clearButtonId } from './../data.js';
import { abortCurrentRequest, messageTemplate, customStore, onMessageEntered, clearChat } from './../helpers.js';

$(() => {
  $('#open-popup-button').dxButton({
    text: 'Reveal AI Chat',
    icon: 'chatsparkleoutline',
    onClick() {
      popup.show();
    },
  })

  const popup = $('#ai-chat-popup').dxPopup({
    wrapperAttr: { id: 'ai-chat-popup-wrapper' },
    toolbarItems: [{
      location: 'before',
      text: 'AI Assistant',
    }, {
      widget: 'dxButton',
      location: 'after',
      options: {
        elementAttr: { id: clearButtonId},
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
    contentTemplate() {
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
