const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// Middleware for parsing JSON data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}


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

    const response = await axios.post(
      'https://api.twelvelabs.io/p/v1.2/indexes', // Update this URL as needed
      requestData
    );


    const responseData = response.data;


    res.json(responseData);
  } catch (error) {
    console.error('Error sending POST request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/worker_generate_stream2', async (req, res) => {
  try {

    const apiKey = 'tlk_1V6J4TC3646GX92VGH837303P6AX';
    const apiUrl = 'https://api.twelvelabs.space.io/p/v1.2/indexes';

    const engines = [ { engine_name: 'pegasus1', engine_options: ["visual", "conversation"] }]; // Assuming you are using the Marengo video understanding engine
    const addons = ['thumbnail']; // Enable thumbnail generation addon

    const url = 'https://api.twelvelabs.io/p/v1.2/indexes'
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };

    const requestData = req.body.options
  
  
    const options = {
      method: 'POST',
      headers: headers,
      data: JSON.stringify({
        index_name: "somethigs",
        engines: engines,
        addons: addons,
      }),
      url: url ,
    }; 



    const response = await axios(requestData);

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
