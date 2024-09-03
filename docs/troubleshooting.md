# Troubleshooting

This section provides solutions to common issues you may encounter while setting up or using Jockey. If you don't find a solution to your problem here, please join the [Multimodal Minds Discord](https://discord.gg/4p9QaBvT6r) server for additional support.

## Package Installation Fails

**Issue**: The `pip install -r requirements.txt` command fails. 
**Solution**:
1. Ensure your virtual environment is activated. 
2. Update pip: `pip install --upgrade pip`.
3. If a specific package fails, try installing it separately and note any error messages.


## Environment Variables Not Recognized

**Issue**: Jockey can't access environment variables.
**Solution**:
1. Ensure the `.env` file is in the root directory of the project. 
2. Verify that all required variables are set.

## API Key Authentication Fails

**Issue**: Twelve Labs or the LLM provider rejects you API key.
**Solution**:
1. Double-check that the API key in your `.env` file is correct and complete.
2. Ensure there are no extra spaces or newline characters in the API key.
3. Verify that your API key is active.

## Jockey Fails to Start in Terminal Mode

**Issue**: Error when running `python3 -m jockey terminal`.
**Solution**:
1. Ensure your virtual environment is activated.
2. Verify all dependencies are installed correctly.
3. Check the console output for specific error messages and address them accordingly.

## LangGraph API Server Won't Start
**Issue**: Error when running `python3 -m jockey server`.
**Solution**:
1. Ensure Docker and Docker Compose are installed and running.
2. Check if the 8124 port is available and not in use by other applications.
3. Review the Docker logs for any specific error messages.
