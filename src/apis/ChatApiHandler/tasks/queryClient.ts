import { QueryClient } from 'react-query'

export default new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			suspense: true,
			useErrorBoundary: true,
			staleTime: 60 * 1000 /* 1 min */,
			cacheTime: Infinity,
			refetchOnMount: true,
			refetchOnWindowFocus: false,
			refetchIntervalInBackground: false
		}
	}
})
