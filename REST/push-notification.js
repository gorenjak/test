const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const webpush = require('web-push');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PUSH_NOTIFICATION_PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Configuration for web-push
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:gorenjak.school@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

console.log('Javni ključ za push obvestila:', vapidKeys.publicKey);
console.log('Zasebni ključ za push obvestila:', vapidKeys.privateKey);

// Function for sending push notifications
async function sendPushNotification(subscription, dataToSend) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(dataToSend));
    console.log('Push notification sent successfully.');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// The endpoint for obtaining the public key
app.get('/api/publicKey', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });
  
  // Endpoint for sending push notifications
  app.post('/api/push/send', async (req, res) => {
    const { subscription, title, body } = req.body;
    if (!subscription || !title || !body) {
      return res.status(400).json({ message: 'Missing subscription, title, or body in request.' });
    }
  
    await sendPushNotification(subscription, { title, body });
    res.json({ success: true, message: 'Push notification sent successfully' });
  });
  
  // Endpoint for subscribing to push notifications
  app.post('/api/push/subscribe', async (req, res) => {
    const subscription = req.body.subscription;
    if (!subscription) {
      return res.status(400).json({ message: 'Missing subscription in request.' });
    }
    
    res.json({ success: true, message: 'Push subscription successful' });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });