/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const pluralRules = new Intl.PluralRules('en-US')

function pluralize(count: number, singular: string, plural?: string): string {
	const grammaticalNumber = pluralRules.select(count)

	switch (grammaticalNumber) {
		case 'zero':
		case 'one':
			return `${count} ${singular}`
		case 'two':
		case 'few':
		case 'many':
		case 'other':
			return plural ? `${count} ${plural}` : `${count} ${singular}s`
		default:
			throw new Error(`Unknown: ${grammaticalNumber}`)
	}
}

export default pluralize
