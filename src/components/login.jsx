import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:4000/auth/login', {
        username,
        password,
      });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.token);
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Login</h3>

      <input
        style={styles.input}
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br />

      <input
        style={styles.input}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button style={styles.button} onClick={login}>
        Login
      </button>

      <p style={styles.text}>
        Don't have an account?{' '}
        <span onClick={onSwitchToRegister} style={styles.link}>
          Register
        </span>
      </p>
    </div>
  );
};

export default Login;

// 🎨 Inline Styles
const styles = {
  container: {
    padding: 20,
    width: '300px',
    margin: '50px auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  heading: {
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '90%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    border: '1px solid #aaa',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  text: {
    marginTop: 15,
    color: '#333',
  },
  link: {
    color: 'blue',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
