// apps/web/app/(protected)/reading/adaptive/adaptive-demo/demo-data.ts
import type { RReadingTest2026 } from "@/models/reading";

export const adaptiveReadingTest2026: RReadingTest2026 = {
  meta: {
    id: "reading-2026-stage1-demo",
    label: "2026 Reading Stage 1 – Demo Set",
    examEra: "ibt_2026",
    source: "internal-demo",
  },
  modules: [
    // ---------- Stage 1 ----------
    {
      id: "module-stage1-core",
      stage: 1,
      items: [
        // 1) Complete the Words (10 blanks)
        {
          id: "cw-001",
          taskKind: "complete_words",
          stage: 1,
          difficulty: "core",
          paragraphHtml: `
            <p>
              Many first-year students feel <strong>nerv__s</strong> when they start university.
              They must learn how to <strong>man__e</strong> their own time, attend classes,
              and <strong>pre__re</strong> for exams without constant help from their parents.
              Some students quickly <strong>a__pt</strong> to this new environment, but others
              find it <strong>challe__ing</strong>.
            </p>
            <p>
              Universities often provide <strong>counse__ing</strong> services and study
              skills workshops. These programs can help students devel__ skills to stay
              organ__ed, set real__tic goals, and build conf__ence in their ability to succeed.
            </p>
          `,
          blanks: [
            { id: "cw-001-01", order: 1, correctToken: "ou" }, // nervous
            { id: "cw-001-02", order: 2, correctToken: "ag" }, // manage
            { id: "cw-001-03", order: 3, correctToken: "pa" }, // prepare
            { id: "cw-001-04", order: 4, correctToken: "da" }, // adapt
            { id: "cw-001-05", order: 5, correctToken: "ng" }, // challenging
            { id: "cw-001-06", order: 6, correctToken: "el" }, // counseling
            { id: "cw-001-07", order: 7, correctToken: "op" }, // develop
            { id: "cw-001-08", order: 8, correctToken: "iz" }, // organized
            { id: "cw-001-09", order: 9, correctToken: "is" }, // realistic
            { id: "cw-001-10", order: 10, correctToken: "id" }, // confidence
          ],
        },

        // 2) Read in Daily Life (공지문 + 3문항)
        {
          id: "dl-001",
          taskKind: "daily_life",
          stage: 1,
          difficulty: "core",
          contextType: "notice",
          contentHtml: `
            <div>
              <h2 style="margin:0 0 6px;font-size:15px;">Campus Shuttle Service Update</h2>
              <p style="margin:0 0 4px;">
                Beginning <strong>next Monday</strong>, the campus shuttle will follow a new schedule.
                Buses will arrive at the main dormitory every <strong>15 minutes</strong> between
                7:00 a.m. and 10:00 a.m.
              </p>
              <p style="margin:0 0 4px;">
                After 10:00 a.m., buses will run every <strong>30 minutes</strong> until 6:00 p.m.
                On weekends, the shuttle will only operate from 9:00 a.m. to 3:00 p.m.
              </p>
              <p style="margin:0;">
                Please check the university app for the full timetable. Students who arrive
                late to the bus stop may need to wait for the next shuttle.
              </p>
            </div>
          `,
          questions: [
            {
              id: "dl-001-q1",
              number: 1,
              type: "detail",
              stem: "How often does the shuttle arrive at the main dormitory between 7:00 a.m. and 10:00 a.m.?",
              choices: [
                {
                  id: "dl-001-q1-a",
                  text: "Every 10 minutes",
                  isCorrect: false,
                },
                {
                  id: "dl-001-q1-b",
                  text: "Every 15 minutes",
                  isCorrect: true,
                },
                {
                  id: "dl-001-q1-c",
                  text: "Every 30 minutes",
                  isCorrect: false,
                },
                {
                  id: "dl-001-q1-d",
                  text: "Only once an hour",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "dl-001-q2",
              number: 2,
              type: "negative_detail",
              stem: "Which of the following is NOT true about the shuttle schedule?",
              choices: [
                {
                  id: "dl-001-q2-a",
                  text: "The shuttle runs every 30 minutes after 10:00 a.m. on weekdays.",
                  isCorrect: false,
                },
                {
                  id: "dl-001-q2-b",
                  text: "The shuttle does not run after 3:00 p.m. on weekends.",
                  isCorrect: false,
                },
                {
                  id: "dl-001-q2-c",
                  text: "The shuttle runs all night on weekdays.",
                  isCorrect: true,
                },
                {
                  id: "dl-001-q2-d",
                  text: "Students can see the timetable in the university app.",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "dl-001-q3",
              number: 3,
              type: "inference",
              stem: "What can be inferred about students who miss the shuttle?",
              choices: [
                {
                  id: "dl-001-q3-a",
                  text: "They must find another way to get to campus.",
                  isCorrect: false,
                },
                {
                  id: "dl-001-q3-b",
                  text: "They will need to wait until the next shuttle arrives.",
                  isCorrect: true,
                },
                {
                  id: "dl-001-q3-c",
                  text: "They are not allowed to use the shuttle again.",
                  isCorrect: false,
                },
                {
                  id: "dl-001-q3-d",
                  text: "They should call the driver to request a special pickup.",
                  isCorrect: false,
                },
              ],
            },
          ],
        },

        // 3) Read an Academic Passage (짧은 지문 + 5문항)
        {
          id: "ap-001",
          taskKind: "academic_passage",
          stage: 1,
          difficulty: "core",
          passageHtml: `
            <h2 style="margin:0 0 8px;font-size:16px;">Urban Community Gardens</h2>
            <p>
              In many large cities, residents have limited access to green spaces.
              To address this problem, some neighborhoods have created community gardens
              on empty lots. These gardens allow residents to grow vegetables and flowers,
              meet their neighbors, and spend time outdoors.
            </p>
            <p>
              Community gardens can also provide educational benefits.
              Schools sometimes bring students to the gardens to learn about plant biology,
              soil, and local ecosystems. In addition, the food produced in these gardens
              may be donated to local food banks, which helps support families in need.
            </p>
          `,
          questions: [
            {
              id: "ap-001-q1",
              number: 1,
              type: "summary",
              stem: "What is the main purpose of community gardens mentioned in the passage?",
              choices: [
                {
                  id: "ap-001-q1-a",
                  text: "To replace city parks with more buildings",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q1-b",
                  text: "To provide green spaces and community benefits in cities",
                  isCorrect: true,
                },
                {
                  id: "ap-001-q1-c",
                  text: "To teach farmers how to grow vegetables",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q1-d",
                  text: "To encourage people to move to rural areas",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "ap-001-q2",
              number: 2,
              type: "detail",
              stem: "According to the passage, how do community gardens help residents?",
              choices: [
                {
                  id: "ap-001-q2-a",
                  text: "They provide a place to grow plants and meet neighbors.",
                  isCorrect: true,
                },
                {
                  id: "ap-001-q2-b",
                  text: "They offer free apartments for families in need.",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q2-c",
                  text: "They reduce the need for public transportation.",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q2-d",
                  text: "They make it unnecessary to have city parks.",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "ap-001-q3",
              number: 3,
              type: "detail",
              stem: "Why do schools bring students to community gardens?",
              choices: [
                {
                  id: "ap-001-q3-a",
                  text: "To teach them about plants and ecosystems.",
                  isCorrect: true,
                },
                {
                  id: "ap-001-q3-b",
                  text: "To train them as professional farmers.",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q3-c",
                  text: "To give them a place to play sports.",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q3-d",
                  text: "To prepare them for university entrance exams.",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "ap-001-q4",
              number: 4,
              type: "inference",
              stem: "What can be inferred about families who receive food from these gardens?",
              choices: [
                {
                  id: "ap-001-q4-a",
                  text: "They may have difficulty buying enough food.",
                  isCorrect: true,
                },
                {
                  id: "ap-001-q4-b",
                  text: "They are required to work in the garden every day.",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q4-c",
                  text: "They are all employed by the city government.",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q4-d",
                  text: "They live in rural areas far from the city.",
                  isCorrect: false,
                },
              ],
            },
            {
              id: "ap-001-q5",
              number: 5,
              type: "purpose",
              stem: "Why does the author mention local food banks?",
              choices: [
                {
                  id: "ap-001-q5-a",
                  text: "To show that community gardens can support people in need.",
                  isCorrect: true,
                },
                {
                  id: "ap-001-q5-b",
                  text: "To explain why parks are closing in many cities.",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q5-c",
                  text: "To argue that city governments waste money.",
                  isCorrect: false,
                },
                {
                  id: "ap-001-q5-d",
                  text: "To describe how schools are funded.",
                  isCorrect: false,
                },
              ],
            },
          ],
        },
      ],
    },

    // ---------- Stage 2 (placeholder) ----------
    {
      id: "module-stage2-placeholder",
      stage: 2,
      items: [],
    },
  ],
};
