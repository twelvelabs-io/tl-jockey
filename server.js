const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 4000;
const cors = require('cors');

// Middleware for parsing JSON data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Serve the React app (build) if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Handle the first POST request from your React app
app.post('/worker_generate_stream', async (req, res) => {
  try {
    const requestData = {
      videos: req.body.videos,
      prompt: req.body.prompt,
      agent_history: req.body.agent_history,
      duration: req.body.duration,
      asr: req.body.asr,
      description: req.body.description,
    };

    // Make a POST request to the external service
    const response = await axios.post(
      'http://172.16.6.55:40073/worker_generate_stream', // Update this URL as needed
      requestData
    );

    // Handle the response from the external service
    const responseData = response.data;

    // Send the response back to your React app
    res.json(responseData);
  } catch (error) {
    console.error('Error sending POST request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Handle the second POST request from your React app with the same parameters
app.post('/worker_generate_stream2', async (req, res) => {
  try {
    const requestData = {
      videos: req.body.videos,
      prompt: req.body.prompt,
      agent_history: req.body.agent_history,
      duration: req.body.duration,
      asr: req.body.asr,
      description: req.body.description,
    };

    // Make a POST request to the same external service with a different URL
    const response = await axios.post(
      'http://172.16.6.55:40093/worker_generate_stream', // Update this URL as needed
      requestData
    );

    // Handle the response from the external service
    const responseData = response.data;

    // Send the response back to your React app
    res.json(responseData);
  } catch (error) {
    console.error('Error sending POST request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
