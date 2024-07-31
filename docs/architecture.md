# Architecture

Jockey uses a multi-agent system to process complex video tasks efficiently. The system has three main components:

- [Supervisor](../jockey/prompts/supervisor.md)
- [Planner](../jockey/prompts/planner.md)
- Workers

The diagram below illustrates how these components interact. 

![Jockey Architecture](../assets/jockey_architecture.jpg)

## Supervisor

The [supervisor](../jockey/prompts/supervisor.md) coordinates the overall workflow by:
- Receiving user input
- Routing tasks between nodes
- Managing error recovery
- Ensuring adherence to the current plan
- Initiating replanning when necessary

For complex requests, the Supervisor engages the planner. For simpler tasks, it directs work to specific workers.

## Planner

The [planner](../jockey/prompts/planner.md) creates detailed, step-by-step plans for complex user requests. It breaks down tasks into manageable steps for the worker nodes to execute. This component is crucial for multi-step video processing workflows that require a strategic approach.

## Workers

The worker nodes consists of two components:
    - [**Instructor**](../jockey/prompts/instructor.md): Generates precise and complete task instructions for individual workers based on the Planner's strategy.
    - [**Actual Workers**](../jockey/stirrups): Agents that ingest the instructions from the instructor and execute them using the tools they have available.

## Additional Resources

- [Jockey Architecture Walkthrough Video](https://www.loom.com/share/72c64749c3ca473eaeaf6e4643ca2621?sid=57dca306-35a3-4a04-9576-ceb9ddbc7c60)