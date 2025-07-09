 import React, { useState } from 'react';
import Login from './components/login';
import Register from './components/register';
import Chat from './components/chatbox';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showRegister, setShowRegister] = useState(false);

  if (token) return <Chat token={token} />;

  return showRegister
    ? <Register onSwitchToLogin={() => setShowRegister(false)} />
    : <Login onLogin={setToken} onSwitchToRegister={() => setShowRegister(true)} />;
};

export default App;
