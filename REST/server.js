const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const webpush = require('web-push');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Nastavitev statičnih datotek
app.use(express.static(path.join(__dirname, '../PWA'))); // pot do mape PWA

// Usmerjanje na login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../PWA/login.html')); // pot do login.html
});

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Povezava na MongoDB je bila uspešna'))
  .catch(err => console.error('Napaka pri povezovanju na MongoDB:', err));

const User = mongoose.model('User', {
    firstname: String,
    lastname: String,
    email: String,
    username: String,
    password: String,
});

// Configuration for JWT authentication
const accessTokenSecret = 'access_token_secret';
const refreshTokenSecret = 'refresh_token_secret';
const accessTokenLife = '30m';
const refreshTokenLife = '1d';

// End point for registration
app.post('/api/register', async (req, res) => {
  const { firstname, lastname, username, password, email } = req.body;
  if (!firstname || !lastname || !username || !password || !email) {
    return res.status(400).json({ message: 'Manjka ime, priimek, uporabniško ime, geslo ali e-pošta' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Geslo mora biti dolgo vsaj 8 znakov' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Uporabnik s temi podatki že obstaja' });
    }

    // Password encryption using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ firstname, lastname, username, password: hashedPassword, email });
    await newUser.save();

    res.status(201).json({ message: 'Uporabnik uspešno registriran' });
  } catch (error) {
    console.error('Napaka pri registraciji uporabnika:', error);
    res.status(500).json({ message: 'Napaka notranjega strežnika' });
  }
});

// User login verification
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await User.findOne({ username });

      if (user) {
          // Check password match using bcrypt
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (isPasswordValid) {
              // If the user exists and the password is correct, generate a JWT token
              const accessToken = jwt.sign({ id: user._id, username: user.username, role: user.role }, accessTokenSecret, { expiresIn: accessTokenLife });
              const refreshToken = generateRefreshToken(user.username);
              res.json({ accessToken, refreshToken, userId: user._id }); // Dodamo userId v odgovor
          } else {
              // If the password is incorrect, return an error
              res.status(401).json({ message: 'Napačno uporabniško ime ali geslo.' });
          }
      } else {
          // If the user does not exist, return an error
          res.status(401).json({ message: 'Napačno uporabniško ime ali geslo.' });
      }
  } catch (error) {
      // If a query error occurs, return an error
      console.error('Napaka pri prijavi uporabnika:', error);
      res.status(500).json({ message: 'Napaka pri prijavi uporabnika.' });
  }
});

// Password reset endpoint
app.post('/api/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Manjka e-pošta ali novo geslo' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Geslo mora biti dolgo vsaj 8 znakov' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Uporabnik s tem e-poštnim naslovom ne obstaja' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Geslo uspešno ponastavljeno' });
  } catch (error) {
    console.error('Napaka pri ponastavitvi gesla:', error);
    res.status(500).json({ message: 'Napaka notranjega strežnika' });
  }
});

// A function to generate a refresh token
function generateRefreshToken(username) {
  return jwt.sign({ username: username }, refreshTokenSecret, { expiresIn: refreshTokenLife });
}

// Function to update the access token
function refreshAccessToken(req, res) {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return res.sendStatus(401);
  }
  jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    const accessToken = jwt.sign({ username: user.username, role: user.role }, accessTokenSecret, { expiresIn: accessTokenLife });
    res.json({ accessToken });
  });
}

// Access token refresh endpoint
app.post('/api/token', refreshAccessToken);

// Authentication middleware to verify the access token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, accessTokenSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Endpoint to get user data by user ID
app.get('/api/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint to update user data by user ID
app.put('/api/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { email, firstname, lastname } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { email, firstname, lastname }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User data successfully updated', user: updatedUser });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint to delete user by user ID
app.delete('/api/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User successfully deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Password change endpoint
app.post('/api/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Manjka staro ali novo geslo' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Novo geslo mora biti dolgo vsaj 8 znakov' });
  }

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Uporabnik ni bil najden' });
    }

    // Check if the old password matches
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Napačno staro geslo' });
    }

    // Update the password by encrypting the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Geslo uspešno spremenjeno' });
  } catch (error) {
    console.error('Napaka pri spremembi gesla:', error);
    res.status(500).json({ message: 'Napaka notranjega strežnika' });
  }
});

// Returning the user ID according to the entered email
app.get('/api/users/email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ _id: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user', error });
  }
});

app.listen(PORT, () => {
  console.log(`Strežnik deluje na http://localhost:${PORT}/`);
});