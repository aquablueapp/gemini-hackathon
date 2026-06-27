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
  ],
})
