import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    formatters: true,
    ignores: [
      'dist',
      'node_modules',
    ],
    rules: {
      'no-console': ['error', { allow: ['warn'] }],
    },
  },
  // 豁免：启动脚本、CLI 迁移脚本、测试文件（logger 不可用或不必要）
  {
    files: [
      'src/env.ts',
      'src/index.ts',
      'src/db/migrate.ts',
      'src/db/run_*.ts',
      'src/test-helpers/*.ts',
      '**/*.test.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
)
