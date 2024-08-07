# Deploy and Use Jockey with the LangGraph API Server

The LangGraph API Server deployment is suitable for building and debugging end-to-end user applications.

1. Activate your virtual environment:
    ```sh
    source venv/bin/activate
    ```
2. Run the command below and wait for the message indicating that the server is running. By default, it will be available at [http://localhost:8124](http://localhost:8124):
    ```sh
    python3 -m jockey server
    ```
3. Once the server is running, you can interact with Jockey using HTTP requests or the [LangGraph Python SDK](https://pypi.org/project/langgraph-sdk/).

#### Debug using the LangGraph Debugger

The LangGraph API Server includes a debugger that you can use for monitoring and debugging Jockey:

1. Open a web browser and navigate to [http://localhost:8124](http://localhost:8124).
    ![LangGraph Debugger](assets/langgraph_debugger.png)
2. Select "jockey" under the "Assistants" section.
3. Click "New Thread" to start a new conversation with Jockey.
4. Use the debugger to step into the Jockey instance. You can add breakpoints to examine and validate the graph state for any given input.
    ![Jockey LangGraph Debugger](assets/jockey_langgraph_debugger.png)

[LangGraph Debugger UI Walkthrough](https://www.loom.com/share/9b7594df37294edcaed31a4b2d901d7b?sid=28a9019d-0ac4-4ca6-a874-d334e2ab1221).
