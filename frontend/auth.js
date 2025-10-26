// Authentication functions for Easy Kitchen
// const API_BASE_URL = 'http://localhost:8000';

// Check if user is authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!token || (tokenExpiry && new Date() > new Date(tokenExpiry))) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
        
        if (!window.location.href.includes('login.html') && !window.location.href.includes('index.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }
    
    return true;
}

// Register a new user
async function registerUser(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }
        
        return {
            success: true,
            message: 'Registration successful'
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: error.message || 'Registration failed'
        };
    }
}

// Login user
async function loginUser(email, password) {
    try {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }
        
        // Store token and calculate expiry (30 minutes from now)
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 30);
        
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('tokenExpiry', expiryTime.toISOString());
        
        return {
            success: true,
            message: 'Login successful',
            username: data.username
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: error.message || 'Login failed'
        };
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    window.location.href = 'login.html';
}

// Get authentication headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Initialize login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const form = e.target;
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = '';
            
            try {
                const result = await loginUser(form.email.value, form.password.value);
                if (result.success) {
                    window.location.href = 'ingredients.html';
                } else {
                    errorDiv.textContent = result.message;
                }
            } catch (error) {
                errorDiv.textContent = 'Error: ' + (error.message || 'Login failed');
            }
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const form = e.target;
            const errorDiv = document.getElementById('signupError');
            errorDiv.textContent = '';
            
            if (form.password.value !== form.confirm.value) {
                errorDiv.textContent = 'Passwords do not match';
                return;
            }
            
            try {
                const result = await registerUser(
                    form.username.value,
                    form.email.value,
                    form.password.value
                );
                
                if (result.success) {
                    alert('Registration successful! Please log in.');
                    form.reset();
                    if (typeof showLogin === 'function') {
                        showLogin();
                    }
                } else {
                    errorDiv.textContent = result.message;
                }
            } catch (error) {
                errorDiv.textContent = 'Error: ' + (error.message || 'Registration failed');
            }
        });
    }
});

// ---- expose functions to window for tests / non-module script usage ----
if (typeof window !== "undefined") {
  window.checkAuthStatus = checkAuthStatus;
  window.registerUser = registerUser;
  window.loginUser = loginUser;
  window.logoutUser = logoutUser;
  window.getAuthHeaders = getAuthHeaders;
}