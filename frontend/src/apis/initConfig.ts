import { Client } from '@langchain/langgraph-sdk';
import { JockeyState, Clip } from './streamEventsApis';

const clientUrl = process.env.REACT_APP_CLIENT_URL;
const indexId = process.env.REACT_APP_INDEX;

export const client = new Client({ apiUrl: clientUrl });

export const initJockeyInput: JockeyState = {
    chat_history: [
        {
            role: 'human',
            name: 'user',
        },
    ],
    made_plan: false,
    next_worker: null,
    active_plan: null,
    clips_from_search: {} as Record<string, Clip[]>,
    relevant_clip_keys: [] as string[],
    tool_call: null,
    index_id: null,
};

export const initialize = async (inputBox: string) => {
    const assistants = await client.assistants.search();
    const assistant = assistants[0];
    const thread = await client.threads.create();

    initJockeyInput.chat_history[0].content = `${inputBox} in the index ${indexId}`;

    return { assistant, thread };
}; 