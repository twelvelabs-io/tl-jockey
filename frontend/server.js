const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();
const cors = require('cors');

const TWELVE_LABS_API_KEY = process.env.TWELVE_LABS_API_KEY;
const TWELVE_LABS_API = axios.create({
  baseURL: "https://api.twelvelabs.io/v1.2",
})

const PORT_NUMBER = process.env.PORT || 4000;
const PAGE_LIMIT_MAX = 50;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const errorLogger = (error, request, response, next) => {
  console.error(error.stack);
  next(error);
};

const errorHandler = (error, request, response, next) => {
  return response
    .status(error.status || 500)
    .json(error || "Something Went Wrong...");
};

app.use(errorLogger, errorHandler);

/** Get videos */
app.get("/indexes/:indexId/videos", async (request, response, next) => {
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": TWELVE_LABS_API_KEY
  };
  const params = {
    page: request.query.page,
    page_limit: request.query.page_limit,
  };
  try {
    const apiResponse = await TWELVE_LABS_API.get(
      `/indexes/${request.params.indexId}/videos`,
      {
        headers,
        params,
      }
    );
    response.json(apiResponse.data);
  } catch (error) {
    console.error("Error getting videos:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

/** Get a video of an index */
app.get(
  "/indexes/:indexId/videos/:videoId",
  async (request, response, next) => {
    const indexId = request.params.indexId;
    const videoId = request.params.videoId;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": TWELVE_LABS_API_KEY,
    };

    try {
      const apiResponse = await TWELVE_LABS_API.get(
        `/indexes/${indexId}/videos/${videoId}`,
        {
          headers,
        }
      );
      response.json(apiResponse.data);
    } catch (error) {
      return next(error);
    }
  }
);

app.post("/stream_events", async (req, res) => {
  const inputData = req.body.input;

  if (!inputData) {
      res.status(400).json({ error: "Input data is missing" });
      return;
  }

  const sessionId = Date.now();

  // Set the headers for Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Use Axios to interact with the remote service
  const externalServiceUrl = "";
  // Add externalURL if using stream events without SDK 
  // Send request to external service with appropriate data
  const response = axios.post(externalServiceUrl, {
      input: inputData,
      configurable: { session_id: sessionId },
      version: "v1",
      include_types: ["chat_model"],
      include_names: ["AzureChatOpenAI", "video-search", "download-video", "combine-clips", "remove-segment"]
  });

  // Using EventSource to handle the stream of events
  const eventSource = new EventSource(externalServiceUrl, { method: "POST", body: JSON.stringify(response) })

  eventSource.onmessage = (event) => {
      // Parse the event data
      const eventData = JSON.parse(event.data);

      // Process different event types
      switch (eventData.event) {
          case "on_chat_model_start":
              res.write(`data: Start processing chat model\n\n`);
              break;

          case "on_chat_model_end":
              res.write(`data: End processing chat model\n\n`);
              break;

          case "on_tool_start":
              res.write(`data: Running => ${eventData.name}\n\n`);
              break;

          case "on_tool_end":
              res.write(`data: Finish => ${eventData.name}\n\n`);
              break;

          case "on_chat_model_stream":
              const content = eventData.data.chunk.content;
              if (content) {
                  res.write(`data: ${content}\n\n`);
              }
              break;
      }
  };

  eventSource.onerror = (err) => {
      console.error("Error in event stream:", err);
      res.write(`data: Error in event stream\n\n`);
      eventSource.close();
      res.end();
  };

  // Keep the connection alive
  req.on("close", () => {
      eventSource.close();
  });
});
/** Set up Express server to listen on port */
app.listen(PORT_NUMBER, () => {
  console.log(`Server Running. Listening on port ${PORT_NUMBER}`);
});

