import logo from './logo.svg';
import './App.css';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';

function App() {
  return (
    <div>
      <h1>EasyKitchen Conceptual Register/Login Demo</h1>

      <h2>Register</h2>
      <RegisterForm />

      <h2>Login</h2>
      <LoginForm/>
    </div>
  );
}

export default App;
