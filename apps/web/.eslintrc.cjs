// apps/web/.eslintrc.cjs
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true, // 상위에서 중복 상속되는 것 방지 (권장)
  // ...기존 extends, parserOptions, plugins 등

  rules: {
    // 기본: 전역에서 금지
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: '@/types/types-reading',
          message: 'Reading 타입/스키마는 "@/models/reading"에서만 가져오세요 (SSOT).'
        },
        {
          name: '@/lib/readingTypes',
          message: 'Reading 타입/스키마는 "@/models/reading"에서만 가져오세요 (SSOT).'
        },
        {
          name: '@/lib/readingSchemas',
          message: 'Reading 타입/스키마는 "@/models/reading"에서만 가져오세요 (SSOT).'
        }
      ],
      patterns: [
        {
          group: [
            '**/types-reading*',
            '**/*readingTypes*'
          ],
          message: 'Reading 타입/스키마는 "@/models/reading"에서만 가져오세요 (SSOT).'
        }
      ]
    }]
  },

  // ✅ 예외: SSOT 리-익스포트 파일에서는 schemas 허용
  overrides: [
    {
      // ⚠️ 이 경로는 apps/web/.eslintrc.cjs 기준
      files: ['models/reading/index.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          // 여기선 과거 경로는 여전히 금지
          paths: [
            {
              name: '@/types/types-reading',
              message: '여기서도 과거 타입 경로는 금지입니다.'
            },
            {
              name: '@/lib/readingTypes',
              message: '여기서도 과거 타입 경로는 금지입니다.'
            }
            // 의도적으로 '@/lib/readingSchemas'는 제한하지 않음 (re-export 허용)
          ],
          patterns: [
            {
              group: ['**/types-reading*', '**/*readingTypes*'],
              message: '여기서도 과거 패턴은 금지입니다.'
            }
          ]
        }]
      }
    }
  ],

  settings: {
    // import/no-unresolved 같은 규칙 사용할 때 경로 별칭 해석 보조
    'import/resolver': {
      typescript: {
        project: './tsconfig.json' // apps/web/tsconfig.json 기준으로 조정
      }
    }
  }
};
