import { use, useState } from "react";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // mock user for demo
    const mockUser = {
        email : "test@example.com",
        password : "password"
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        // mock user login check
        if (email !== mockUser.email){
            setError("Wrong email. Please try again!");
            return;
        } 
        
        if (password != mockUser.password) {
            setError("Wrong password. Please try again!")
            return;
        }

        setError("");
        alert(`Login simulated for email: ${email} (conceptual)`);

        // Clear form
        setEmail("");
        setPassword("");
    };

    return (
        <form onSubmit={handleSubmit}>
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
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">Login</button>
        </form>
    );
}

export default LoginForm;