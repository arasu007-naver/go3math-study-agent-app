/**
 * 수학 시험 및 교과 과정 관련 상수
 */

// === 과목 타입 ===
type SubjectOption = { label: string; value: string };
type YearOption = { label: string; value: number };
type MonthOption = { label: string; value: number };
type NumberOption = { label: string; value: number };
type Chapter = { title: string; id: number };
type MathSubject = { label: string; value: string; id: number; chapters: Chapter[] };
type ChapterTree = {
    subjectId: string;
    subjectTitle: string;
    course: string;
    chapters: { chapterId: number; chapterTitle: string }[];
};

// === 이전 교육과정 시험 ===
const peviousEducationPolicyExams = {
    inclinations: [] as SubjectOption[],
    years: [] as YearOption[],
    months: [
        { label: '수능', value: 11 },
        { label: '3월', value: 3 },
        { label: '4월', value: 4 },
        { label: '6월', value: 6 },
        { label: '7월', value: 7 },
        { label: '9월', value: 9 },
        { label: '10월', value: 10 },
    ] as MonthOption[],
    numbers: Array.from({ length: 30 }, (_, i) => ({
        label: `${30 - i}번`,
        value: 30 - i,
    })) as NumberOption[],
};

// === 모의고사 필터 데이터 ===
const PRE_EXAMS = [
    [
        {
            title: '과목/계열',
            data: [
                { label: '미적분', value: 'CALCULUS' },
                { label: '기하와 벡터', value: 'GEOMETRY' },
                { label: '확률과 통계', value: 'STATISTICS' },
                { label: '문과', value: 'A' },
                { label: '이과', value: 'B' },
            ],
        },
    ],
    [
        {
            title: '시행년도',
            data: [
                { label: '2020 년', value: 2020 },
                { label: '2019 년', value: 2019 },
                { label: '2018 년', value: 2018 },
                { label: '2017 년', value: 2017 },
                { label: '2016 년', value: 2016 },
                { label: '2015 년', value: 2015 },
                { label: '2014 년', value: 2014 },
                { label: '2013 년', value: 2013 },
                { label: '2012 년', value: 2012 },
            ],
        },
    ],
    [
        {
            title: '시행년도',
            data: [
                { label: '2025 년', value: 2025 },
                { label: '2024 년', value: 2024 },
                { label: '2023 년', value: 2023 },
                { label: '2022 년', value: 2022 },
                { label: '2021 년', value: 2021 },
            ],
        },
    ],
    [
        {
            title: '시행월',
            data: [
                { label: '수능', value: 11 },
                { label: '10월', value: 10 },
                { label: '9월', value: 9 },
                { label: '7월', value: 7 },
                { label: '6월', value: 6 },
                { label: '4월', value: 4 },
                { label: '3월', value: 3 },
            ],
        },
    ],
    [
        {
            title: '번호',
            data: Array.from({ length: 30 }, (_, i) => ({
                label: `${30 - i}번`,
                value: 30 - i,
            })),
        },
    ],
];

const PRE_EXAMS_ASSETS = {
    subjects: [
        { label: '미적분', value: 'CALCULUS' },
        { label: '기하와 벡터', value: 'GEOMETRY' },
        { label: '확률과 통계', value: 'STATISTICS' },
        { label: '문과', value: 'A' },
        { label: '이과', value: 'B' },
    ] as SubjectOption[],
    preStepAgendaYears: [
        { label: '2020 년', value: 2020 },
        { label: '2019 년', value: 2019 },
        { label: '2018 년', value: 2018 },
        { label: '2017 년', value: 2017 },
        { label: '2016 년', value: 2016 },
        { label: '2015 년', value: 2015 },
        { label: '2014 년', value: 2014 },
        { label: '2013 년', value: 2013 },
        { label: '2012 년', value: 2012 },
    ] as YearOption[],
    currentStepAgendaYears: [
        { label: '2025 년', value: 2025 },
        { label: '2024 년', value: 2024 },
        { label: '2023 년', value: 2023 },
        { label: '2022 년', value: 2022 },
        { label: '2021 년', value: 2021 },
    ] as YearOption[],
    years: [
        { label: '2025 년', value: 2025 },
        { label: '2024 년', value: 2024 },
        { label: '2023 년', value: 2023 },
        { label: '2022 년', value: 2022 },
        { label: '2021 년', value: 2021 },
        { label: '2020 년', value: 2020 },
        { label: '2019 년', value: 2019 },
        { label: '2018 년', value: 2018 },
        { label: '2017 년', value: 2017 },
        { label: '2016 년', value: 2016 },
        { label: '2015 년', value: 2015 },
        { label: '2014 년', value: 2014 },
        { label: '2013 년', value: 2013 },
        { label: '2012 년', value: 2012 },
    ] as YearOption[],
    months: [
        { label: '수능', value: 11 },
        { label: '10월', value: 10 },
        { label: '9월', value: 9 },
        { label: '7월', value: 7 },
        { label: '6월', value: 6 },
        { label: '4월', value: 4 },
        { label: '3월', value: 3 },
    ] as MonthOption[],
    numbers: Array.from({ length: 30 }, (_, i) => ({
        label: `${30 - i}번`,
        value: 30 - i,
    })) as NumberOption[],
};

const currentSubjects: SubjectOption[] = [
    { label: '미적분', value: 'CALCULUS' },
    { label: '기하와 벡터', value: 'GEOMETRY' },
    { label: '확률과 통계', value: 'STATISTICS' },
];

const thisMonths: MonthOption[] = [
    { label: '3월', value: 3 },
    { label: '5월', value: 4 },
    { label: '6월', value: 6 },
    { label: '7월', value: 7 },
    { label: '9월', value: 9 },
    { label: '10월', value: 10 },
];

// === 수학 과목 및 챕터 ===
const MATH_AGENDA = [
    {
        label: '기초 수학',
        value: 'BASIC_MATH',
        id: 11,
        chapters: [
            { title: '도형 기본', id: 31 },
            { title: '정수 기본', id: 32 },
            { title: '문자와 식 기본', id: 33 },
            { title: '경우의 수 기본', id: 34 },
        ]
    },
    {
        label: '고등 수학(상)',
        value: 'HIGHSCHOOL_MATH_BASE_A',
        id: 1,
        chapters: [
            { title: '고등 다항식', id: 1 },
            { title: '방정식과 부등식', id: 2 },
            { title: '도형의 방정식', id: 3 },
            { title: '집합과 명제', id: 4 },
            { title: '함수와 그래프', id: 5 },
            { title: '경우의 수', id: 6 },
            { title: '순열과 조합', id: 13 }
        ]
    },
    {
        label: '고등 수학(하)',
        value: 'HIGHSCHOOL_MATH_BASE_B',
        id: 10,
        chapters: [
            { title: '집합과 명제', id: 4 },
            { title: '함수와 그래프', id: 5 },
            { title: '경우의 수', id: 6 },
            { title: '순열과 조합', id: 13 }
        ]
    },
    {
        label: '수학 1',
        value: 'HIGHSCHOOL_MATH1',
        id: 2,
        chapters: [
            { title: '지수함수와 로그함수', id: 7 },
            { title: '삼각함수', id: 8 },
            { title: '수열', id: 9 }
        ]
    },
    {
        label: '수학 2',
        value: 'HIGHSCHOOL_MATH2',
        id: 3,
        chapters: [
            { title: '함수의 극한과 연속', id: 10 },
            { title: '다항함수의 미분법', id: 11 },
            { title: '다항함수의 적분법', id: 12 }
        ]
    },
    {
        label: '과목 공통',
        value: 'COMMON_MATH',
        id: 12,
        chapters: []
    },
    {
        label: '확률과 통계',
        value: 'STATISTICS',
        id: 6,
        chapters: [
            { title: '순열과 조합(II)', id: 21 },
            { title: '확률', id: 14 },
            { title: '통계', id: 15 }
        ]
    },
    {
        label: '미적분',
        value: 'CALCULUS',
        id: 4,
        chapters: [
            { title: '수열의 극한', id: 27 },
            { title: '미분법', id: 22 },
            { title: '적분법', id: 23 }
        ]
    },
    {
        label: '기하',
        value: 'GEOMETRY',
        id: 5,
        chapters: [
            { title: '이차곡선', id: 16 },
            { title: '벡터', id: 17 },
            { title: '공간도형', id: 18 }
        ]
    }
]

const MATH_SUBJECTS: MathSubject[] = [
    {
        label: '고등 수학(상)', value: 'HIGHSCHOOL_MATH_BASE_A', id: 1,
        chapters: [
            { title: '고등 다항식', id: 1 }, { title: '방정식과 부등식', id: 2 },
            { title: '도형의 방정식', id: 3 }, { title: '집합과 명제', id: 4 },
            { title: '함수와 그래프', id: 5 }, { title: '경우의 수', id: 6 },
            { title: '순열과 조합', id: 13 },
        ],
    },
    {
        label: '고등 수학(하)', value: 'HIGHSCHOOL_MATH_BASE_B', id: 10,
        chapters: [
            { title: '집합과 명제', id: 4 }, { title: '함수와 그래프', id: 5 },
            { title: '경우의 수', id: 6 }, { title: '순열과 조합', id: 13 },
        ],
    },
    {
        label: '수학 1', value: 'HIGHSCHOOL_MATH1', id: 2,
        chapters: [
            { title: '지수함수와 로그함수', id: 7 }, { title: '삼각함수', id: 8 },
            { title: '수열', id: 9 },
        ],
    },
    {
        label: '수학 2', value: 'HIGHSCHOOL_MATH2', id: 3,
        chapters: [
            { title: '함수의 극한과 연속', id: 10 }, { title: '다항함수의 미분법', id: 11 },
            { title: '다항함수의 적분법', id: 12 },
        ],
    },
    {
        label: '미적분', value: 'CALCULUS', id: 4,
        chapters: [
            { title: '수열의 극한', id: 27 }, { title: '미분법', id: 22 },
            { title: '적분법', id: 23 },
        ],
    },
    {
        label: '기하', value: 'GEOMETRY', id: 5,
        chapters: [
            { title: '이차곡선', id: 16 }, { title: '벡터', id: 17 },
            { title: '공간도형', id: 18 },
        ],
    },
    {
        label: '확률과 통계', value: 'STATISTICS', id: 6,
        chapters: [
            { title: '순열과 조합(II)', id: 21 }, { title: '확률', id: 14 },
            { title: '통계', id: 15 },
        ],
    },
];

const MATH_TOPIC_SUBJECTS: MathSubject[] = [
    {
        label: '수능 공통', value: 'COMMON_MATH', id: 12,
        chapters: [],
    },
    {
        label: '미적분', value: 'CALCULUS', id: 4,
        chapters: [
            { title: '수열의 극한', id: 27 }, { title: '미분법', id: 22 },
            { title: '적분법', id: 23 },
        ],
    },
    {
        label: '확률과 통계', value: 'STATISTICS', id: 6,
        chapters: [
            { title: '순열과 조합(II)', id: 21 }, { title: '확률', id: 14 },
            { title: '통계', id: 15 },
        ],
    },
    {
        label: '기하', value: 'GEOMETRY', id: 5,
        chapters: [
            { title: '이차곡선', id: 16 }, { title: '벡터', id: 17 },
            { title: '공간도형', id: 18 },
        ],
    },
];

const MATH_CHAPTER_TREE: ChapterTree[] = [
    {
        subjectId: '1', subjectTitle: '고등 수학(상)', course: 'HIGHSCHOOL_MATH_BASE_A',
        chapters: [{ chapterId: 1, chapterTitle: '고등 다항식' }, { chapterId: 2, chapterTitle: '방정식과 부등식' }, { chapterId: 3, chapterTitle: '도형의 방정식' }],
    },
    {
        subjectId: '10', subjectTitle: '고등 수학(하)', course: 'HIGHSCHOOL_MATH_BASE_A',
        chapters: [{ chapterId: 4, chapterTitle: '집합과 명제' }, { chapterId: 5, chapterTitle: '함수와 그래프' }, { chapterId: 6, chapterTitle: '경우의 수' }, { chapterId: 13, chapterTitle: '순열과 조합' }],
    },
    {
        subjectId: '2', subjectTitle: '수학 1', course: 'HIGHSCHOOL_MATH1',
        chapters: [{ chapterId: 7, chapterTitle: '지수함수와 로그함수' }, { chapterId: 8, chapterTitle: '삼각함수' }, { chapterId: 9, chapterTitle: '수열' }],
    },
    {
        subjectId: '3', subjectTitle: '수학 2', course: 'HIGHSCHOOL_MATH2',
        chapters: [{ chapterId: 10, chapterTitle: '함수의 극한과 연속' }, { chapterId: 11, chapterTitle: '다항함수의 미분법' }, { chapterId: 12, chapterTitle: '다항함수의 적분법' }],
    },
    {
        subjectId: '4', subjectTitle: '미적분', course: 'CALCULUS',
        chapters: [{ chapterId: 22, chapterTitle: '미분법' }, { chapterId: 23, chapterTitle: '적분법' }, { chapterId: 27, chapterTitle: '수열의 극한' }],
    },
    {
        subjectId: '5', subjectTitle: '기하', course: 'GEOMETRY',
        chapters: [{ chapterId: 16, chapterTitle: '이차곡선' }, { chapterId: 17, chapterTitle: '벡터' }, { chapterId: 18, chapterTitle: '공간도형' }],
    },
    {
        subjectId: '6', subjectTitle: '확률과 통계', course: 'STATISTICS',
        chapters: [{ chapterId: 14, chapterTitle: '확률' }, { chapterId: 15, chapterTitle: '통계' }, { chapterId: 21, chapterTitle: '순열과 조합(II)' }],
    },
    {
        subjectId: '11', subjectTitle: '중등수학', course: 'MIDDLESCHOOL_MATH',
        chapters: [{ chapterId: 31, chapterTitle: '중학 도형' }, { chapterId: 32, chapterTitle: '정수론' }],
    },
    {
        subjectId: '12', subjectTitle: '수리 논술', course: 'MATH_ESSAY_EXAM',
        chapters: [{ chapterId: 33, chapterTitle: '수리 논리' }],
    },
];

export {
    peviousEducationPolicyExams,
    PRE_EXAMS,
    PRE_EXAMS_ASSETS,
    currentSubjects,
    thisMonths,
    MATH_AGENDA,
    MATH_SUBJECTS,
    MATH_TOPIC_SUBJECTS,
    MATH_CHAPTER_TREE,
};

export type {
    SubjectOption,
    YearOption,
    MonthOption,
    NumberOption,
    Chapter,
    MathSubject,
    ChapterTree,
};
