/** OpenAI integration */
/** doc: https://github.com/openai/openai-node?tab=readme-ov-file#usage */
import { user, deployment, endpoint, apiVersion, apiKey, REGENERATION_TEXT } from './../data.js';
import { abortCurrentRequest, messageTemplate, customStore, onMessageEntered, clearChat } from './../helpers.js';

const revealConfig = {
  text: 'Reveal AI Chat',
  icon: 'showpanel',
}

const hideConfig = {
  text: 'Hide AI Chat',
  icon: 'hidepanel',
}

$(() => {
  const toggleDrawerButton = $('#toggle-drawer-button').dxButton({
    ...revealConfig,
    rtlEnabled: true,
    onClick(e) {
      drawer.toggle();

      e.component.option(drawer.option('opened') ? hideConfig : revealConfig)
    },
  }).dxButton('instance');

  const drawer = $('#drawer').dxDrawer({
    position: 'right',
    openedStateMode: 'shrink',
    template(data) {
      return $('<div>').addClass('drawer-chat-container').append(
        $('<div>').dxToolbar({
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
                clearChat($('#dx-ai-chat').dxChat('instance'));
                abortCurrentRequest();
              }
            }
          }, {
            widget: 'dxButton',
            location: 'after',
            options: {
              elementAttr: { id: 'close-drawer-button'},
              icon: 'close',
              hint: 'Close AI Assistant',
              onClick() {
                drawer.hide();

                toggleDrawerButton.option(revealConfig)
              }
            }
          }]
        }),
        $('<div>').dxChat({
          elementAttr: { id: 'dx-ai-chat'},
          dataSource: customStore,
          reloadOnChange: false,
          showAvatar: false,
          showDayHeaders: false,
          user,
          onMessageEntered,
          messageTemplate,
        }),
      )
    },
  }).dxDrawer('instance')
});
