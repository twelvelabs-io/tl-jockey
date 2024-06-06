module.exports = {
	// ... other configurations
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	parserOptions: {
	  project: './tsconfig.json', // Path to your TypeScript project configuration file
	},
	rules: {
	  // ... other rules
	  '@typescript-eslint/strict-boolean-expressions': 'error',
	},
  };