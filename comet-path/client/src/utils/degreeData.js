// UTD 2025-2026 degree requirements data

export const TEXAS_CORE_CATEGORIES = [
  { id: 'communication', label: 'Communication', credits: 6, patterns: ['RHET', 'ECS2390', 'BCOM'] },
  { id: 'math', label: 'Mathematics', credits: 3, patterns: ['MATH24', 'MATH241'] },
  { id: 'science', label: 'Life & Physical Sciences', credits: 6, patterns: ['PHYS', 'CHEM', 'BIOL', 'NSC'] },
  { id: 'culture', label: 'Language, Phil & Culture', credits: 3, patterns: ['PHIL', 'LIT', 'HUMA', 'HIST1'] },
  { id: 'arts', label: 'Creative Arts', credits: 3, patterns: ['AH', 'ATCM', 'MUSI', 'ARTS', 'ANGM'] },
  { id: 'history', label: 'American History', credits: 6, patterns: ['HIST1301', 'HIST1302'] },
  { id: 'govt', label: 'Government', credits: 6, patterns: ['GOVT'] },
  { id: 'social', label: 'Social & Behavioral Sci', credits: 3, patterns: ['PSY2301', 'SOCI', 'EPPS'] },
  { id: 'component', label: 'Component Area', credits: 6, patterns: ['MATH', 'PHYS', 'CS'] },
];

export const TEXAS_CORE_CREDITS = 42;

// How many concentrations each major requires
export const CONCENTRATION_RULES = {
  'Cognitive Science':     { required: 2, creditsEach: 12 },
  'Neuroscience':          { required: 1, creditsEach: 12 },
  'Electrical Engineering':{ required: 1, creditsEach: 12 },
  'Computer Science':      { required: 0, creditsEach: 12 },  // informal tracks only
  'Software Engineering':  { required: 0, creditsEach: 12 },
  'Computer Engineering':  { required: 0, creditsEach: 12 },
  'Computer Information Systems and Technology': { required: 1, creditsEach: 9 },
  'Mathematics':           { required: 1, creditsEach: 12 },
  'Finance':               { required: 1, creditsEach: 9 },
};

// Major core required course IDs (from UTD 2025-2026 catalog)
export const MAJOR_CORE = {
  'Computer Science': {
    totalCredits: 124,
    prep: ['ECS1100','CS1200','CS1436','CS1337','CS2305','CS2336','CS2340','MATH2418','PHYS2125','PHYS2126','PHYS2325','PHYS2326','MATH2413','MATH2414'],
    core: ['CS3162','CS3341','CS3345','CS3354','CS3377','ECS2390','CS4141','CS4337','CS4341','CS4347','CS4348','CS4349','CS4384','CS4485'],
    electiveCredits: 12,
  },
  'Software Engineering': {
    totalCredits: 124,
    prep: ['ECS1100','CS1200','CS1436','CS1337','CS2305','CS2336','MATH2418','PHYS2126','SE2340','MATH2413','MATH2414','PHYS2325','PHYS2326'],
    core: ['SE3162','SE3306','SE3341','SE3345','SE3354','SE3377','SE4347','SE4348','SE4351','SE4352','SE4367','SE4381','SE4485'],
    electiveCredits: 12,
  },
  'Electrical Engineering': {
    totalCredits: 128,
    prep: ['CHEM1111','CHEM1311','CS1325','EE1100','ECS1100','EE1202','ENGR2300','EE2310','PHYS2125','PHYS2126','PHYS2325','PHYS2326','MATH2414','MATH2415','MATH2420'],
    core: ['EE3161','ECS2390','EE3201','EE3202','EE3300','EE2301','EE3302','EE3310','EE3311','EE3320','ENGR3341','EE4301','EE4310','EE4370','EE4388','EE4389'],
    electiveCredits: 12,
  },
  'Cognitive Science': {
    totalCredits: 120,
    prep: ['CGS2301','CS1337','CS1436','MATH2312','PSY2301','STAT3355'],
    core: ['CGS3300','CGS3301','CGS3303','CGS4303','CGS4395','CGS4396'],
    electiveCredits: 24, // 2 concentrations × 12 hrs each
  },
  'Neuroscience': {
    totalCredits: 120,
    prep: ['BBSU1100','BIOL2311','BIOL2312','CHEM1311','CHEM1312','MATH2413','NSC3361','PHYS2325','PHYS2326'],
    core: ['NSC3361','NSC3362','NSC4351','NSC4352','NSC4353','NSC4V98'],
    electiveCredits: 12,
  },
  'Mathematics': {
    totalCredits: 120,
    prep: ['MATH2413','MATH2414','MATH2418','MATH3310','CS1325'],
    core: ['MATH3351','MATH4301','MATH4302','MATH4V90'],
    electiveCredits: 12,
  },
  'Data Science': {
    totalCredits: 120,
    prep: ['CS1436','CS1337','CS2336','CS2305','MATH2417','MATH2418','MATH2419'],
    core: ['CS3345','CS4347','CS4371','CS4372','CS4375','MATH3310','MATH3351','MATH4301','STAT3355','STAT4351','STAT4352','STAT4354','STAT4355','STAT4360'],
    electiveCredits: 0,
  },
};

// Concentration-specific course IDs per major track
export const CONCENTRATION_COURSES = {
  'Computer Science': {
    'Artificial Intelligence & Machine Learning': ['CS4365','CS4375','CS4376','CS4395'],
    'Cybersecurity & Networks': ['CS4361','CS4390','CS4396','CS4371'],
    'Data Science': ['CS4375','CS4395','CS4347','CS4334'],
    'Human-Computer Interaction': ['CS4359','CS4361','CS4392'],
    'Software Engineering': ['CS4354','SE4351','SE4352'],
    'Systems & Architecture': ['CS4348','CS4352','CS4339','CS4341'],
  },
  'Software Engineering': {
    'Enterprise Systems': ['SE4351','SE4352','SE4367'],
    'Embedded & Real-Time Systems': ['SE4351','CS4339','EE4325'],
    'Security Engineering': ['CS4361','CS4390','SE4399'],
  },
  'Electrical Engineering': {
    'Circuits': ['EE4168','EE4325','EE4340','EE4368'],
    'Computing Systems': ['EE4304','CS4337','CS4341'],
    'Devices': ['EE4330','EE4391','EE4371'],
    'Power Electronics & Energy Systems': ['EE4303','EE4362','EE4363'],
    'Signals & Systems': ['EE3350','EE4331','EE4342','EE4360','EE4361'],
  },
  'Cognitive Science': {
    'Psychology Track': ['PSY3352','PSY3361','PSY4330','PSY4337'],
    'Neuroscience Track': ['NSC3361','NSC4351','NSC4352','NSC4353'],
    'Human-Computer Interaction Track': ['CGS4303','CGS4395','SE4351','ATCM4V75'],
    'Intelligent Systems Track': ['CGS3303','CS2305','CS3345','CS4365','CS4375'],
  },
  'Neuroscience': {
    'Medical Neuroscience Track': ['NSC4361','NSC4362','NSC4363','NSC4364'],
    'Research Neuroscience Track': ['NSC4V98','NSC4351','NSC4352','NSC4353'],
    'Industrial Neuroscience Track': ['ENTP3300','ENTP4340','HMGT3300','MKT3300'],
  },
  'Computer Information Systems and Technology': {
    'Business Intelligence & Analytics': ['ITSS4340','ITSS4341','BUAN4310'],
    'Enterprise Systems': ['ITSS4350','ITSS4351','ITSS4352'],
    'IT Sales Engineering': ['ITSS4320','MKT3300','ITSS4325'],
    'IT Innovation & Entrepreneurship': ['ENTP3300','ITSS4360','ITSS4365'],
    'Cybersecurity Management': ['ITSS4380','ITSS4381','ITSS4382'],
    'Information Technology & Systems': ['ITSS4370','ITSS4371','ITSS4372'],
  },
  'Mathematics': {
    'Pure Mathematics': ['MATH4341','MATH4342','MATH4350'],
    'Statistics': ['STAT4351','STAT4352','STAT4354'],
    'Applied Mathematics': ['MATH4301','MATH4302','MATH4303'],
  },
};
