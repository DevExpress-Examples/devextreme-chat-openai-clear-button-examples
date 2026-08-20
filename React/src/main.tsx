import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import config from 'devextreme/core/config';
import './index.css';
import App from './App.tsx';
import { licenseKey } from './devextreme-license';
import FullPageExample from './pages/FullPage.tsx';
import DrawerExample from './pages/Drawer.tsx';
import PopupExample from './pages/Popup.tsx';

config({ licenseKey });

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/FullPage" element={<FullPageExample />} />
        <Route path="/Drawer" element={<DrawerExample />} />
        <Route path="/Popup" element={<PopupExample />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
