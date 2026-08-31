import {
  useState, useEffect, useCallback, useRef, useMemo, type JSX,
} from 'react';
import { loadMessages } from 'devextreme/localization';
import Chat, { type ChatRef, type ChatTypes } from 'devextreme-react/chat';
import { Toolbar, Item } from 'devextreme-react/toolbar';
import { Drawer } from 'devextreme-react/drawer';
import { Button, type ButtonTypes } from 'devextreme-react/button';
import MessageTemplate from '../components/MessageTemplate.tsx';
import { AppService } from '../ChatService.tsx';
import { CHAT_DISABLED_CLASS, user as chatUser } from '../data';

export default function DrawerExample(): JSX.Element {
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

  const [drawerOpened, setDrawerOpened] = useState(false);
  const toggleDrawerButtonText: string = drawerOpened ? 'Hide AI Chat' : 'Reveal AI Chat';
  const toggleDrawerButtonIcon: string = drawerOpened ? 'hidepanel' : 'showpanel';

  const closeDrawerButtonOptions: ButtonTypes.Properties = useMemo(() => ({
    icon: 'close',
    hint: 'Close AI Assistant',
    onClick() {
      setDrawerOpened(false);
    },
  }), []);

  const handleRevealAIChatClick = useCallback(() => {
    setDrawerOpened((prev) => !prev);
  }, []);

  const renderDrawer = useCallback(() => (
    <div className='drawer-ai-chat-container'>
      <Toolbar id='ai-chat-drawer-toolbar'>
        <Item
          location='before'
          text='AI Assistant'
        />
        <Item
          location='after'
          widget='dxButton'
          options={appService.clearButtonOptions}
        />
        <Item
          location='after'
          widget='dxButton'
          options={closeDrawerButtonOptions}
        />
      </Toolbar>
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
    </div>
  ), [appService, closeDrawerButtonOptions, isDisabled, user, typingUsers, alerts, onMessageEntered, messageRender]);

  return (
    <div className='drawer demo-container'>
      <Drawer
        id='ai-chat-drawer'
        opened={drawerOpened}
        render={renderDrawer}
        position='right'
        openedStateMode='shrink'
      >
        <Button
          id='toggle-drawer-button'
          text={toggleDrawerButtonText}
          icon={toggleDrawerButtonIcon}
          rtlEnabled={true}
          onClick={handleRevealAIChatClick}
        />
      </Drawer>
    </div>
  );
}
