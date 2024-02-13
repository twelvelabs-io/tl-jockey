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

const PLAYGROUND_API_URL = 'https://api.twelvelabs.io'
const API_VERSION = 'v1.2'

const twelveLabsAPI = axios.create({
	baseURL: `${PLAYGROUND_API_URL}/${API_VERSION}`
})

const storage = multer.memoryStorage();
var upload = multer({ storage: storage }).single('video_file')
const apiKey = process.env.REACT_APP_API_MAIN_KEY

app.post('/worker_generate_stream', upload, async (req, res) => {
  try {
    const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'multipart/form-data',
  };

  if (!req.file) {
    return res.status(400).json({ error: 'No file(s) provided' });
  }


  // Append fields to the FormData object
    const url = 'https://api.twelvelabs.space/v1.2/tasks'
    console.log('Request Body:', req.body)
    console.log('req.body', JSON.stringify(req.body))
    console.log('Request file buffer', req.file.buffer)
    console.log('request video file', req.body.buffer)


    const requestData = req.body
    const options = { index_id: requestData.index_id, language: requestData.language, video_file: req.file.buffer }
    console.log(options)
    const response = await axios.post(url, options, { headers: headers })
    console.log(requestData)

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
    console.log(requestData)
    console.log('obhject here')
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    // Make a POST request to the external service
    const response = await axios.post(
      'http://172.16.6.55:40083/worker_generate_stream', // Update this URL as needed
      requestData,
      { headers: headers }
    );

    // Handle the response from the external service
    const responseData = response.data;

    console.log(requestData)
    console.log(response)
    // Send the response back to your React app
    res.json(responseData);
  } catch (error) {
    console.error('Error sending POST request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/worker_generate_stream2', async (req, res) => {
  try {

    console.log('Request Body:', req.body.options)
    console.log('Index_name:', req.body.options['index_name'])

    const url = 'https://api.twelvelabs.space/v1.2/indexes'
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };

    const requestData = req.body.options
  
    console.log(requestData)
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
      'http://172.16.6.55:40093/worker_generate_stream', // Update this URL as needed
      requestData
    );


    const responseData = response.data;


    res.json(responseData);
  } catch (error) {
    console.error('Error sending POST request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
