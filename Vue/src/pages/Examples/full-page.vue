<template>
  <div class="demo-container">
    <div class="ai-chat-container">
      <DxToolbar
        id="ai-chat-toolbar"
      >
        <DxItem
          location="before"
          text="AI Assistant"
        />
        <DxItem
          location="after"
          widget="dxButton"
          :options="clearButtonOptions"
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { DxChat } from 'devextreme-vue/chat';
import { DxButton } from 'devextreme-vue/button';
import { DxToolbar, DxItem } from 'devextreme-vue/toolbar';
import { useChatLogic } from '@/helpers/chat.helpers';
import type dxChat from 'devextreme/ui/chat';

const chatInstance = ref<{ instance: dxChat } | null>(null);

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
</script>

<style scoped>
.demo-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100% - 24px);
    width: calc(100% - 24px);
    padding: 12px;
}

.ai-chat-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100%;
    background-color: var(--dx-component-color-bg);
    width: 50%;
    max-width: 900px;
    border-radius: 12px;
    border: var(--dx-border-width) solid var(--dx-color-border);
}

.dx-chat {
    border: none;
}

#ai-chat-toolbar.dx-toolbar {
    border-bottom: var(--dx-border-width) solid var(--dx-color-border);
    padding: 0 20px;
}
</style>
