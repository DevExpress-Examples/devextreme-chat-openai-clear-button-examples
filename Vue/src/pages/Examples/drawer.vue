<template>
  <div class="demo-container">
    <DxDrawer
      id="ai-chat-drawer"
      :opened="drawerOpened"
      template="drawerTemplate"
      position="right"
      opened-state-mode="shrink"
    >
      <DxButton
        id="toggle-drawer-button"
        :text="toggleDrawerButtonText"
        :icon="toggleDrawerButtonIcon"
        :rtl-enabled="true"
        @click="handleRevealAIChatClick"
      />
      <template #drawerTemplate>
        <div class="drawer-ai-chat-container">
          <DxToolbar id="ai-chat-drawer-toolbar">
            <DxItem
              location="before"
              text="AI Assistant"
            />
            <DxItem
              location="after"
              widget="dxButton"
              :options="clearButtonOptions"
            />
            <DxItem
              location="after"
              widget="dxButton"
              :options="closeDrawerButtonOptions"
            />
          </DxToolbar>
          <DxChat
            ref="chatInstance"
            :class="isDisabled ? 'chat-disabled' : ''"
            :data-source="dataSource"
            :reload-on-change="false"
            :show-avatar="false"
            :show-day-headers="false"
            :user="user"
            v-model:typing-users="typingUsers"
            v-model:alerts="alerts"
            @message-entered="onMessageEntered"
            message-template="messageTemplate"
          >
            <template #messageTemplate="{ data }">
              <div v-if="data.message.text === regenerationText">
                <span>{{ regenerationText }}</span>
              </div>
              <div v-else>
                <div
                  class="dx-chat-messagebubble-text"
                  v-html="convertToHtml(data.message)"
                />
                <div class="dx-bubble-button-container">
                  <DxButton
                    :icon="copyButtonIcon"
                    styling-mode="text"
                    hint="Copy"
                    @click="onCopyButtonClick(data.message)"
                  />
                  <DxButton
                    icon="refresh"
                    styling-mode="text"
                    hint="Regenerate"
                    @click="onRegenerateButtonClick"
                  />
                </div>
              </div>
            </template>
          </DxChat>
        </div>
      </template>
    </DxDrawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { DxDrawer } from 'devextreme-vue/drawer';
import { DxChat } from 'devextreme-vue/chat';
import { DxButton, type DxButtonTypes } from 'devextreme-vue/button';
import { DxToolbar, DxItem } from 'devextreme-vue/toolbar';
import { useChatLogic } from '@/helpers/chat.helpers';
import type dxChat from 'devextreme/ui/chat';

const chatInstance = ref<{ instance: dxChat } | null>(null);

const drawerOpened = ref<boolean>(false);
const toggleDrawerButtonText = ref<string>('Reveal AI Chat');
const toggleDrawerButtonIcon = ref<string>('showpanel');

const closeDrawerButtonOptions: DxButtonTypes.Properties = {
  icon: 'close',
  hint: 'Close AI Assistant',
  onClick: () => {
    drawerOpened.value = false;
    toggleDrawerButtonText.value = 'Reveal AI Chat';
    toggleDrawerButtonIcon.value = 'showpanel';
  }
};

const {
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
} = useChatLogic(chatInstance);

// Initialize component
onMounted(() => {
  loadMessage();
  initDataSource();
});

function handleRevealAIChatClick() {
  drawerOpened.value = !drawerOpened.value;

  if (drawerOpened.value) {
    toggleDrawerButtonText.value = 'Hide AI Chat';
    toggleDrawerButtonIcon.value = 'hidepanel';
  } else {
    toggleDrawerButtonText.value = 'Reveal AI Chat';
    toggleDrawerButtonIcon.value = 'showpanel';
  }
}
</script>

<style scoped>
.demo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: calc(100% - 24px);
  padding: 12px;
}

.drawer-ai-chat-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  min-width: 400px;
  background-color: #fff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.drawer-ai-chat-container #ai-chat-drawer-toolbar.dx-toolbar {
  padding: 0 20px;
  border-bottom: 1px solid #e0e0e0;
}

.drawer-ai-chat-container .dx-chat {
  border: none;
}

#toggle-drawer-button {
  display: inline-flex;
}
</style>
