interface UseChatApiProps {
  url: string
  requestData: any
  maxRetries?: number
  retryTimeout?: number
  selectedFile: boolean
}

const useChatApi = ({
  url,
  requestData,
  maxRetries = 1,
  retryTimeout = 1000,
  selectedFile
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
}: UseChatApiProps) => {

}

export default useChatApi
