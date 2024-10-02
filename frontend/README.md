# Getting Started with Jockey Chat
<img width="1522" alt="Screenshot 2024-02-16 at 4 27 12 PM" src="https://github.com/twelvelabs-io/tl-jockey/assets/101737790/45755337-c024-422c-a538-786f08ed98f8">

## Table of Contents
- [Getting Started with Jockey Chat](#getting-started-with-jockey-chat)
  - [Table of Contents](#table-of-contents)
  - [About](#about)
    - [Web services](#web-services)
    - [Tech stack](#tech-stack)
    - [Python dependencies requirements](#python-dependencies-requirements)
  - [What's inside?](#whats-inside)
    - [Apps](#apps)
    - [Functionality Overview](#functionality-overview)
  - [Get Started](#get-started)
  - [Navigation](#navigation)
    - [Servers](#servers)
    - [Frontend](#frontend)
    - [SDK](#sdk)
    - [Proxy Server](#proxy-server)
    - [LangGraph Server](#langgraph-server)
    - [Main\_components](#main_components)
  - [Build and deploy](#build-and-deploy)
  - [Links](#links)

## About

### Web services
We are using Vercel web services to deploy this project

### Tech stack
TypeScript, JavaScript, React, Tailwind CSS, Python, Pandas, Heroku, Ngrok 

### Python dependencies requirements

```
pandas==2.0.3
ffmpeg-python==0.2.0
pytube==15.0.0
grequests==0.7.0
m3u8-To-MP4==0.1.11
langchain==0.1.4
langchain-experimental==0.0.49
tabulate==0.9.0
certifi==2023.11.17
python-dotenv==1.0.1
openai==1.10.0
langchain-openai==0.0.4
rich==13.7.0
fastapi==0.110.0
uvicorn==0.28.0
langserve==0.0.51
sse-starlette==2.0.0
httpx-sse==0.4.0
```

## What's inside?

This project includes the following applications and packages

### Apps
- [JockeyChat]
- [JockeyML]

### Functionality Overview

Additionally, the components within this repository are divided into two distinct packets: components and widgets, based on their intended usage. 


## Get Started

1. Set your `.env` file by following `example.env`  
   You can find the detail of `REACT_APP_LANGCHAIN_API_KEY` in our root `README.md`.

2. Install all required packages using Yarn. Run the following commands
  ```shell
  cd frontend/
  yarn install
  ```

3. To start the project

  ```shell
  # Run jockey server
  cd ../
  python3 -m jockey server

  # Run frontend server
  cd frontend
  node server.js

  # Run frontend app
  yarn start
  ```

## Navigation
### Servers
The structure of the project is divided into several key components: the frontend with LangGraph SDK, the proxy server, and the LangGraph server. The goal is to provide a seamless interaction between the user interface and the LangGraph server, facilitated by the proxy server for better manageability

### Frontend
The frontend is responsible for the user interface and user interactions. It communicates with the LangGraph server via using LangGraph SDK

### SDK
The main purpose of this SDK is for interacting with the LangGraph REST API. You will need a running LangGraph API server. If you're running a server locally using langgraph-cli, the SDK will automatically point to http://localhost:8123. Otherwise, you will need to specify the server URL when creating a client like this:  
`const client = new Client({ apiUrl: "ApiUrlString" })` in the streamEventsAPis component inside the apis folder

### Proxy Server
The proxy server acts as an intermediary between the frontend and twelve labs API. It ensures secure and efficient communication, handles requests from the frontend, and forwards them to the twelve labs API. The proxy server is initially set up in the server file. If you need to create a new proxy server or modernize the existing one, you can refer to the 'server' component in the source. 

### LangGraph Server 
The LangGraph server is the backend component that processes the logic and data required for the application. It receives requests from the Langgraph SDK, processes them, and returns the necessary responses. All of the components related to this functionality located into the Jockey folder with a solid README regarding how to launch, test and modernise the functianality  

### Main_components 
All API calls related to these components are defined in the api folder, where the hooks file is located. 
- api/: Contains API-related files. 
- hooks.js: Defines hooks for making API calls (for the TwelveLabs api's) 
- apiConfig.js: Defines or creates URL paths and keys for React Query. 
- streamEventsApis.js: Contains LangGrap SDK to interect with LangGraph backend

## Build and deploy

This project uses Vercel to ship application on the internet.
For production environment  we use Vercel's default configuration to deploy preview and production app.
Ask the team for an invitation to be added as a member of Twelve Labs Team.

## Links
- [Web site](https://www.twelvelabs.io)
- [Documentation](https://github.com/twelvelabs-io/tl-jockey/blob/main/README.md)
- [Source code](https://github.com/twelvelabs-io/tl-jockey/tree/main)

