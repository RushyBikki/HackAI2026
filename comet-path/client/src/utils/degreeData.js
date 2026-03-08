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
// How many concentrations each major requires (Only for majors with formal tracks)
export const CONCENTRATION_RULES = {
  // ECS
  'Electrical Engineering': { required: 1, creditsEach: 9 },
  // BBS
  'Cognitive Science':      { required: 2, creditsEach: 12 },
  // NSM
  'Mathematics':            { required: 1, creditsEach: 12 },
  'Geosciences':           { required: 1, creditsEach: 15 },
  // JSOM
  'Business Administration':                        { required: 1, creditsEach: 12 },
  'Finance':                                        { required: 1, creditsEach: 9 },
  'Marketing':                                      { required: 1, creditsEach: 9 },
  'Computer Information Systems and Technology':    { required: 1, creditsEach: 9 },
  'Business Analytics and Artificial Intelligence': { required: 1, creditsEach: 12 },
  'Supply Chain Management and Analytics':          { required: 1, creditsEach: 12 },
  'Global Business':                                { required: 1, creditsEach: 12 },
  // AHT
  'Arts, Technology, and Emerging Communication':   { required: 1, creditsEach: 15 },
  'Visual and Performing Arts':                     { required: 1, creditsEach: 15 },
  // IS
  'Education':                                      { required: 1, creditsEach: 18 },
};

// Major core required course IDs for EVERY major
export const MAJOR_CORE = {
  // --- ECS ---
  'Computer Science': {
    totalCredits: 124,
    prep: ['ECS1100','CS1200','CS1436','CS1337','CS2305','CS2336','CS2340','MATH2413','MATH2414','MATH2418','PHYS2325','PHYS2125','PHYS2326','PHYS2126'],
    core: ['CS3305','CS3341','CS3345','CS3354','CS3377','CS4337','CS4341','CS4347','CS4348','CS4349','CS4384','CS4485','ECS3390'],
    electiveCredits: 15,
  },
  'Software Engineering': {
    totalCredits: 124,
    prep: ['ECS1100','CS1200','CS1436','CS1337','CS2305','CS2336','SE2340','MATH2413','MATH2414','MATH2418','PHYS2325','PHYS2125','PHYS2326','PHYS2126'],
    core: ['SE3306','SE3341','SE3345','SE3354','SE3377','SE4347','SE4348','SE4351','SE4352','SE4367','SE4381','SE4485','ECS3390'],
    electiveCredits: 12,
  },
  'Electrical Engineering': {
    totalCredits: 128,
    prep: ['MATH2413','MATH2414','MATH2415','MATH2420','PHYS2325','PHYS2125','PHYS2326','PHYS2126','CHEM1311','EE1202','CS1325','ECS1100','EE1100'],
    core: ['EE2310','EE2301','EE3300','EE3301','EE3302','EE3310','EE3311','EE3320','EE3350','EE4301','EE4310','EE4388','EE4389','ENGR2300','ENGR3341','ECS3390'],
    electiveCredits: 9,
  },
  'Mechanical Engineering': {
    totalCredits: 127,
    prep: ['MATH2413','MATH2414','MATH2415','MATH2420','PHYS2325','PHYS2125','PHYS2326','PHYS2126','CHEM1311','MECH1100','MECH1208','CS1325'],
    core: ['MECH2310','MECH2312','MECH2320','MECH2330','MECH3301','MECH3302','MECH3305','MECH3310','MECH3315','MECH3320','MECH3340','MECH3350','MECH4310','MECH4381','MECH4382'],
    electiveCredits: 12,
  },
  'Biomedical Engineering': {
    totalCredits: 128,
    prep: ['BMEN1100','BMEN1208','BIOL2311','CHEM1311','CS1325','MATH2413','MATH2414','MATH2415','MATH2420','PHYS2325','PHYS2326'],
    core: ['BMEN2320','BMEN3315','BMEN3318','BMEN3320','BMEN3331','BMEN3350','BMEN3360','BMEN3399','BMEN4310','BMEN4388','BMEN4389'],
    electiveCredits: 12,
  },

  // --- BBS ---
  'Cognitive Science': {
    totalCredits: 120,
    prep: ['CGS2301','PSY2301','MATH2413','CS1336','CS1337','STAT3355'],
    core: ['CGS3361','CGS4395','CGS3301','PSY3361','NSC3361','CGS4314'],
    electiveCredits: 24, 
  },
  'Neuroscience': {
    totalCredits: 120,
    prep: ['NSC3361','BIOL2311','BIOL2312','CHEM1311','CHEM1312','MATH2413','PHYS2325'],
    core: ['NSC4352','NSC4354','NSC4356','NSC4366','NSC4367','NSC4371'],
    electiveCredits: 15,
  },
  'Psychology': {
    totalCredits: 120,
    prep: ['PSY2301','PSY2317','MATH1314'],
    core: ['PSY3392','PSY3393','PSY3331','PSY3361','PSY4343'],
    electiveCredits: 18,
  },

  // --- NSM ---
  'Mathematics': {
    totalCredits: 120,
    prep: ['MATH2413','MATH2414','MATH2415','MATH2418','CS1337'],
    core: ['MATH3310','MATH3311','MATH3321','MATH4301','MATH4302','MATH4V91'],
    electiveCredits: 12,
  },
  'Biology': {
    totalCredits: 120,
    prep: ['BIOL2311','BIOL2111','BIOL2312','BIOL2112','CHEM1311','CHEM1111','CHEM1312','CHEM1112','MATH2413','PHYS2325'],
    core: ['BIOL3301','BIOL3302','BIOL3361','BIOL3161','BIOL3318','BIOL3335'],
    electiveCredits: 15,
  },

  // --- JSOM ---
  'Accounting': {
    totalCredits: 120,
    prep: ['MATH1325','ECON2301','ECON2302','ACCT2301','ACCT2302','BA1320','BA1100'],
    core: ['BCOM3310','BCOM4300','BLAW2301','FIN3320','ITSS3300','MKT3300','OPRE3310','OPRE3333','OPRE3360','BA4090','ACCT3331','ACCT3332','ACCT3341','ACCT3350','ACCT4334'],
    electiveCredits: 0,
  },
  'Business Administration': {
    totalCredits: 120,
    prep: ['MATH1325','ECON2301','ECON2302','ACCT2301','ACCT2302','BA1320','BA1100'],
    core: ['BCOM3310','BCOM4300','BLAW2301','FIN3320','ITSS3300','MKT3300','OPRE3310','OPRE3333','OPRE3360','BA4090','BA4371'],
    electiveCredits: 12,
  },
  'Finance': {
    totalCredits: 120,
    prep: ['MATH1325','ECON2301','ECON2302','ACCT2301','ACCT2302','BA1320','BA1100'],
    core: ['BCOM3310','BCOM4300','BLAW2301','FIN3320','ITSS3300','MKT3300','OPRE3310','OPRE3333','OPRE3360','BA4090','FIN3380','FIN3390','FIN4300'],
    electiveCredits: 9,
  },
  'Computer Information Systems and Technology': {
    totalCredits: 120,
    prep: ['MATH1325','ECON2301','ECON2302','ACCT2301','ACCT2302','BA1320','BA1100'],
    core: ['BCOM3310','BCOM4300','BLAW2301','FIN3320','ITSS3300','MKT3300','OPRE3310','OPRE3333','OPRE3360','BA4090','ITSS4300','ITSS4301','ITSS4381'],
    electiveCredits: 9,
  },

  // --- EPPS ---
  'Economics': {
    totalCredits: 120,
    prep: ['MATH1325','MATH1326','ECON2301','ECON2302','EPPS2301'],
    core: ['ECON3310','ECON3311','ECON4351','ECON4355','EPPS3301'],
    electiveCredits: 15,
  },

  // --- AHT ---
  'Arts, Technology, and Emerging Communication': {
    totalCredits: 120,
    prep: ['ATCM1100','ATCM2300','ATCM2301','ATCM2302'],
    core: ['ATCM3300','ATCM3301','ATCM4395'],
    electiveCredits: 15,
  },
};

// Course IDs for Formal Concentrations Only
export const CONCENTRATION_COURSES = {
  'Electrical Engineering': {
    'Circuits': ['EE4325', 'EE4340', 'EE3311'],
    'Computing Systems': ['EE4304', 'EE4341', 'CS4341'],
    'Devices': ['EE4330', 'EE4371', 'EE4391'],
    'Power Electronics and Energy Systems': ['EE4303', 'EE4362', 'EE4363'],
    'Signals and Systems': ['EE4360', 'EE4361', 'EE3350'],
  },
  'Cognitive Science': {
    'Psychology': ['PSY3392', 'PSY3393', 'PSY4331', 'PSY4334'],
    'Neuroscience': ['NSC4352', 'NSC4354', 'NSC4356', 'NSC4366'],
    'Human-Computer Interaction': ['CGS4303', 'PSY4331', 'CS4352', 'ATEC3351'],
    'Intelligent Systems': ['CS4365', 'CS4375', 'CS4314', 'CS4395'],
  },
  'Mathematics': {
    'Applied Mathematics Specialization': ['MATH4361', 'MATH4362', 'MATH4303', 'MATH3351'],
    'Pure Mathematics Specialization': ['MATH4341', 'MATH4350', 'MATH4381', 'MATH4382'],
    'Statistics Specialization': ['STAT4351', 'STAT4352', 'STAT4382', 'STAT4354'],
  },
  'Business Administration': {
    'Energy Management': ['ENGY3300', 'ENGY3330', 'ENGY3340', 'ENGY4300'],
    'Innovation and Entrepreneurship': ['ENTP3301', 'ENTP3360', 'ENTP4311', 'ENTP4320'],
    'Real Estate Finance': ['REAL3305', 'REAL4320', 'REAL4321', 'REAL4328'],
    'Risk Management and Insurance Technology': ['RMIS3305', 'RMIS4331', 'RMIS4332', 'RMIS4335'],
    'Professional Sales': ['MKT3330', 'MKT4331', 'MKT4332', 'MKT4333'],
    'Business Economics': ['ECON3310', 'ECON3311', 'ECON4310', 'ECON4320'],
  },
  'Finance': {
    'Corporate Finance': ['FIN4330', 'FIN4335', 'FIN4380'],
    'Investment': ['FIN4310', 'FIN4320', 'FIN4340'],
    'FinTech': ['FIN4370', 'ITSS4350', 'FIN4335'],
    'Real Estate Finance': ['REAL3305', 'REAL4320', 'REAL4321'],
    'Risk Management and Insurance Technology': ['RMIS3305', 'RMIS4331', 'RMIS4335'],
  },
  'Marketing': {
    'Marketing Management': ['MKT3320', 'MKT4330', 'MKT4331'],
    'Digital Marketing': ['MKT4330', 'MKT4332', 'MKT4334'],
    'Marketing Analytics': ['MKT4337', 'MKT4338', 'BUAN4320'],
    'Professional Sales': ['MKT3330', 'MKT4331', 'MKT4332'],
    'Retailing Innovation': ['MKT3320', 'MKT4336', 'MKT4330'],
  },
  'Computer Information Systems and Technology': {
    'Business Intelligence and Analytics': ['ITSS4340', 'ITSS4341', 'ITSS4343'],
    'Enterprise Systems': ['ITSS4340', 'ITSS4351', 'ITSS4352'],
    'Cybersecurity Management': ['ITSS4360', 'ITSS4361', 'ITSS4362'],
    'IT Sales Engineering': ['ITSS4320', 'ITSS4325', 'MKT3330'],
    'IT Innovation and Entrepreneurship': ['ENTP3301', 'ITSS4360', 'ITSS4365'],
  },
  'Arts, Technology, and Emerging Communication': {
    'Animation and Games': ['ATCM3307', 'ATCM3308', 'ATCM4307'],
    'Critical Media Studies': ['ATCM3320', 'ATCM3321', 'ATCM4320'],
    'Design': ['ATCM3330', 'ATCM3335', 'ATCM4330'],
    'Emerging Media Art': ['ATCM3340', 'ATCM3345', 'ATCM4340'],
  },
};