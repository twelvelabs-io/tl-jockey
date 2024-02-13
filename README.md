# Getting Started with Twelve Labs Chat

<img width="1002" alt="Screenshot 2024-02-12 at 7 43 26 PM" src="https://github.com/twelvelabs-io/chat-app/assets/101737790/6c911ad4-7c7d-4255-b640-80aa4b7e71e1">

This repository utilizes NGROK to facilitate running a local server for handling API calls. The primary component responsible for managing these requests is aptly named "server.tsx", effectively handling all server-side calls required by our application

Install all required packages using Yarn. Run the following command

# Commands

### `yarn install`

Start the local server using NGROK

### `ngrok start <server.tsx>`

## Functionality Overview

Upon initiating a chat, two requests occur in the background. These requests involve:
- Interaction with the Twelve Labs AI Pegasus
- Utilization of an ASR model for comparison purposes

Additionally, the components within this repository are divided into two distinct packets: components and widgets, based on their intended usage. 
