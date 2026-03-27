const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the FootNote API. The backend is running successfully!' });
});

app.post('/api/auth/signup', (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Here we would typically hash the password and store it in a DB
  console.log(`[Signup Attempt] ${firstName} ${lastName} (${email})`);

  // Returning success for now
  res.status(201).json({ message: 'User registered successfully', user: { firstName, lastName, email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // In a real app, you would query the database here to verify the user and password
  console.log(`[Login Attempt] ${email}`);

  // Mocking a successful login response
  if (email && password) {
    res.status(200).json({ message: 'Login successful', user: { email } });
  } else {
    res.status(400).json({ message: 'Email and password are required' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
