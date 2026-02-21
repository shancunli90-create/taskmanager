//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: ['./*.js', './*.ts', '.storybook'],
  },
  ...tanstackConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array',
          readonly: 'array',
        },
      ],
    },
  },
]
