# apps / web /.eslintrc.cjs 전체를 아래로 교체
Set - Content apps / web /.eslintrc.cjs @"
module.exports = {
  extends: ['next/core-web-vitals'],
    rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '@/types/types-reading',
              '@/lib/readingSchemas',
              'apps/web/types/types-reading',
            ],
            message:
              'Reading types must come from @/models/reading (SSOT). Update imports.',
          },
        ],
      },
    ],
  },
}
"@ -Encoding UTF8
