import { use, useState } from "react";

function RegisterForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        // basic email validation 
        if (!email.includes("@")){
            setError("Oops! Please enter a valid email address.")
        }

        // Password validation
        if (password !== confirmPassword){
            setError("Oops! Passwords do not match, please try again.");
            return;
        }

        setError("");
        alert(`Passwords Match! (Conceptual for now)\nUsername: ${username}\nEmail: ${email}`);

        // Clear form
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
    };

   return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input 
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Register</button>
    </form>
  );
}

export default RegisterForm;