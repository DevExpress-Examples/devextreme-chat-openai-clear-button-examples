import { type JSX } from 'react';
import './App.css';
import 'devextreme/dist/css/dx.fluent.blue.light.css';
import { Link } from 'react-router';

export default function App(): JSX.Element {
  return (
    <div className="main">
      <Link to="/FullPage">Full-Page</Link>
      <Link to="/Drawer">Drawer</Link>
      <Link to="/Popup">Popup</Link>
    </div>
  );
}
