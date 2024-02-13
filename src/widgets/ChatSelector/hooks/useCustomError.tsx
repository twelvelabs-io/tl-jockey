import { useState, useEffect } from 'react';

const useCustomError = (errorMessage: string): string => {
  const [customMessage, setCustomMessage] = useState<string>("Unknown Error");

  useEffect(() => {
    const mappings: Record<string, boolean> = {
      'Caught Value Error': true,
      'Caught torch.cuda.CudaError': true,
      'Caught Unknown Error': true,
    };

    setCustomMessage(mappings[errorMessage] ? "Temporary Service Overload – Your Patience is Appreciated" : customMessage);
  }, [errorMessage, customMessage]);

  return customMessage;
};

export default useCustomError;
