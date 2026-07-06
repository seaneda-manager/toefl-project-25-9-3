import type { LandingPageConfig } from './types';

export const TOEFL_DEFAULT: LandingPageConfig = {
  pageKey: 'landing_toefl_v1',
  theme: 'indigo',
  showLogo: true,
  nav: { links: ['기능', '요금제', '후기'], cta: '무료로 시작하기' },
  hero: {
    badge: 'AI 기반 TOEFL 학습',
    title: 'TOEFL 목표 점수,',
    titleEm: '더 빠르게 달성하세요',
    body: 'Reading · Listening · Speaking · Writing 4개 영역을 AI와 함께 체계적으로 준비합니다. 내 수준에 맞는 학습, 매일 조금씩.',
    ctaPrimary: '무료로 시작하기 →',
    ctaSecondary: '데모 보기',
    socialProof: '이 이미 공부하고 있어요',
    socialCount: '2,400명+',
  },
  stats: [
    { value: '+23점', label: '평균 점수 향상' },
    { value: '8주', label: '평균 목표 달성 기간' },
    { value: '94%', label: '목표 점수 달성률' },
    { value: '4.9★', label: '사용자 평점' },
  ],
  sections: [
    {
      id: 'skills',
      badge: '4 Skills',
      heading: 'TOEFL 4개 영역,',
      body: '수능 영어와 다른 TOEFL만의 문제 유형을 AI가 분석하고 약점을 집중 공략합니다.',
      layout: 'grid2',
      items: [
        { icon: '📖', title: 'Reading', body: '학술 지문 독해, 어휘·추론·수사적 목적 문제 유형 훈련', tag: 'Reading', skillColor: 'read' },
        { icon: '🎧', title: 'Listening', body: '강의·대화 음원 받아쓰기, 핵심 정보 파악, AudiQ 게임 연습', tag: 'Listening', skillColor: 'listen' },
        { icon: '🎤', title: 'Speaking', body: 'Echo 쉐도윙으로 발음·유창성 훈련, AI 점수 피드백', tag: 'Speaking', skillColor: 'speak' },
        { icon: '✍️', title: 'Writing', body: 'Integrated·Academic Discussion 유형, AI 첨삭 및 모범답안 제공', tag: 'Writing', skillColor: 'write' },
      ],
    },
    {
      id: 'howto',
      badge: 'How it works',
      heading: '3단계로 시작하세요',
      layout: 'steps',
      alt: true,
      items: [
        { title: '레벨 테스트 (1~6 진단)', body: '10분 진단 테스트로 영역별 레벨을 측정합니다. 목표 점수와 시험일을 입력하면 레벨별 학습 플랜이 자동으로 만들어집니다.' },
        { title: 'AI 맞춤 학습', body: '현재 레벨에 맞는 지문·음원·문제가 매일 추천됩니다. 레벨이 오를 때마다 난도가 자동 조정됩니다.' },
        { title: '모의고사로 레벨 확인', body: '실전 모의고사 후 영역별 레벨 변화를 한눈에 확인합니다. 목표 레벨까지 남은 거리를 시각적으로 보여줍니다.' },
      ],
    },
  ],
  testimonials: {
    badge: '후기',
    heading: '실제 학생들의 이야기',
    items: [
      { quote: 'Speaking이 제일 두려웠는데 Echo 쉐도윙 2주 했더니 22점 받았어요. 발음 피드백이 신기합니다.', name: '김지원', detail: '고3, 목표 100점 달성', stat: '85 → 107점', initials: '김' },
      { quote: 'Writing AI 첨삭이 학원 선생님보다 자세해요. Integrated 유형 완전히 잡았습니다.', name: '이민준', detail: '재수생, 유학 준비', stat: '79 → 98점', initials: '이' },
      { quote: 'AudiQ 게임으로 Listening 매일 하다 보니 속도 적응이 됐어요. 생각보다 재미있어서 계속하게 됩니다.', name: '박소연', detail: '대학생, 유학 준비', stat: '6주 만에 +19점', initials: '박' },
      { quote: '6주 만에 79점에서 98점. Reading 약점을 AI가 잡아줬어요. 학원 안 다녀도 됩니다.', name: '최현우', detail: '고2, 조기 준비', stat: '79 → 98점', initials: '최' },
    ],
  },
  pricing: {
    badge: '요금제',
    heading: '합리적인 가격으로 시작하세요',
    tiers: [
      { name: '무료', price: '₩0', per: '/ 월', desc: 'Level 1~2 체험', features: ['Reading 지문 5개/월', 'Echo 쉐도윙 기본', '모의고사 1회'], cta: '무료로 시작', featured: false },
      { name: 'Pro', price: '₩29,000', per: '/ 월', desc: 'Level 6까지 무제한', features: ['4개 영역 전 레벨 무제한', 'AI 첨삭 · 피드백 무제한', '모의고사 무제한', 'Arcade 게임 전체 오픈'], cta: '지금 시작하기', featured: true },
    ],
  },
  cta: { heading: '오늘 바로 시작하세요', headingEm: '', body: '신용카드 없이 무료로 체험할 수 있습니다', button: '무료로 시작하기 →' },
};

export const NAESIN_DEFAULT: LandingPageConfig = {
  pageKey: 'landing_naesin_v1',
  theme: 'teal',
  showLogo: true,
  nav: { links: ['기능', '요금제', '도입 사례'], cta: '학원 도입 문의' },
  hero: {
    badge: '학원 전용 플랫폼',
    title: '내신 영어 성적,',
    titleEm: '데이터로 올려드립니다',
    body: '학교별 기출 지문 분석부터 AI 예상문제 생성, 학생 성취도 관리까지. 선생님은 가르치는 데만 집중하세요.',
    ctaPrimary: '무료 체험 신청 →',
    ctaSecondary: '데모 영상 보기',
    socialProof: '도입 후 평균 내신 등급 0.8등급 향상 · 설치 없이 브라우저로 바로 사용',
  },
  stats: [
    { value: '0.8등급', label: '평균 내신 향상' },
    { value: '120+', label: '도입 학원' },
    { value: '4만+', label: '등록 학생' },
    { value: '98%', label: '재계약률' },
  ],
  sections: [
    {
      id: 'ps',
      badge: '문제 인식',
      heading: '선생님들이 겪는 문제, 저희가 해결했습니다',
      layout: 'ps',
      items: [
        { title: '예상문제 직접 만들기', body: '학교별 기출을 수작업으로 분석하고 문제를 만드는 데 수십 시간 소요', badge: '기존 방식의 문제' },
        { title: 'AI가 30문항 즉시 생성', body: '학교·학년·시험 시기만 선택하면 수능 스타일 예상문제가 1분 내 완성', badge: 'LexioX 솔루션' },
        { title: '학생 관리 어려움', body: '누가 어느 단원을 모르는지 파악하기 어렵고 개별 피드백 줄 시간 부족', badge: '기존 방식의 문제' },
        { title: '학생별 취약 유형 자동 분석', body: '대시보드에서 학생별 유형별 정답률을 한눈에 확인. 약점 집중 지도 가능', badge: 'LexioX 솔루션' },
        { title: '학부모 소통 비효율', body: '성적 리포트 정리에 시간이 너무 많이 들고, 학부모 문의에 즉각 답변이 어려움', badge: '기존 방식의 문제' },
        { title: '자동 성취도 리포트', body: '매월 학부모에게 학생 성취도 리포트 자동 발송. 신뢰도 향상에 직결', badge: 'LexioX 솔루션' },
      ],
    },
    {
      id: 'features',
      badge: '핵심 기능',
      heading: '학원 운영을 바꾸는 3가지 핵심 기능',
      layout: 'list',
      alt: true,
      items: [
        { icon: '📝', title: 'AI 예상문제 생성기', body: '학교·학년·시험 시기를 선택하면 공통 지문 + 학교 지문을 분석해 30문항을 즉시 생성합니다.', tag: '1분 이내 완성' },
        { icon: '📊', title: '학생 성취도 대시보드', body: '학생별·유형별 정답률을 실시간으로 확인합니다. 반 전체 취약 유형을 파악해 다음 수업 내용을 데이터 기반으로 결정할 수 있습니다.', tag: '실시간 업데이트' },
        { icon: '📄', title: '자동 리포트 & 인쇄', body: '생성된 문제는 즉시 인쇄 가능한 시험지 형식으로 제공됩니다. 학생 성취도 리포트는 PDF로 자동 생성돼 학부모에게 발송됩니다.', tag: 'PDF 자동 생성' },
      ],
    },
    {
      id: 'steps',
      badge: '도입 과정',
      heading: '도입부터 운영까지 단 4단계',
      layout: 'steps',
      items: [
        { title: '무료 체험 신청', body: '이름·학원명·연락처만 입력하면 담당자가 1영업일 내 연락드립니다.' },
        { title: '지문 데이터 등록', body: '담당 학교·학년의 기출 지문을 업로드하면 AI가 자동으로 분류합니다. 보통 1~2일 소요.' },
        { title: '학생 계정 생성', body: 'Excel로 학생 명단을 업로드하면 계정이 일괄 생성됩니다. 개별 가입 안내 불필요.' },
        { title: '바로 사용 시작', body: '설치 없이 브라우저로 즉시 사용. 온보딩 교육은 화상회의 30분으로 완료됩니다.' },
      ],
    },
  ],
  testimonials: {
    badge: '도입 사례',
    heading: '학원장·선생님 후기',
    items: [
      { quote: '예상문제 만드는 데 3시간 걸리던 게 이제 5분이에요. 그 시간에 학생 질문을 더 받을 수 있어서 수업 질이 확실히 달라졌습니다.', name: '김선생님', detail: '강남 A어학원 · 고등부 영어', stat: '내신 평균 1.2등급 향상', initials: '김' },
      { quote: '학부모 리포트가 자동으로 나가니까 문의가 거의 사라졌어요. 재등록률도 올랐습니다.', name: '박원장님', detail: '분당 B영어학원 · 원장', stat: '학원 등록률 23% 증가', initials: '박' },
    ],
  },
  pricing: {
    badge: '요금제',
    heading: '학원 규모에 맞게 선택하세요',
    tiers: [
      { name: '스타터', price: '₩99,000', per: '/ 월', desc: '학생 30명까지', features: ['AI 예상문제 생성 (월 20회)', '학생 성취도 대시보드', '인쇄용 시험지 출력'], cta: '시작하기', featured: false },
      { name: '스탠다드', price: '₩199,000', per: '/ 월', desc: '학생 100명까지', features: ['AI 예상문제 생성 무제한', '학부모 자동 리포트', '학생 Arcade 게임 이용', '전담 고객 지원'], cta: '무료 체험 신청', featured: true },
      { name: '엔터프라이즈', price: '별도 문의', per: '', desc: '학생 무제한 · 프랜차이즈', features: ['스탠다드 전체 포함', '다지점 통합 관리', '전용 온보딩 지원', 'SLA 보장'], cta: '문의하기', featured: false },
    ],
  },
  cta: { heading: '지금 바로 무료로 체험해보세요', body: '14일 무료 체험 · 신용카드 불필요 · 언제든 해지 가능', button: '무료 체험 신청 →', button2: '담당자와 상담하기' },
};

export const JR_DEFAULT: LandingPageConfig = {
  pageKey: 'landing_jr_v1',
  theme: 'amber',
  showLogo: true,
  nav: { links: ['커리큘럼', '학습 리포트', '요금제'], cta: '무료 체험 신청' },
  hero: {
    badge: '초·중등 전용 영어 플랫폼',
    title: '영어가 재미있어지면',
    titleEm: '성적은 따라옵니다',
    body: '초등 3학년 ~ 중학교 3학년을 위한 맞춤 영어 학습. 게임처럼 즐기고, 성적으로 확인합니다.',
    ctaPrimary: '2주 무료 체험 →',
    ctaSecondary: '커리큘럼 보기',
    socialProof: '부모님은 매주 리포트로 학습 현황을 확인할 수 있습니다.',
  },
  stats: [
    { value: '초3~중3', label: '대상 학년' },
    { value: '8,000+', label: '수강 학생' },
    { value: '주 1회', label: '부모님 리포트' },
    { value: '4.8★', label: '학부모 만족도' },
  ],
  sections: [
    {
      id: 'audience',
      badge: '누구를 위한 서비스인가요?',
      heading: '학생과 부모님, 모두를 생각했습니다',
      layout: 'audience',
      items: [
        { icon: '🎮', title: '우리 아이는', body: '게임처럼 재미있는 방식으로 영어를 배웁니다\nArcade 게임으로 매일 조금씩 실력을 키웁니다\n레벨이 오를수록 더 어려운 콘텐츠에 도전합니다\n쉐도윙으로 원어민 발음을 따라 말하며 Speaking을 키웁니다' },
        { icon: '📊', title: '부모님은', body: '매주 학습 시간·영역별 점수를 리포트로 받아봅니다\n아이가 무엇을 어려워하는지 한눈에 파악합니다\n담당 선생님과 리포트 기반으로 소통합니다\n학원 방문 없이 온라인으로 진도를 확인합니다' },
      ],
    },
    {
      id: 'curriculum',
      badge: '커리큘럼',
      heading: '단계별 체계적인 Junior 커리큘럼',
      body: '초등 기초부터 중등 심화까지, 레벨에 맞게 자동으로 조정됩니다.',
      layout: 'grid2',
      alt: true,
      items: [
        { icon: '🔤', title: 'Phonics & Vocab', body: '파닉스 기초부터 중학 필수 어휘까지. 게임형 단어 학습으로 자연스럽게 습득.', tag: '초3~초6' },
        { icon: '📖', title: 'Reading Comprehension', body: '학교 교과서 지문 기반 독해. 주제·요지·세부 내용 파악 훈련.', tag: '초5~중3' },
        { icon: '🎧', title: 'Listening & Speaking', body: 'AudiQ 게임으로 듣기, Echo 쉐도윙으로 말하기. 실전 회화 실력 향상.', tag: '초3~중3' },
        { icon: '✏️', title: 'Grammar & Writing', body: '중학 문법 핵심 정리 + AI 첨삭 작문. 내신 서술형까지 대비.', tag: '중1~중3' },
      ],
    },
  ],
  testimonials: {
    badge: '후기',
    heading: '학부모님 후기',
    items: [
      { quote: '아이가 영어 싫다고 했는데 AudiQ 게임부터 시작하더니 이제 스스로 하더라고요. 2달 만에 학교 영어 시험 20점 올랐습니다.', name: '김○○ 어머니', detail: '초5 자녀', stat: '시험 20점 향상', initials: '김' },
      { quote: '주간 리포트가 자세히 나와서 어느 부분이 부족한지 파악하기 쉬웠어요. 선생님과 상담할 때도 데이터 보면서 얘기할 수 있어서 좋았습니다.', name: '이○○ 아버지', detail: '중1 자녀', stat: '학기 내신 상승', initials: '이' },
    ],
  },
  pricing: {
    badge: '요금제',
    heading: '합리적인 가격으로 시작하세요',
    tiers: [
      { name: '베이직', price: '₩19,000', per: '/ 월', desc: '자녀 1명', features: ['4개 영역 기본 학습', 'Arcade 게임 일부 이용', '월간 학습 리포트'], cta: '시작하기', featured: false },
      { name: '프리미엄', price: '₩35,000', per: '/ 월', desc: '자녀 1명 · 전체 무제한', features: ['4개 영역 전체 무제한', 'Arcade 게임 전부 오픈', '주간 학습 리포트', 'AI 작문 첨삭 무제한', '선생님 1:1 피드백'], cta: '2주 무료 체험 →', featured: true },
    ],
  },
  cta: { heading: '2주 동안 무료로 써보세요', body: '결제 없이 전체 기능을 체험할 수 있습니다', button: '무료 체험 시작 →', button2: '커리큘럼 상담하기' },
};

export const VOCA_DEFAULT: LandingPageConfig = {
  pageKey: 'landing_voca_v1',
  theme: 'purple',
  showLogo: true,
  nav: { links: ['학습 방식', 'Pax 아바타', '요금제'], cta: '무료로 시작하기' },
  hero: {
    badge: 'AI 단어 학습 플랫폼',
    title: '단어를 외우는 게 아니라',
    titleEm: '만나게 합니다',
    body: '게임 속에서 반복하고, 아바타와 함께 성장하는 새로운 어휘 학습. 말해보카 보다 재미있게.',
    ctaPrimary: '무료로 시작하기 →',
    ctaSecondary: '데모 보기',
    socialProof: '수능 필수 어휘 · 내신 어휘 · TOEFL 어휘 전부 포함',
  },
  stats: [
    { value: '50,000+', label: '수록 단어 수' },
    { value: '3배', label: '일반 암기 대비 기억률' },
    { value: 'Pax', label: '함께 성장하는 아바타' },
    { value: '4.9★', label: '사용자 평점' },
  ],
  sections: [
    {
      id: 'modes',
      badge: '학습 방식',
      heading: '4가지 방식으로 같은 단어를 반복합니다',
      body: '한 번 본 단어가 아니라, 여러 맥락에서 만난 단어만 진짜 내 것이 됩니다.',
      layout: 'grid2',
      items: [
        { icon: '🃏', title: '플래시카드', body: '단어와 예문을 교차 반복. 망각 곡선 기반 스케줄로 최적 타이밍에 복습.', tag: '기억 최적화' },
        { icon: '🎮', title: '단어 게임', body: 'LitQuest·GlimpseQ 등 Arcade 게임 안에서 자연스럽게 단어를 접합니다.', tag: '게임 연동' },
        { icon: '🔊', title: '발음 & 쉐도윙', body: 'ElevenLabs TTS로 원어민 발음을 듣고, 직접 따라 말하며 발음을 교정합니다.', tag: 'Echo 연동' },
        { icon: '📝', title: '문장 속 어휘', body: '수능·내신 지문에서 실제로 쓰인 예문으로 어휘를 맥락과 함께 학습합니다.', tag: '지문 연동' },
      ],
    },
    {
      id: 'audience',
      badge: '이런 분들께 추천합니다',
      heading: '학생도, 학원도 모두 쓸 수 있습니다',
      layout: 'audience',
      alt: true,
      items: [
        { icon: '🎓', title: '학생 · 개인', body: '수능 필수 어휘를 게임으로 즐기며 암기\nTOEFL 어휘까지 한 플랫폼에서 완성\nPax 아바타와 함께 꾸준히 동기부여\n하루 10분으로 단어 1,000개 완성' },
        { icon: '🏫', title: '학원 · B2B', body: '반별 단어 학습 현황 대시보드\n교재 연동 어휘 리스트 커스텀 등록\n학부모에게 단어 학습 리포트 자동 발송\n내신 랜딩과 패키지 할인 적용 가능' },
      ],
    },
  ],
  testimonials: {
    badge: '후기',
    heading: '사용자 후기',
    items: [
      { quote: '플래시카드 앱은 많은데 게임이랑 연동되는 건 처음 봤어요. 단어 외우는 게 싫었는데 이제는 자연스럽게 하게 됩니다.', name: '정민서', detail: '고2, 수능 준비', stat: '2달 만에 어휘 800개 습득', initials: '정' },
      { quote: 'Pax가 레벨업할 때마다 뿌듯해서 매일 하게 돼요. 아이가 스스로 단어 공부를 찾아서 하는 게 신기합니다.', name: '박○○ 어머니', detail: '중3 자녀', stat: '어휘 시험 15점 향상', initials: '박' },
    ],
  },
  pricing: {
    badge: '요금제',
    heading: '단어부터 게임까지 하나의 요금제로',
    tiers: [
      { name: '무료', price: '₩0', per: '/ 월', desc: '기본 체험', features: ['어휘 500개', 'Pax 기본 성장', '게임 일부 이용'], cta: '무료 시작', featured: false },
      { name: 'Pro', price: '₩15,000', per: '/ 월', desc: '개인 전체 이용', features: ['전체 어휘 50,000+', 'Pax 전체 성장 라인', 'Arcade 게임 전부 오픈', '발음 첨삭 무제한'], cta: '지금 시작하기', featured: true },
      { name: '학원 플랜', price: '별도 문의', per: '', desc: '학생 단위 요금', features: ['반별 대시보드', '커스텀 단어 리스트', '내신 플랜 패키지 할인'], cta: '문의하기', featured: false },
    ],
  },
  cta: { heading: '오늘부터 Pax와 함께 시작하세요', body: '무료로 어휘 500개까지 체험할 수 있습니다', button: '무료로 시작하기 →' },
};

export const ARCADE_DEFAULT: LandingPageConfig = {
  pageKey: 'landing_arcade_v1',
  theme: 'dark',
  showLogo: true,
  nav: { links: ['게임', '랭킹', '요금제'], cta: '무료로 시작하기' },
  hero: {
    badge: '언어 학습 게임 허브',
    title: '영어 공부가',
    titleEm: '게임이 됩니다',
    body: 'Echo, AudiQ, Wordfire, GlimpseQ, Quill Duel, LitQuest — 6가지 게임으로 영어 실력을 레벨업하세요.',
    ctaPrimary: '무료로 플레이 →',
    ctaSecondary: '게임 둘러보기',
    socialProof: '이 지금 플레이 중',
    socialCount: '5,200명+',
  },
  stats: [
    { value: '6가지', label: '언어 학습 게임' },
    { value: '매일', label: '새 Daily Challenge' },
    { value: 'XP', label: '플레이할수록 레벨업' },
    { value: '실시간', label: '글로벌 랭킹' },
  ],
  sections: [
    {
      id: 'games',
      badge: '게임 소개',
      heading: '각 게임이 실력을 키우는 방법',
      layout: 'grid2',
      items: [
        { icon: '🎤', title: 'Echo', body: '원어민 음성을 듣고 따라 말합니다. AI가 발음·유창성·속도를 실시간 채점.', tag: 'Speaking · +50 XP' },
        { icon: '🎧', title: 'AudiQ', body: '강의·대화를 듣고 핵심 내용을 기억해 문제를 맞춥니다. 청해력 집중 훈련.', tag: 'Listening · +40 XP' },
        { icon: '⚡', title: 'Wordfire', body: '60초 안에 주어진 주제로 영어 작문. 속도와 정확성을 동시에 훈련합니다.', tag: 'Writing · +60 XP' },
        { icon: '📖', title: 'GlimpseQ', body: '지문을 짧게 읽고 가린 뒤 내용을 맞춥니다. 독해 속도와 기억력을 키웁니다.', tag: 'Reading · +40 XP' },
        { icon: '✍️', title: 'Quill Duel', body: '같은 내용을 다른 문체로 다시 씁니다. AI가 문체·어휘·구조를 평가합니다.', tag: 'Writing · +80 XP' },
        { icon: '📚', title: 'LitQuest', body: '공개 도메인 소설 속 챕터 퀴즈와 단어 사냥. 실제 문학으로 독해력 강화.', tag: 'Reading · +35 XP' },
      ],
    },
    {
      id: 'xp',
      badge: '성장 시스템',
      heading: '플레이할수록 실력과 레벨이 함께 오릅니다',
      body: 'XP를 모아 레벨업하고, 연속 출석 스트릭으로 꾸준함을 보상받습니다.',
      layout: 'grid2',
      alt: true,
      items: [
        { icon: '⭐', title: 'XP & 레벨업', body: '게임마다 XP를 획득하고 레벨업할 때마다 새 칭호와 아이템이 잠금 해제됩니다.' },
        { icon: '🔥', title: '연속 출석 스트릭', body: '매일 플레이하면 스트릭이 쌓이고, 주간 완주 시 보너스 XP가 지급됩니다.' },
        { icon: '🏆', title: '주간 랭킹', body: '매주 리셋되는 XP 랭킹. 상위 10%에 들면 특별 뱃지와 칭호를 획득합니다.' },
        { icon: '🎯', title: 'Daily Challenge', body: '매일 새로운 도전 과제가 업데이트됩니다. 클리어하면 보너스 XP 획득.' },
      ],
    },
  ],
  testimonials: {
    badge: '후기',
    heading: '플레이어들의 이야기',
    items: [
      { quote: 'Echo 쉐도윙 2주 했더니 TOEFL Speaking이 22점 올랐어요. 게임하듯이 했는데 점수가 오르니까 계속하게 됩니다.', name: '김지원', detail: '고3, TOEFL 준비', stat: 'Speaking +22점', initials: '김' },
      { quote: 'AudiQ로 매일 Listening 연습했더니 속도에 익숙해졌어요. 이제 영어 강의 듣는 게 전혀 힘들지 않습니다.', name: '이민준', detail: '재수생', stat: 'Listening 4→6점', initials: '이' },
    ],
  },
  pricing: {
    badge: '요금제',
    heading: '무료로 시작하고 실력이 붙으면 업그레이드',
    tiers: [
      { name: '무료', price: '₩0', per: '/ 월', desc: '기본 게임 체험', features: ['Echo · AudiQ · GlimpseQ 기본', 'Daily Challenge 1회', '랭킹 참여', 'XP · 레벨업 시스템'], cta: '무료로 시작', featured: false },
      { name: 'Arcade Pro', price: '₩12,000', per: '/ 월', desc: '전체 게임 무제한', features: ['6가지 게임 전부 무제한', 'Daily Challenge 무제한', 'AI 첨삭 피드백 (Wordfire · Quill Duel)', '랭킹 특별 뱃지 · 칭호', 'Voca Pro 포함'], cta: '지금 시작하기', featured: true },
    ],
  },
  cta: { heading: '지금 바로', headingEm: '플레이하세요', body: '가입 후 30초면 첫 게임을 시작할 수 있습니다', button: '무료로 시작하기 →', button2: '게임 미리보기' },
};

export const PAGE_DEFAULTS: Record<string, LandingPageConfig> = {
  toefl: TOEFL_DEFAULT,
  naesin: NAESIN_DEFAULT,
  jr: JR_DEFAULT,
  voca: VOCA_DEFAULT,
  arcade: ARCADE_DEFAULT,
};

export const PAGE_KEYS: Record<string, string> = {
  toefl: 'landing_toefl_v1',
  naesin: 'landing_naesin_v1',
  jr: 'landing_jr_v1',
  voca: 'landing_voca_v1',
  arcade: 'landing_arcade_v1',
};
