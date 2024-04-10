// const express = require('express');
// const bodyParser = require('body-parser');
// const multer = require('multer');
// const axios = require('axios');
// const path = require('path');
// const fs = require('fs');
// const app = express();
// const port = process.env.PORT || 3000;
// const cors = require('cors');

// const { Observable } = require('rxjs');
// const WebSocket = require('ws')

// const wss = new WebSocket.Server({ port: 8000 })
// // export const PLAYGROUND_API_URL = 'https://api.twelvelabs.space';
// // export const CREATE_TASK_URL = `${PLAYGROUND_API_URL}/v1.2/tasks`;
// // export const INDEXES_URL = `${PLAYGROUND_API_URL}/v1.2/indexes`;
// // export const CREATE_TASK_WITH_YOUTUBE_URL = `${PLAYGROUND_API_URL}/v1.2/tasks/external-provider`;
// // export const API_VERSION = 'v1.2'
// // Middleware for parsing JSON data

// app.use(bodyParser.json());
// app.use(cors());
// app.use(express.json())

// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, 'build')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
//   });
// }

// const storage = multer.memoryStorage();
// var upload = multer({ storage: storage }).single('video_file')
// const apiKey = process.env.REACT_APP_API_MAIN_KEY

// app.post('/worker_generate_stream', upload, async (req, res) => {
//   try {
//     const headers = {
//     'x-api-key': apiKey,
//     'Content-Type': 'multipart/form-data',
//   };

//   if (!req.file) {
//     return res.status(400).json({ error: 'No file(s) provided' });
//   }
//     const url = 'https://api.twelvelabs.space'
//     const requestData = req.body
//     const options = { index_id: requestData.index_id, language: requestData.language, video_file: req.file.buffer }
//     const response = await axios.post(url, options, { headers: headers })
//     const responseData = response.data;

//     res.json(responseData);
//   } catch (error) {
//     console.error('Error sending POST request:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// function parseLangserveEvents(event) {
//   if (event.event === "on_chat_model_stream") {
//       const content = event.data.chunk.content;
//       if (content) {
//           console.log(content);
//           // Attempts to maintain a consistent token rendering rate for a smoother UX
//           setTimeout(() => {}, 50);
//       }
//   } else if (event.event === "on_tool_start") {
//       const tool = event.name;
//       console.log(`Running => ${tool}`);
//   } else if (event.event === "on_tool_end") {
//       const tool = event.name;
//       console.log(`Finished running ${tool}`);
//   }
// }

// app.post('/stream_events', async (req, res) => {
//   res.setHeader('Content-Type', 'text/event-stream');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Connection', 'keep-alive');
//   const requestData = {
//     input: "Use index id 659f2e829aba4f0b402f6488 to find the top clip of a touchdown Hey how are you doing?",
//     tool_descriptions: {
//       "video-search": " Run a search query against a collection of videos and get results.",
//       "download-video": " Download a video for a given video in a given index and get the filepath. \n    Should only be used when the user explicitly requests video editing functionalities.",
//       "combine-clips": "search tool. The full filepath for the combined clips is returned.",
//       "remove-segment": " Remove a segment from a video at specified start and end times The full filepath for the edited video is returned."
//     }
//   };
//   // Create an Observable to fetch data from the URL
//   const observable = new Observable((observer) => {
//       axios.post('http://localhost:8000/jockey/stream_events', requestData)
//           .then(response => {
//               console.log(response)
//               if (!response.ok) {
//                   throw new Error('Network response was not ok');
//               }
//               return response.body;
//           })
//           .then(body => {
//               const reader = body.getReader();
//               return new ReadableStream({
//                   start(controller) {
//                       function push() {
//                           reader.read().then(({ done, value }) => {
//                               if (done) {
//                                   controller.close();
//                                   return;
//                               }
//                               // Push the chunk of data to the observer
//                               controller.enqueue(value);
//                               push();
//                           }).catch(error => {
//                               console.error('Error reading from stream:', error);
//                               controller.error(error);
//                           });
//                       }
//                       push();
//                   }
//               });
//           })
//           .then(stream => new Response(stream))
//           .then(response => response.body.pipeTo(new WritableStream({
//               write(chunk) {
//                   observer.next(chunk.toString());
//               },
//               close() {
//                   observer.complete();
//               },
//               abort(error) {
//                   observer.error(error);
//               }
//           })))
//           .catch(error => observer.error(error));
//   });

//   // Subscribe to the observable and send events to the client
//   const subscription = observable.subscribe({
//       next: (chunk) => {
//           res.write(`data: ${chunk}\n\n`); // Send data to client
//       },
//       error: (err) => {
//           console.error('Error streaming events:', err);
//           res.status(500).end('Internal server error');
//       },
//       complete: () => {
//           console.log('Event streaming complete');
//           res.end(); // End the response when streaming is complete
//       }
//   });

//   // Clean up when the client disconnects
//   res.on('close', () => {
//       console.log('Client disconnected');
//       subscription.unsubscribe(); // Unsubscribe from the observable
//   });
// });


// app.post('/worker_generate_stream2', async (req, res) => {
//   try {
//     const url = 'https://api.twelvelabs.space'
//     const headers = {
//       'x-api-key': apiKey,
//       'Content-Type': 'application/json',
//     };

//     const requestData = req.body.options
  
//     const response = await axios.post(url, requestData, { headers: headers });

//     // Handle the response from the external service
//     const responseData = response.data;

//     // Send the response back to your React app
//     res.json(responseData);
//   } catch (error) {
//     console.error('Error sending POST request:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });


// app.post('/asr', async (req, res) => {
//   try {
//     const requestData = {
//       videos: req.body.videos,
//       prompt: req.body.prompt,
//       agent_history: req.body.agent_history,
//       duration: req.body.duration,
//       asr: req.body.asr,
//       description: req.body.description,
//     };

//     const response = await axios.post(
//       'https://api.twelvelabs.space', // Update this URL as needed
//       requestData
//     );


//     const responseData = response.data;


//     res.json(responseData);
//   } catch (error) {
//     console.error('Error sending POST request:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
// function streamEvents(res) {
//   // Replace 'localhost:8000/jockey' with your actual endpoint
//   const url = 'http://localhost:8000/jockey';

//   // Using RxJS to create an observable that fetches data from the URL
//   const observable = new Observable(observer => {
//       const eventSource = new EventSource(url);

//       eventSource.onmessage = (event) => {
//           observer.next(event.data);
//       };

//       eventSource.onerror = (error) => {
//           observer.error(error);
//       };

//       // Returning a teardown function to clean up resources when subscription ends
//       return () => {
//           eventSource.close();
//       };
//   });

//   // Subscribe to the observable and send data to the client
//   const subscription = observable.subscribe({
//       next: (data) => {
//           res.write(`data: ${data}\n\n`);
//       },
//       error: (error) => {
//           console.error('Error:', error);
//           res.status(500).end('Server Error');
//       },
//       complete: () => {
//           console.log('Complete');
//           res.end();
//       }
//   });

//   // Cleanup subscription when client disconnects
//   res.on('close', () => {
//       subscription.unsubscribe();
//   });
// }
