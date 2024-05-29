export const streamEvents = async (ActionType, dispatch, inputBox, setStreamData, arrayMessages) => {
    const includeTypes = ["chat_model"];
    const includeNames = ["AzureChatOpenAI", "video-search", "download-video", "combine-clips", "remove-segment"];
    const indexID = process.env.REACT_APP_API_INDEX_ID
    const configForJockey = {
        input: `Use index id ${indexID} ${inputBox}`,
        tool_descriptions: {
          "video-search": " Run a search query against a collection of videos and get results.",
          "download-video": " Download a video for a given video in a given index and get the filepath. \n    Should only be used when the user explicitly requests video editing functionalities.",
          "combine-clips": "search tool. The full filepath for the combined clips is returned.",
          "remove-segment": " Remove a segment from a video at specified start and end times The full filepath for the edited video is returned."
        },
        configurable: { session_id: Date.now() },
        version: "v1",
        include_types: includeTypes,
        include_names: includeNames,
      };
    fetch(apiConfig.PROXY_SERVER, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/event-stream',
      },
      body: JSON.stringify(configForJockey),
    })
    .then(async response => {
      StreamHandler({response, ActionType, dispatch, inputBox, setStreamData, arrayMessages})
    })
    .catch(error => {
      console.error('Error:', error);
    })
};