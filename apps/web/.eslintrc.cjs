// apps/web/.eslintrc.cjs
/** @type {import('eslint').Linter.Config} */
module.exports = {
  // ...기존 설정들
  rules: {
    // 기본: 전역에서 금지
    'no-restricted-imports': ['error', {
      // 특정 경로 정확히 막기 (paths 사용이 가장 안전)
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
      // 필요 시 와일드카드(패턴)도 보조적으로 사용
      patterns: [
        {
          group: [
            // 과거 파일/경로 잔존 대비 보조 패턴
            '**/types-reading*',
            '**/*readingTypes*'
          ],
          message: 'Reading 타입/스키마는 "@/models/reading"에서만 가져오세요 (SSOT).'
        }
      ]
    }]
  },

  // ✅ 예외: SSOT 리에x스포트 파일에서는 허용
  overrides: [
    {
      files: ['apps/web/models/reading/index.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          // 이 파일에선 schemas만 허용하고, 나머지는 그대로 금지
          paths: [
            {
              name: '@/types/types-reading',
              message: '여기서도 과거 타입 경로는 금지입니다.'
            },
            {
              name: '@/lib/readingTypes',
              message: '여기서도 과거 타입 경로는 금지입니다.'
            }
            // ⚠️ 의도적으로 '@/lib/readingSchemas'는 여기서 제한하지 않음 (re-export 허용)
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
  ]
};
