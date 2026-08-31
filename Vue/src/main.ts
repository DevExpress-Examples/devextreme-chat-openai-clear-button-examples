import { createApp } from 'vue';
import config from 'devextreme/core/config';
import App from './App.vue';
import './assets/main.css';
import { licenseKey } from './devextreme-license';
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';

config({ licenseKey });

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App);
app.use(router)
app.mount('#app');
