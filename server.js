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
  baseURL: "https://api.twelvelabs.io/v1.1",
})


const PORT_NUMBER = process.env.REACT_APP_PORT_NUMBER
  ? process.env.REACT_APP_PORT_NUMBER
  : 4000;
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
    "x-api-key": "tlk_324NHPB3VDEH9T2EED3BH35794EE"
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
      "x-api-key": "tlk_324NHPB3VDEH9T2EED3BH35794EE",
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

/** Set up Express server to listen on port */
app.listen(PORT_NUMBER, () => {
  console.log(`Server Running. Listening on port ${PORT_NUMBER}`);
});

