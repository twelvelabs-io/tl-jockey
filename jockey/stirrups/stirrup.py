from langchain_core.messages import AIMessage
from langchain_core.runnables import Runnable
from langchain.tools import BaseTool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain_openai.chat_models.base import BaseChatOpenAI
from typing import List, Union, Dict
from langchain.pydantic_v1 import BaseModel


class Stirrup(BaseModel):
    """Base class for creating workers for an instance of Jockey. Inherits from the Pydantic BaseModel.

    Args:
        tools (List[BaseTool]): The tools a worker has access to.

        worker_prompt_file_path (str): File path to the worker's prompt file.

        worker_name (str): Name of the worker. This is used when constructing the graph for a Jockey instance.
            It is recommended this is name that is used in any prompt files as well.

    Raises:
        TypeError: If a worker LLM instance type isn't supported.

    Returns:
        Runnable: A Runnable which consists of a worker LLM bound with tools and a tool routing coroutine.
    """
    
    tools: List[BaseTool]
    worker_prompt_file_path: str
    worker_name: str

    async def _call_tools(self, message: AIMessage) -> List[Dict]:
        """Routing coroutine for tools bound to the worker.

        Args:
            message (HumanMessage): The output message from the worker after processing the instructor request.

        Returns:
            List[Dict]: A list of dictionaries representing the tool calls made with inputs and outputs.
        """
        # Create a map as a dictionary where the keys are the names of the tools and the values are the tools themselves.
        tool_map = {tool.name: tool for tool in self.tools}
        # Get any tool calls that were provided in the incoming message.
        tool_calls = message.tool_calls.copy()

        for tool_call in tool_calls:
            base_tool: BaseTool = tool_map[tool_call["name"]]
            tool_call["output"] = await base_tool.ainvoke(tool_call["args"])

        return tool_calls
   
    def build_worker(self, worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI]) -> Runnable:
        """Build a useable worker for a Jockey instance.

        Args:
            worker_llm (Union[BaseChatOpenAI  |  AzureChatOpenAI]): 
                The LLM used for the worker node. It is recommended this be a GPT-4 class LLM or better. 

        Raises:
            TypeError: If the worker_llm instance type isn't currently supported.

        Returns:
            Runnable: A Runnable that is used as a worker node in the graph of a Jockey instance.
        """
        if any(map(lambda x: isinstance(worker_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"LLM type must be one of: [BaseChatOpenAI, AzureChatOpenAI]. Got type: {type(worker_llm).__name__}.")
        
        with open(self.worker_prompt_file_path, "r") as worker_prompt_file:
            worker_prompt = worker_prompt_file.read()
        
        # NOTE: We expect the incoming request from the instructor to be complete and singular in nature as you'll notice the
        # absence of any chat history here. This is intended to keep the workers as lightweight as possible so tasks can be
        # executed quickly.
        worker_prompt = ChatPromptTemplate.from_messages([
            ("system", worker_prompt),
            MessagesPlaceholder("worker_task"),
        ])

        worker_llm_with_tools = worker_llm.bind_tools(self.tools)
        # The chain here processes the incoming request from the instructor before that response AIMessage is
        # passed onto the _call_tools coroutine which ten determines which tool to call.
        # We choose this approach so we can directly return a call from any tool a workers uses without any additional parsing.
        worker = worker_prompt | worker_llm_with_tools | self._call_tools
        # WE want to make sure we can parse worker events if needed so we add a custom tag.
        worker = worker.with_config({"tags": [self.worker_name]})
        worker.name = self.worker_name
        return worker
