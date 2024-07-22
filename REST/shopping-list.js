const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

async function sendMail(to, subject, htmlContent) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'gorenjak48@gmail.com',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const mailOptions = {
      from: 'gorenjak48@gmail.com',
      to: to,
      subject: subject,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

const accessTokenSecret = 'access_token_secret';

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Povezava na MongoDB je bila uspešna'))
  .catch(err => console.error('Napaka pri povezovanju na MongoDB:', err));

io.on('connection', (socket) => {
  console.log('Uporabnik se je povezal');

  socket.on('joinList', (listId) => {
    socket.join(listId);
  });

  socket.on('updateList', (listId, update) => {
    console.log(`Seznam ${listId} je bil posodobljen.`);
    socket.to(listId).emit('listUpdated', update);
  });

  socket.on('disconnect', () => {
    console.log('Uporabnik se je odjavil');
  });

  socket.on('productAdded', (data) => {
    console.log('Izdelek dodan:', data);
    io.emit('productAdded', data);
  });

  socket.on('oldProductAdded', (data) => {
    console.log('Izdelek dodan:', data);
    io.emit('oldProductAdded', data);
  });

  socket.on('productDeleted', (data) => {
    console.log('Izdelek izbrisan:', data);
    io.emit('productDeleted', data);
  });
});

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

const Product = mongoose.model('Product', {
  name: String,
  price: Number,
  category: String,
  brand: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const ShoppingList = mongoose.model('Shopping-List', {
  name: String,
  userId: String,
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Shopping list management endpoints (access token required)
// Get all shopping lists for the logged-in user
app.get('/api/shopping-lists', authenticateToken, async (req, res) => {
  try {
    const userLists = await ShoppingList.find({ 
      $or: [
        { userId: req.user.id },
        { sharedWith: req.user.id }
      ] 
    }).populate('products');
    res.json(userLists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single shopping list by ID for the logged-in user or shared lists
app.get('/api/shopping-lists/:id', authenticateToken, async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user.id },
        { sharedWith: req.user.id }
      ]
    }).populate('products');

    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping list not found.' });
    }
    res.json(shoppingList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new shopping list for the logged-in user
app.post('/api/shopping-lists', authenticateToken, [
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const newShoppingList = new ShoppingList({
    name: req.body.name,
    userId: req.user.id
  });

  try {
    const savedList = await newShoppingList.save();
    res.status(201).json(savedList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a shopping list for the logged-in user
app.put('/api/shopping-lists/:id', authenticateToken, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Find the list we want to update
    const shoppingList = await ShoppingList.findById(req.params.id);

    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping list not found.' });
    }

    // Checks if the user is the owner or has shared access
    if (shoppingList.userId.toString() !== req.user.id && !shoppingList.sharedWith.includes(req.user.id)) {
      return res.status(403).json({ message: 'You do not have permission to update this shopping list.' });
    }

    // Update the list name if it has been submitted
    if (req.body.name) {
      shoppingList.name = req.body.name;
    }

    const updatedList = await shoppingList.save();

    res.json(updatedList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/shopping-lists/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const list = await ShoppingList.findById(id);

    if (!list) {
      return res.status(404).json({ message: 'Nakupovalni seznam ni bil najden' });
    }

    if (!list.userId || !list.sharedWith) {
      console.error('Napaka: Seznam nima pravilno nastavljenih lastnosti userId ali sharedWith.', list);
      return res.status(500).json({ message: 'Napaka notranjega strežnika: Neveljavne lastnosti seznama.' });
    }

    if (list.userId.toString() !== userId && !list.sharedWith.includes(userId)) {
      return res.status(403).json({ message: 'Nimate dovoljenja za brisanje tega seznama' });
    }

    if (list.userId.toString() !== userId && list.sharedWith.includes(userId)) {
      list.sharedWith = list.sharedWith.filter(sharedUserId => sharedUserId.toString() !== userId);
      await list.save();
      return res.status(200).json({ message: 'Nakupovalni seznam je bil odstranjen iz vašega seznama' });
    }

    await ShoppingList.findByIdAndDelete(id);
    res.status(200).json({ message: 'Nakupovalni seznam je bil uspešno izbrisan' });
  } catch (error) {
    console.error('Napaka pri brisanju nakupovalnega seznama:', error);
    res.status(500).json({ message: 'Napaka notranjega strežnika', error: error.message });
  }
});

// Add a product to a shopping list for the logged-in user
app.post('/api/shopping-lists/:listId/products', authenticateToken, async (req, res) => {
  const { listId } = req.params;
  const { name, price, category, brand } = req.body;

  try {
    const shoppingList = await ShoppingList.findOne({
      _id: listId,
      $or: [{ userId: req.user.id }, { sharedWith: req.user.id }]
    }).populate('products');

    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping list not found.' });
    }

    const newProduct = new Product({
      name,
      price,
      category,
      brand,
      userId: req.user.id
    });

    const savedProduct = await newProduct.save();

    shoppingList.products.push(savedProduct._id);
    await shoppingList.save();

    io.to(listId).emit('listUpdated', await ShoppingList.findById(listId).populate('products'));

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to delete a product from a shopping list
app.delete('/api/shopping-lists/:listId/products/:productId', authenticateToken, async (req, res) => {
  const { listId, productId } = req.params;

  try {
    // Find the shopping list and check if the user is the owner or shared with the list
    const shoppingList = await ShoppingList.findById(listId);

    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping list not found.' });
    }

    // Check if the logged-in user is the owner or a shared user
    if (shoppingList.userId.toString() !== req.user.id && !shoppingList.sharedWith.includes(req.user.id)) {
      return res.status(403).json({ message: 'You do not have permission to modify this shopping list.' });
    }

    // Remove the product from the shopping list's products array
    const productIndex = shoppingList.products.indexOf(productId);
    if (productIndex > -1) {
      shoppingList.products.splice(productIndex, 1);
      await shoppingList.save();
      return res.status(200).json({ message: 'Product removed from shopping list.' });
    } else {
      return res.status(404).json({ message: 'Product not found in shopping list.' });
    }

  } catch (error) {
    console.error(`Error deleting product from shopping list: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// Get products of a shopping list by ID for the logged-in user
app.get('/api/shopping-lists/:id/products', authenticateToken, async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({ _id: req.params.id, userId: req.user.id }).populate('products');
    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping list not found.' });
    }
    res.json(shoppingList.products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all products created by a specific user
app.get('/api/users/:userId/products', async (req, res) => {
  const userId = req.params.userId;

  try {
    const userProducts = await Product.find({ userId });
    res.json(userProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add an existing product to a shopping list for the logged-in user or a shared user
app.post('/api/shopping-lists/:listId/products/:productId', authenticateToken, async (req, res) => {
  const { listId, productId } = req.params;

  try {
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Find the shopping list and check if the user is the owner or shared with the list
    const shoppingList = await ShoppingList.findById(listId);

    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping list not found.' });
    }

    // Check if the logged-in user is the owner or a shared user
    if (shoppingList.userId.toString() !== req.user.id && !shoppingList.sharedWith.includes(req.user.id)) {
      return res.status(403).json({ message: 'You do not have permission to modify this shopping list.' });
    }

    // Add the product to the shopping list's products array
    shoppingList.products.push(productId);
    await shoppingList.save();

    io.to(listId).emit('listUpdated', await ShoppingList.findById(listId).populate('products'));
    
    res.status(200).json(shoppingList);
  } catch (error) {
    console.error(`Error adding product to shopping list: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// Update the product
app.put('/api/products/:productId', authenticateToken, async (req, res) => {
  const { productId } = req.params;
  const { name, price, category, brand } = req.body;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, userId: req.user.id },
      { name, price, category, brand },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(updatedProduct);
  } catch (error) {
    console.error(`Error updating product: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// Delete a product by ID for the logged-in user
app.delete('/api/products/:productId', authenticateToken, async (req, res) => {
  const { productId } = req.params;

  try {
    // Find the product by ID and user ID to ensure the product belongs to the logged-in user
    const product = await Product.findOneAndDelete({ _id: productId, userId: req.user.id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or you do not have permission to delete this product.' });
    }

    res.status(200).json({ message: 'Product successfully deleted.' });
  } catch (error) {
    console.error(`Error deleting product: ${error.message}`);
    res.status(500).json({ message: 'Error deleting product.' });
  }
});

app.post('/api/send-shopping-list/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { to } = req.body;

  try {
    // Retrieving shopping list information from a database
    const shoppingList = await ShoppingList.findOne({ _id: id, userId: req.user.id }).populate('products');
    if (!shoppingList) {
      return res.status(404).json({ message: 'Nakupovalni seznam ni bil najden.' });
    }

    const createdAtFormatted = new Date(shoppingList.createdAt).toLocaleString('sl-SI');

    // Preparation of email content in HTML format
    let emailContent = `
      <div style="font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="text-align: center; color: #719c0e;">${shoppingList.name}</h2>
        <p style="text-align: center; color: #414f3f;">Ustvarjeno: ${createdAtFormatted}</p>
        <ul style="list-style-type: none; padding: 0;">`;
    
    shoppingList.products.forEach(product => {
      emailContent += `
        <li style="padding: 10px; border-bottom: 1px solid #ddd;">
          <strong style="color: #719c0e">${product.name}</strong><br>
          Cena: ${product.price} €<br>
          Kategorija: ${product.category}<br>
          Znamka: ${product.brand}
        </li>`;
    });

    emailContent += `
        </ul>
      </div>`;

    // Sending an email with a subject line
    await sendMail(to, 'Nakupovalni seznam', emailContent);
    res.status(200).json({ message: 'Nakupovalni seznam uspešno poslan.' });
  } catch (error) {
    console.error(`Napaka pri pošiljanju e-pošte: ${error.message}`);
    res.status(500).json({ message: 'Napaka pri pošiljanju e-pošte.' });
  }
});

// Sharing shopping list with users
app.post('/api/shopping-lists/:id/share', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const list = await ShoppingList.findById(id);
    if (!list) {
      return res.status(404).json({ message: 'Nakupovalni seznam ni bil najden' });
    }

    // Check if the list is already shared with the user
    if (list.sharedWith.includes(userId)) {
      return res.status(400).json({ message: 'Nakupovalni seznam je že deljen s tem uporabnikom' });
    }

    // Add user to sharing list
    list.sharedWith.push(userId);
    await list.save();

    res.status(200).json({ message: 'Nakupovalni seznam uspešno deljen' });
  } catch (error) {
    console.error('Napaka pri deljenju nakupovalnega seznama:', error);
    res.status(500).json({ message: 'Napaka notranjega strežnika' });
  }
});

app.listen(PORT, () => {
  console.log(`Strežnik deluje na http://localhost:${PORT}/`);
});

server.listen(9000);