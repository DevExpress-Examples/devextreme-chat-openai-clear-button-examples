<template>
  <div class="demo-container">
    <DxButton
      id="open-popup-button"
      text="Reveal AI Chat"
      icon="chatsparkleoutline"
      @click="handleRevealAIChatClick"
    />
    <DxPopup
      :visible="popupVisible"
      :wrapper-attr="popupWrapperAttr"
      content-template="popupContent"
    >
      <DxToolbarItem
        text="AI Assistant"
        location="before"
      />
      <DxToolbarItem
        widget="dxButton"
        location="after"
        :options="clearButtonOptions"
      />
      <template #popupContent>
        <div>
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
    </DxPopup>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { DxChat } from 'devextreme-vue/chat';
import { DxButton } from 'devextreme-vue/button';
import { DxPopup, DxToolbarItem } from 'devextreme-vue/popup';
import { useChatLogic } from '@/helpers/chat.helpers';
import type dxChat from 'devextreme/ui/chat';

const chatInstance = ref<{ instance: dxChat } | null>(null);

const popupVisible = ref<boolean>(false);
const popupWrapperAttr = { id: 'ai-chat-popup-wrapper' };

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
  popupVisible.value = true;
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

#open-popup-button {
  display: inline-flex;
}

</style>
