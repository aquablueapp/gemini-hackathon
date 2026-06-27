import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  formatters: true,
  ignores: [
    'dist',
    'build',
    '**/*.md',
    'node_modules',
    'src/routeTree.gen.ts',
    '**/*.test.ts',
    '**/*.config.ts',
  ],
  rules: {
    'no-console': ['error', { allow: ['warn'] }],
  },
})
