# Getting Started with Twelve Labs Chat

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
