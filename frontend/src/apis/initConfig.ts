import {Client} from '@langchain/langgraph-sdk'

const clientUrl = process.env.REACT_APP_CLIENT_URL

export const client = new Client({apiUrl: clientUrl})

export const initialize = async () => {
	const assistants = await client.assistants.search()
	const assistant = assistants[0]
	const thread = await client.threads.create()

	return {assistant, thread}
}
