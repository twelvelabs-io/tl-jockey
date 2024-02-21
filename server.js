const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// Middleware for parsing JSON data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}
const { INDEXES_URL, CREATE_TASK_URL  } = require('./src/apis/apiEndpoints')
const { API_KEY  } = require('./src/apis/apiKeys')
const { serverConfig } = require('./src/server/serverConfig')

const storage = multer.memoryStorage();
var upload = multer({ storage: storage }).single('video_file')
const apiKey = API_KEY.MAIN

app.post('/worker_generate_stream', upload, async (req, res) => {
  try {
    const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'multipart/form-data',
  };

  if (!req.file) {
    return res.status(400).json({ error: 'No file(s) provided' });
  }
    const url = CREATE_TASK_URL
    const requestData = req.body
    const options = { index_id: requestData.index_id, language: requestData.language, video_file: req.file.buffer }
    const response = await axios.post(url, options, { headers: headers })
    const responseData = response.data;

    res.json(responseData);
  } catch (error) {
    console.error('Error sending POST request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/worker_generate_stream3', async (req, res) => {
  try {
    const requestData = req.body.options 
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    // Make a POST request to the external service
    const response = await axios.post(
      serverConfig.ServerForTwelveML, // Update this URL as needed
      requestData,
      { headers: headers }
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

app.post('/worker_generate_stream2', async (req, res) => {
  try {
    const url = INDEXES_URL
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };

    const requestData = req.body.options
  
    const response = await axios.post(url, requestData, { headers: headers });

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


app.post('/asr', async (req, res) => {
  try {
    const requestData = {
      videos: req.body.videos,
      prompt: req.body.prompt,
      agent_history: req.body.agent_history,
      duration: req.body.duration,
      asr: req.body.asr,
      description: req.body.description,
    };

    const response = await axios.post(
      serverConfig.ServerForASR, // Update this URL as needed
      requestData
    );


    const responseData = response.data;


    res.json(responseData);
  } catch (error) {
    console.error('Error sending POST request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
