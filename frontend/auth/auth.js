// Creating account
document.addEventListener('DOMContentLoaded', () => {
    const continueButton = document.getElementById('create-account-continue');

    if (!continueButton) {
        console.error('Continue button not found');
        return;
    }

    continueButton.addEventListener('click', () => {
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');

        if (!emailInput || !passwordInput) {
            console.error('Input elements not found');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email === '') {
            alert('Email is required');
            return;
        }

        if (!emailRegex.test(email)) {
            alert('Incorrect email format');
            return;
        }

        if (password === '') {
            alert('Password is required');
            return;
        }

        if (password.length < 8) {
            alert('Passwords should be 8 or more characters');
            return;
        }

        // Save email and password to localStorage
        localStorage.setItem('globalEmail', email);
        localStorage.setItem('globalPassword', password);

        // Send email to server to get OTP
        fetch('http://localhost:3000/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Success') {
                // Save response data to localStorage
                localStorage.setItem('responseData', JSON.stringify(data.data));

                // Navigate to verify OTP page
                window.location.href = './verify_otp.html';
            } else {
                alert('Error: ' + data.data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
});

// Verifying otp
document.addEventListener('DOMContentLoaded', () => {
    const continueButton = document.getElementById('verify-otp-continue');

    if (!continueButton) {
        console.error('Continue button not found');
        return;
    }

    continueButton.addEventListener('click', async () => {
        const otpInput = document.getElementById('input').value;

        // Retrieve data from localStorage
        const globalEmail = localStorage.getItem('globalEmail');
        const responseData = JSON.parse(localStorage.getItem('responseData'));

        console.log(responseData)
        console.log(globalEmail)

        try {
            const response = await fetch('http://localhost:3000/api/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    otp: otpInput,
                    email: globalEmail,
                    hash: responseData,
                }),
            });

            const data = await response.json();
            console.log('Verification response:', data);

            if(data.message === "error"){
                alert("Incorrect OTP")
                return;
            }

            // Navigate to verify OTP page
            window.location.href = './create_profile.html';

        } catch (error) {
            console.error('Error verifying OTP:', error);
            alert('Incorrect OTP Code')
            // Handle error scenarios
        }
    });
});

// Creating profile
document.addEventListener('DOMContentLoaded', async () => {
    const continueButton = document.getElementById('create-profile-continue');

    if (!continueButton) {
        console.error('Continue button not found');
        return;
    }

    continueButton.addEventListener('click', async () => {
        const name = document.getElementById('name').value.trim();
        const username = document.getElementById('username').value.trim()
        const password = localStorage.getItem('globalPassword')
        const email = localStorage.getItem('globalEmail')
        const gender = document.getElementById('gender').value;

        console.log(name, username, email, gender, password)

        if (!name || !username || !email || !gender ||!password) {
            alert('All fields are required');
            return;
        }

        try {
            // Check if the username already exists
            const usernameResponse = await fetch(`http://localhost:3000/api/check-username/${username}`);
            const usernameResult = await usernameResponse.json();

            if (usernameResult.exists) {
                alert('Username already taken');
                return;
            }

            // Check if the email already exists
            const emailResponse = await fetch(`http://localhost:3000/api/check-email/${email}`);
            const emailResult = await emailResponse.json();

            if (emailResult.exists) {
                alert('Email already taken');
                return;
            }

            // Proceed with user creation
            const response = await fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, username, email, gender, password })
            });

            const result = await response.json();

            if (response.status !== 201) {
                alert(result.message || 'An error occurred');
            } else {
                alert('User created successfully');
                
                // Navigate to verify OTP page
            window.location.href = './log_in.html';
            }
        } catch (error) {
            alert('An error occurred');
        }
    });
})

// Login 
document.getElementById('login-continue').addEventListener('click', async () => {
    const emailOrUsername = document.getElementById('email-username-input').value.trim();
    const password = document.getElementById('password-input').value.trim();

    if (!emailOrUsername || !password) {
        alert('Email/Username and password are required');
        return;
    }

    try {
        // Send POST request to login endpoint
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: emailOrUsername,
                username: emailOrUsername,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Handle successful login
            alert(result.status);
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            window.location.href = '../index.html'; 
        } else {
            // Handle login error
            alert(result.message || 'An error occurred');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
});
