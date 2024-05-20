from langchain_core.messages import AIMessage
from langchain_core.runnables import Runnable
from langchain.tools import BaseTool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain_openai.chat_models.base import BaseChatOpenAI
from typing import List, Union
from langchain.pydantic_v1 import BaseModel


class Stirrup(BaseModel):
    tools: List[BaseTool]
    worker_prompt_file_path: str
    worker_name: str

    async def call_tools(self, message: AIMessage) -> Runnable:
        tool_map = {tool.name: tool for tool in self.tools}
        tool_calls = message.tool_calls.copy()

        for tool_call in tool_calls:
            base_tool: BaseTool = tool_map[tool_call["name"]]
            tool_call["output"] = await base_tool.ainvoke(tool_call["args"])
        return tool_calls
   
    def build_worker(self, worker_llm: Union[BaseChatOpenAI | AzureChatOpenAI]) -> Runnable:
        if any(map(lambda x: isinstance(worker_llm, x), [BaseChatOpenAI, AzureChatOpenAI])) is False:
            raise TypeError(f"LLM type must be one of: [BaseChatOpenAI, AzureChatOpenAI]. Got type: {type(worker_llm).__name__}.")
        
        with open(self.worker_prompt_file_path, "r") as worker_prompt_file:
            worker_prompt = worker_prompt_file.read()
        
        worker_prompt = ChatPromptTemplate.from_messages([
            ("system", worker_prompt),
            MessagesPlaceholder("worker_task"),
        ])

        worker_llm_with_tools = worker_llm.bind_tools(self.tools)
        worker = worker_prompt | worker_llm_with_tools | self.call_tools
        worker = worker.with_config({"tags": [self.worker_name]})
        worker.name = self.worker_name
        return worker
