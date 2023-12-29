import React from 'react'
import { useEffect, useState, Suspense as ReactSuspense } from 'react'

function useMounted(): boolean {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	return mounted
}

interface SuspenseProps {
	fallback: JSX.Element
	children?: JSX.Element
}

/**
 * @version next@12.1.6
 * @version react@18.1.0
 *
 * For now, `React.Suspense` is not supported on ReactDOMServer.
 * So we need to customize suspense is runnable on server side as well.
 */
const Suspense = ({ fallback, children }: SuspenseProps): JSX.Element => {
	const mounted = useMounted()

	return mounted ? <ReactSuspense fallback={fallback}>{children}</ReactSuspense> : fallback
}

export default Suspense
