import {
  useState, useEffect, useCallback, useRef, type JSX,
} from 'react';
import { loadMessages } from 'devextreme/localization';
import Chat, { type ChatRef, type ChatTypes } from 'devextreme-react/chat';
import { Popup, ToolbarItem } from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import MessageTemplate from '../components/MessageTemplate.tsx';
import { AppService } from '../ChatService.tsx';
import { CHAT_DISABLED_CLASS, user as chatUser } from '../data';

const popupWrapperAttr = { id: 'ai-chat-popup-wrapper' };

export default function PopupExample(): JSX.Element {
  const chatInstance = useRef<ChatRef>(null);

  const appServiceRef = useRef<AppService | null>(null);
  if (appServiceRef.current === null) {
    appServiceRef.current = new AppService(chatInstance);
  }
  const appService = appServiceRef.current;

  useEffect(() => loadMessages(appService.getDictionary()), [appService]);

  const user = chatUser;
  const [isDisabled, setDisabled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<ChatTypes.User[]>([]);
  const [alerts, setAlerts] = useState<ChatTypes.Alert[]>([]);

  useEffect(() => {
    const typingSubscription = appService.typingUsers$.subscribe(setTypingUsers);
    const alertsSubscription = appService.alerts$.subscribe(setAlerts);
    return (): void => {
      typingSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, [appService]);

  const onMessageEntered = useCallback((e: ChatTypes.MessageEnteredEvent): void => {
    appService.onMessageEntered(e, setDisabled);
  }, [appService]);

  const onRegenerateButtonClick = useCallback(async (): Promise<void> => {
    setDisabled(true);
    appService.updateLastMessage();

    try {
      await appService.regenerate();
    } finally {
      setDisabled(false);
    }
  }, [appService]);

  const messageRender = useCallback(
    ({ message }: { message: ChatTypes.Message }) => <MessageTemplate text={message.text ?? ''} onRegenerateButtonClick={onRegenerateButtonClick} />,
    [onRegenerateButtonClick],
  );

  const [popupVisible, setPopupVisible] = useState(false);

  const handleRevealAIChatClick = useCallback(() => {
    setPopupVisible(true);
  }, []);

  const handlePopupHiding = useCallback(() => {
    setPopupVisible(false);
  }, []);

  const renderPopup = useCallback(() => (
    <Chat
      ref={chatInstance}
      className={isDisabled ? CHAT_DISABLED_CLASS : ''}
      dataSource={appService.dataSource}
      reloadOnChange={false}
      showAvatar={false}
      showDayHeaders={false}
      user={user}
      typingUsers={typingUsers}
      alerts={alerts}
      onMessageEntered={onMessageEntered}
      messageRender={messageRender}
    />
  ), [appService, isDisabled, user, typingUsers, alerts, onMessageEntered, messageRender]);

  return (
    <div className='popup demo-container'>
      <Button
        id='open-popup-button'
        text='Reveal AI Chat'
        icon='chatsparkleoutline'
        rtlEnabled={true}
        onClick={handleRevealAIChatClick}
      />
      <Popup
        visible={popupVisible}
        wrapperAttr={popupWrapperAttr}
        contentRender={renderPopup}
        onHiding={handlePopupHiding}
      >
        <ToolbarItem
          text='AI Assistant'
          location='before'
        />
        <ToolbarItem
          widget='dxButton'
          location='after'
          options={appService.clearButtonOptions}
        />
      </Popup>
    </div>
  );
}
