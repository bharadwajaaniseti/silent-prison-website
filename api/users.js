import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const USERS_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'silent-prison-jwt-secret-key';
const SALT_ROUNDS = 10;

// Helper function to read users from JSON file
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.users || [];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Helper function to write users to JSON file
async function writeUsers(users) {
  try {
    const data = { users };
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    throw error;
  }
}

// Helper function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Main API handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    const endpoint = pathname.split('/').pop();

    switch (req.method) {
      case 'POST':
        if (endpoint === 'login') {
          await handleLogin(req, res);
        } else if (endpoint === 'register') {
          await handleRegister(req, res);
        } else if (endpoint === 'verify') {
          await handleVerifyToken(req, res);
        } else {
          res.status(404).json({ error: 'Endpoint not found' });
        }
        break;

      case 'GET':
        if (endpoint === 'profile') {
          await handleGetProfile(req, res);
        } else {
          res.status(404).json({ error: 'Endpoint not found' });
        }
        break;

      case 'PUT':
        if (endpoint === 'profile') {
          await handleUpdateProfile(req, res);
        } else {
          res.status(404).json({ error: 'Endpoint not found' });
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Handle user login
async function handleLogin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = await readUsers();
  const user = users.find(u => u.username === username || u.email === username);

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  await writeUsers(users);

  const token = generateToken(user);
  const { passwordHash, ...userWithoutPassword } = user;

  res.status(200).json({
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
}

// Handle user registration
async function handleRegister(req, res) {
  const { username, email, password, role = 'user' } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const users = await readUsers();
  
  // Check if user already exists
  const existingUser = users.find(u => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'Username or email already exists' });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create new user
  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    username,
    email,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    isActive: true
  };

  users.push(newUser);
  await writeUsers(users);

  const token = generateToken(newUser);
  const { passwordHash: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: userWithoutPassword
  });
}

// Handle token verification
async function handleVerifyToken(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const users = await readUsers();
  const user = users.find(u => u.id === decoded.id);

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'User not found or inactive' });
  }

  const { passwordHash, ...userWithoutPassword } = user;

  res.status(200).json({
    message: 'Token valid',
    user: userWithoutPassword
  });
}

// Handle get user profile
async function handleGetProfile(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const users = await readUsers();
  const user = users.find(u => u.id === decoded.id);

  if (!user || !user.isActive) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...userWithoutPassword } = user;

  res.status(200).json({
    user: userWithoutPassword
  });
}

// Handle update user profile
async function handleUpdateProfile(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const users = await readUsers();
  const userIndex = users.findIndex(u => u.id === decoded.id);

  if (userIndex === -1 || !users[userIndex].isActive) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { username, email, currentPassword, newPassword } = req.body;
  const user = users[userIndex];

  // Update username and email if provided
  if (username && username !== user.username) {
    // Check if username is already taken
    const existingUser = users.find(u => u.username === username && u.id !== user.id);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    user.username = username;
  }

  if (email && email !== user.email) {
    // Check if email is already taken
    const existingUser = users.find(u => u.email === email && u.id !== user.id);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    user.email = email;
  }

  // Update password if provided
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required to set new password' });
    }

    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidCurrentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  await writeUsers(users);

  const { passwordHash, ...userWithoutPassword } = user;

  res.status(200).json({
    message: 'Profile updated successfully',
    user: userWithoutPassword
  });
}
