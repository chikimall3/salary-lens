/**
 * SalaryLens — SOC Code Lookup Table & Fuzzy Matching
 *
 * Provides a comprehensive mapping of job title keywords to BLS Standard
 * Occupational Classification (SOC) codes, plus fuzzy-matching helpers.
 *
 * This file is self-contained (no imports) and uses ES module exports.
 * It is compatible with both ES module contexts and classic-script contexts
 * that use a build step to bundle exports.
 *
 * @module soc-codes
 */

// ---------------------------------------------------------------------------
// SOC Entry table
// ---------------------------------------------------------------------------

/**
 * Each entry maps a set of lowercase keyword strings to a single SOC code.
 * Keywords are tried in order: exact match → partial (keyword-in-title) →
 * reverse partial (title-in-keyword).
 *
 * SOC codes are 6-digit strings (no hyphen) as used in BLS OEWS series IDs.
 *
 * @typedef {{ keywords: string[], socCode: string, occupation: string }} SocEntry
 * @type {SocEntry[]}
 */
export const SOC_ENTRIES = [

  // =========================================================================
  // Software & Technology
  // =========================================================================

  {
    keywords: ['software engineer', 'software developer', 'swe', 'software eng'],
    socCode: '151252',
    occupation: 'Software Developers',
  },
  {
    keywords: ['frontend engineer', 'frontend developer', 'front end engineer', 'front end developer', 'front-end engineer', 'front-end developer'],
    socCode: '151254',
    occupation: 'Web Developers',
  },
  {
    keywords: ['backend engineer', 'backend developer', 'back end engineer', 'back end developer', 'back-end engineer', 'back-end developer'],
    socCode: '151252',
    occupation: 'Software Developers',
  },
  {
    keywords: ['full stack engineer', 'full stack developer', 'fullstack engineer', 'fullstack developer', 'full-stack engineer', 'full-stack developer'],
    socCode: '151252',
    occupation: 'Software Developers',
  },
  {
    keywords: ['mobile engineer', 'mobile developer', 'ios engineer', 'ios developer', 'android engineer', 'android developer'],
    socCode: '151252',
    occupation: 'Software Developers',
  },
  {
    keywords: ['web developer', 'web designer', 'web engineer'],
    socCode: '151254',
    occupation: 'Web Developers',
  },
  {
    keywords: ['data scientist', 'data science engineer'],
    socCode: '152051',
    occupation: 'Data Scientists',
  },
  {
    keywords: ['data analyst', 'business intelligence analyst', 'bi analyst', 'analytics analyst'],
    socCode: '152041',
    occupation: 'Data Analysts',
  },
  {
    keywords: ['data engineer', 'etl developer', 'etl engineer', 'pipeline engineer', 'data platform engineer'],
    socCode: '151242',
    occupation: 'Database Administrators and Architects',
  },
  {
    keywords: ['database administrator', 'dba', 'database admin'],
    socCode: '151242',
    occupation: 'Database Administrators and Architects',
  },
  {
    keywords: ['machine learning engineer', 'ml engineer', 'ai engineer', 'deep learning engineer'],
    socCode: '151252',
    occupation: 'Software Developers',
  },
  {
    keywords: ['devops engineer', 'site reliability engineer', 'sre', 'platform engineer', 'infrastructure engineer'],
    socCode: '151244',
    occupation: 'Network and Computer Systems Administrators',
  },
  {
    keywords: ['cloud engineer', 'cloud architect', 'solutions architect', 'aws engineer', 'azure engineer', 'gcp engineer'],
    socCode: '151244',
    occupation: 'Network and Computer Systems Administrators',
  },
  {
    keywords: ['systems administrator', 'system administrator', 'sysadmin', 'linux administrator', 'windows administrator'],
    socCode: '151244',
    occupation: 'Network and Computer Systems Administrators',
  },
  {
    keywords: ['network engineer', 'network administrator', 'network architect', 'network technician'],
    socCode: '151244',
    occupation: 'Network and Computer Systems Administrators',
  },
  {
    keywords: ['security engineer', 'cybersecurity engineer', 'information security engineer', 'infosec engineer', 'application security engineer', 'security analyst'],
    socCode: '151212',
    occupation: 'Information Security Analysts',
  },
  {
    keywords: ['information security analyst', 'cybersecurity analyst', 'soc analyst'],
    socCode: '151212',
    occupation: 'Information Security Analysts',
  },
  {
    keywords: ['it manager', 'information technology manager', 'technology manager'],
    socCode: '113021',
    occupation: 'Computer and Information Systems Managers',
  },
  {
    keywords: ['chief technology officer', 'cto', 'vp of engineering', 'vp engineering'],
    socCode: '113021',
    occupation: 'Computer and Information Systems Managers',
  },
  {
    keywords: ['product manager', 'pm', 'technical product manager', 'associate product manager', 'apm'],
    socCode: '113021',
    occupation: 'Computer and Information Systems Managers',
  },
  {
    keywords: ['ux designer', 'user experience designer', 'ux researcher', 'user researcher', 'product designer'],
    socCode: '271024',
    occupation: 'Graphic Designers',
  },
  {
    keywords: ['ui designer', 'user interface designer', 'visual designer', 'interaction designer'],
    socCode: '271024',
    occupation: 'Graphic Designers',
  },
  {
    keywords: ['qa engineer', 'quality assurance engineer', 'test engineer', 'software test engineer', 'sdet', 'automation engineer'],
    socCode: '151253',
    occupation: 'Software Quality Assurance Analysts and Testers',
  },
  {
    keywords: ['scrum master', 'agile coach', 'release manager'],
    socCode: '151299',
    occupation: 'Computer Occupations, All Other',
  },
  {
    keywords: ['technical writer', 'technical documentation specialist', 'api documentation'],
    socCode: '273042',
    occupation: 'Technical Writers',
  },
  {
    keywords: ['it support specialist', 'help desk technician', 'help desk analyst', 'technical support specialist', 'desktop support technician', 'it technician'],
    socCode: '151232',
    occupation: 'Computer User Support Specialists',
  },
  {
    keywords: ['computer systems analyst', 'systems analyst', 'it analyst'],
    socCode: '151211',
    occupation: 'Computer Systems Analysts',
  },
  {
    keywords: ['it specialist', 'information technology specialist'],
    socCode: '151299',
    occupation: 'Computer Occupations, All Other',
  },
  {
    keywords: ['embedded systems engineer', 'firmware engineer', 'embedded software engineer'],
    socCode: '151252',
    occupation: 'Software Developers',
  },
  {
    keywords: ['game developer', 'game engineer', 'game programmer', 'unity developer', 'unreal developer'],
    socCode: '151252',
    occupation: 'Software Developers',
  },
  {
    keywords: ['blockchain developer', 'smart contract developer', 'web3 developer'],
    socCode: '151252',
    occupation: 'Software Developers',
  },

  // =========================================================================
  // Finance & Accounting
  // =========================================================================

  {
    keywords: ['accountant', 'staff accountant', 'general accountant'],
    socCode: '132011',
    occupation: 'Accountants and Auditors',
  },
  {
    keywords: ['senior accountant', 'accounting manager', 'controller', 'comptroller'],
    socCode: '132011',
    occupation: 'Accountants and Auditors',
  },
  {
    keywords: ['auditor', 'internal auditor', 'external auditor', 'it auditor'],
    socCode: '132011',
    occupation: 'Accountants and Auditors',
  },
  {
    keywords: ['cpa', 'certified public accountant'],
    socCode: '132011',
    occupation: 'Accountants and Auditors',
  },
  {
    keywords: ['financial analyst', 'finance analyst', 'fp&a analyst', 'financial planning analyst'],
    socCode: '132051',
    occupation: 'Financial and Investment Analysts',
  },
  {
    keywords: ['investment analyst', 'equity research analyst', 'portfolio analyst', 'securities analyst'],
    socCode: '132051',
    occupation: 'Financial and Investment Analysts',
  },
  {
    keywords: ['financial advisor', 'financial planner', 'wealth manager', 'investment advisor', 'financial consultant'],
    socCode: '132052',
    occupation: 'Personal Financial Advisors',
  },
  {
    keywords: ['chief financial officer', 'cfo', 'vp of finance', 'vp finance'],
    socCode: '111011',
    occupation: 'Chief Executives',
  },
  {
    keywords: ['investment banker', 'investment banking analyst', 'ib analyst'],
    socCode: '132051',
    occupation: 'Financial and Investment Analysts',
  },
  {
    keywords: ['actuary', 'actuarial analyst'],
    socCode: '152011',
    occupation: 'Actuaries',
  },
  {
    keywords: ['bookkeeper', 'accounting clerk', 'accounts payable', 'accounts receivable', 'ap specialist', 'ar specialist'],
    socCode: '431011',
    occupation: 'Bookkeeping, Accounting, and Auditing Clerks',
  },
  {
    keywords: ['tax accountant', 'tax analyst', 'tax specialist', 'tax manager', 'tax preparer'],
    socCode: '132082',
    occupation: 'Tax Examiners and Collectors, and Revenue Agents',
  },
  {
    keywords: ['credit analyst', 'credit risk analyst', 'underwriter', 'loan underwriter'],
    socCode: '132072',
    occupation: 'Loan Officers',
  },
  {
    keywords: ['loan officer', 'mortgage loan officer', 'commercial loan officer'],
    socCode: '132072',
    occupation: 'Loan Officers',
  },
  {
    keywords: ['budget analyst', 'budget manager'],
    socCode: '132031',
    occupation: 'Budget Analysts',
  },

  // =========================================================================
  // Healthcare — Nursing
  // =========================================================================

  {
    keywords: ['registered nurse', 'rn', 'staff nurse'],
    socCode: '291141',
    occupation: 'Registered Nurses',
  },
  {
    keywords: ['nurse', 'nursing'],
    socCode: '291141',
    occupation: 'Registered Nurses',
  },
  {
    keywords: ['nurse practitioner', 'np', 'advanced practice nurse', 'apn', 'aprn'],
    socCode: '291171',
    occupation: 'Nurse Practitioners',
  },
  {
    keywords: ['nurse anesthetist', 'crna', 'certified registered nurse anesthetist'],
    socCode: '291151',
    occupation: 'Nurse Anesthetists',
  },
  {
    keywords: ['nurse midwife', 'certified nurse midwife', 'cnm'],
    socCode: '291161',
    occupation: 'Nurse Midwives',
  },
  {
    keywords: ['licensed practical nurse', 'lpn', 'licensed vocational nurse', 'lvn'],
    socCode: '292061',
    occupation: 'Licensed Practical and Licensed Vocational Nurses',
  },
  {
    keywords: ['certified nursing assistant', 'cna', 'nursing aide', 'home health aide', 'patient care technician'],
    socCode: '311131',
    occupation: 'Nursing Assistants',
  },

  // =========================================================================
  // Healthcare — Physicians & Advanced Practice
  // =========================================================================

  {
    keywords: ['physician', 'medical doctor', 'md', 'doctor'],
    socCode: '291215',
    occupation: 'Family Medicine Physicians',
  },
  {
    keywords: ['family medicine physician', 'family practice physician', 'primary care physician', 'internist', 'internal medicine physician'],
    socCode: '291215',
    occupation: 'Family Medicine Physicians',
  },
  {
    keywords: ['surgeon', 'general surgeon', 'orthopedic surgeon', 'neurosurgeon', 'cardiac surgeon'],
    socCode: '291248',
    occupation: 'Surgeons, Except Ophthalmologists',
  },
  {
    keywords: ['psychiatrist', 'psychiatry'],
    socCode: '291223',
    occupation: 'Psychiatrists',
  },
  {
    keywords: ['pediatrician', 'pediatrics physician'],
    socCode: '291221',
    occupation: 'Pediatricians, General',
  },
  {
    keywords: ['radiologist', 'radiology physician'],
    socCode: '291224',
    occupation: 'Radiologists',
  },
  {
    keywords: ['anesthesiologist'],
    socCode: '291211',
    occupation: 'Anesthesiologists',
  },
  {
    keywords: ['physician assistant', 'pa', 'pa-c'],
    socCode: '291071',
    occupation: 'Physician Assistants',
  },
  {
    keywords: ['pharmacist'],
    socCode: '291051',
    occupation: 'Pharmacists',
  },
  {
    keywords: ['pharmacy technician', 'pharmacy tech'],
    socCode: '292052',
    occupation: 'Pharmacy Technicians',
  },
  {
    keywords: ['dentist', 'general dentist', 'dds', 'dmd'],
    socCode: '291021',
    occupation: 'Dentists, General',
  },
  {
    keywords: ['dental hygienist'],
    socCode: '292021',
    occupation: 'Dental Hygienists',
  },
  {
    keywords: ['dental assistant'],
    socCode: '319091',
    occupation: 'Dental Assistants',
  },
  {
    keywords: ['optometrist'],
    socCode: '291041',
    occupation: 'Optometrists',
  },
  {
    keywords: ['veterinarian', 'vet', 'veterinary'],
    socCode: '291131',
    occupation: 'Veterinarians',
  },
  {
    keywords: ['physical therapist', 'pt', 'physiotherapist'],
    socCode: '291123',
    occupation: 'Physical Therapists',
  },
  {
    keywords: ['physical therapy assistant', 'pta'],
    socCode: '312021',
    occupation: 'Physical Therapist Assistants',
  },
  {
    keywords: ['occupational therapist', 'ot', 'occupational therapy'],
    socCode: '291122',
    occupation: 'Occupational Therapists',
  },
  {
    keywords: ['speech language pathologist', 'slp', 'speech therapist', 'speech pathologist'],
    socCode: '291127',
    occupation: 'Speech-Language Pathologists',
  },
  {
    keywords: ['respiratory therapist', 'respiratory care practitioner'],
    socCode: '291126',
    occupation: 'Respiratory Therapists',
  },
  {
    keywords: ['medical assistant', 'clinical medical assistant'],
    socCode: '319092',
    occupation: 'Medical Assistants',
  },
  {
    keywords: ['radiologic technologist', 'radiology tech', 'xray technician', 'x-ray technician'],
    socCode: '292034',
    occupation: 'Radiologic Technologists and Technicians',
  },
  {
    keywords: ['surgical technologist', 'surgical tech', 'operating room technician'],
    socCode: '292055',
    occupation: 'Surgical Technologists',
  },
  {
    keywords: ['medical laboratory technician', 'lab technician', 'clinical lab technician', 'mlt'],
    socCode: '292012',
    occupation: 'Medical and Clinical Laboratory Technicians',
  },
  {
    keywords: ['medical laboratory scientist', 'medical technologist', 'clinical laboratory scientist', 'mls'],
    socCode: '292011',
    occupation: 'Medical and Clinical Laboratory Technologists',
  },
  {
    keywords: ['medical coder', 'medical biller', 'health information technician', 'medical records specialist'],
    socCode: '292072',
    occupation: 'Medical Records Specialists',
  },
  {
    keywords: ['health services manager', 'healthcare administrator', 'hospital administrator', 'clinic manager', 'medical office manager'],
    socCode: '119111',
    occupation: 'Medical and Health Services Managers',
  },
  {
    keywords: ['social worker', 'clinical social worker', 'lcsw', 'msw', 'licensed clinical social worker'],
    socCode: '211022',
    occupation: 'Healthcare Social Workers',
  },
  {
    keywords: ['psychologist', 'clinical psychologist', 'counseling psychologist'],
    socCode: '193031',
    occupation: 'Clinical and Counseling Psychologists',
  },
  {
    keywords: ['mental health counselor', 'licensed counselor', 'lpc', 'therapist', 'counselor'],
    socCode: '211014',
    occupation: 'Mental Health Counselors',
  },
  {
    keywords: ['substance abuse counselor', 'addiction counselor'],
    socCode: '211011',
    occupation: 'Substance Abuse and Behavioral Disorder Counselors',
  },

  // =========================================================================
  // Education
  // =========================================================================

  {
    keywords: ['elementary school teacher', 'elementary teacher', 'primary school teacher', 'kindergarten teacher'],
    socCode: '252021',
    occupation: 'Elementary School Teachers',
  },
  {
    keywords: ['middle school teacher', 'junior high teacher'],
    socCode: '252022',
    occupation: 'Middle School Teachers',
  },
  {
    keywords: ['high school teacher', 'secondary school teacher', 'secondary teacher'],
    socCode: '252031',
    occupation: 'Secondary School Teachers',
  },
  {
    keywords: ['teacher', 'classroom teacher', 'k-12 teacher'],
    socCode: '252031',
    occupation: 'Secondary School Teachers',
  },
  {
    keywords: ['special education teacher', 'sped teacher', 'special ed teacher'],
    socCode: '252050',
    occupation: 'Special Education Teachers',
  },
  {
    keywords: ['professor', 'university professor', 'college professor', 'assistant professor', 'associate professor'],
    socCode: '251000',
    occupation: 'Postsecondary Teachers',
  },
  {
    keywords: ['adjunct professor', 'adjunct instructor', 'adjunct faculty', 'lecturer'],
    socCode: '251000',
    occupation: 'Postsecondary Teachers',
  },
  {
    keywords: ['school counselor', 'guidance counselor', 'academic counselor'],
    socCode: '211012',
    occupation: 'Educational, Guidance, and Career Counselors and Advisors',
  },
  {
    keywords: ['school principal', 'principal', 'vice principal', 'assistant principal'],
    socCode: '119032',
    occupation: 'Education Administrators, Kindergarten through Secondary',
  },
  {
    keywords: ['instructional designer', 'curriculum developer', 'curriculum specialist', 'instructional coordinator'],
    socCode: '259031',
    occupation: 'Instructional Coordinators',
  },
  {
    keywords: ['librarian', 'school librarian', 'academic librarian'],
    socCode: '254021',
    occupation: 'Librarians and Media Collections Specialists',
  },
  {
    keywords: ['teaching assistant', 'teacher aide', 'instructional aide', 'paraprofessional', 'ta'],
    socCode: '259045',
    occupation: 'Teaching Assistants, Except Postsecondary',
  },
  {
    keywords: ['tutor', 'academic tutor', 'private tutor'],
    socCode: '259099',
    occupation: 'Teaching and Related Workers, All Other',
  },
  {
    keywords: ['corporate trainer', 'training specialist', 'learning and development specialist', 'l&d specialist'],
    socCode: '131151',
    occupation: 'Training and Development Specialists',
  },
  {
    keywords: ['training manager', 'learning and development manager', 'l&d manager'],
    socCode: '131151',
    occupation: 'Training and Development Specialists',
  },

  // =========================================================================
  // Sales & Marketing
  // =========================================================================

  {
    keywords: ['sales representative', 'sales rep', 'account executive', 'ae', 'inside sales representative', 'outside sales representative'],
    socCode: '414012',
    occupation: 'Sales Representatives, Wholesale and Manufacturing',
  },
  {
    keywords: ['sales manager', 'director of sales', 'vp of sales', 'vp sales'],
    socCode: '112022',
    occupation: 'Sales Managers',
  },
  {
    keywords: ['account manager', 'key account manager', 'strategic account manager', 'customer success manager'],
    socCode: '414012',
    occupation: 'Sales Representatives, Wholesale and Manufacturing',
  },
  {
    keywords: ['business development manager', 'business development representative', 'bdr', 'sdr', 'sales development representative'],
    socCode: '112022',
    occupation: 'Sales Managers',
  },
  {
    keywords: ['marketing manager', 'director of marketing', 'vp of marketing', 'vp marketing'],
    socCode: '112021',
    occupation: 'Marketing Managers',
  },
  {
    keywords: ['marketing coordinator', 'marketing associate', 'marketing specialist'],
    socCode: '131161',
    occupation: 'Market Research Analysts and Marketing Specialists',
  },
  {
    keywords: ['market research analyst', 'consumer insights analyst', 'market analyst'],
    socCode: '131161',
    occupation: 'Market Research Analysts and Marketing Specialists',
  },
  {
    keywords: ['digital marketing specialist', 'digital marketing manager', 'seo specialist', 'sem specialist', 'ppc specialist', 'paid media specialist'],
    socCode: '131161',
    occupation: 'Market Research Analysts and Marketing Specialists',
  },
  {
    keywords: ['social media manager', 'social media specialist', 'social media coordinator', 'community manager'],
    socCode: '131161',
    occupation: 'Market Research Analysts and Marketing Specialists',
  },
  {
    keywords: ['content marketing manager', 'content strategist', 'content creator', 'content writer', 'copywriter'],
    socCode: '273043',
    occupation: 'Writers and Authors',
  },
  {
    keywords: ['brand manager', 'brand strategist', 'product marketing manager', 'pmm'],
    socCode: '112021',
    occupation: 'Marketing Managers',
  },
  {
    keywords: ['public relations specialist', 'pr specialist', 'public relations manager', 'pr manager', 'communications manager', 'communications specialist'],
    socCode: '273031',
    occupation: 'Public Relations Specialists',
  },
  {
    keywords: ['real estate agent', 'real estate broker', 'realtor', 'real estate sales agent'],
    socCode: '412022',
    occupation: 'Real Estate Sales Agents',
  },
  {
    keywords: ['retail sales associate', 'retail associate', 'sales associate', 'sales clerk'],
    socCode: '412011',
    occupation: 'Retail Salespersons',
  },
  {
    keywords: ['insurance agent', 'insurance broker', 'insurance sales agent'],
    socCode: '413021',
    occupation: 'Insurance Sales Agents',
  },

  // =========================================================================
  // Legal
  // =========================================================================

  {
    keywords: ['lawyer', 'attorney', 'counsel', 'associate attorney', 'staff attorney'],
    socCode: '231011',
    occupation: 'Lawyers',
  },
  {
    keywords: ['corporate attorney', 'corporate lawyer', 'in-house counsel', 'general counsel'],
    socCode: '231011',
    occupation: 'Lawyers',
  },
  {
    keywords: ['paralegal', 'legal assistant', 'legal secretary'],
    socCode: '232011',
    occupation: 'Paralegals and Legal Assistants',
  },
  {
    keywords: ['legal counsel', 'legal advisor'],
    socCode: '231011',
    occupation: 'Lawyers',
  },
  {
    keywords: ['compliance officer', 'compliance analyst', 'compliance manager', 'compliance specialist'],
    socCode: '131041',
    occupation: 'Compliance Officers',
  },
  {
    keywords: ['judge', 'magistrate', 'administrative law judge'],
    socCode: '231023',
    occupation: 'Judges, Magistrate Judges, and Magistrates',
  },
  {
    keywords: ['contract manager', 'contracts administrator'],
    socCode: '131041',
    occupation: 'Compliance Officers',
  },

  // =========================================================================
  // Construction & Trades
  // =========================================================================

  {
    keywords: ['electrician', 'journeyman electrician', 'master electrician', 'electrical contractor'],
    socCode: '472111',
    occupation: 'Electricians',
  },
  {
    keywords: ['plumber', 'plumbing contractor', 'journeyman plumber', 'pipefitter', 'steamfitter'],
    socCode: '472152',
    occupation: 'Plumbers, Pipefitters, and Steamfitters',
  },
  {
    keywords: ['hvac technician', 'hvac mechanic', 'heating and cooling technician', 'hvac installer', 'refrigeration mechanic'],
    socCode: '499021',
    occupation: 'Heating, Air Conditioning, and Refrigeration Mechanics and Installers',
  },
  {
    keywords: ['carpenter', 'framing carpenter', 'finish carpenter'],
    socCode: '472031',
    occupation: 'Carpenters',
  },
  {
    keywords: ['construction worker', 'general laborer', 'construction laborer'],
    socCode: '472061',
    occupation: 'Construction Laborers',
  },
  {
    keywords: ['construction manager', 'project manager construction', 'superintendent', 'construction superintendent'],
    socCode: '119021',
    occupation: 'Construction Managers',
  },
  {
    keywords: ['welder', 'welding technician', 'pipe welder'],
    socCode: '514121',
    occupation: 'Welders, Cutters, Solderers, and Brazers',
  },
  {
    keywords: ['painter', 'house painter', 'commercial painter', 'industrial painter'],
    socCode: '472141',
    occupation: 'Painters and Paperhangers',
  },
  {
    keywords: ['roofer', 'roofing contractor'],
    socCode: '472181',
    occupation: 'Roofers',
  },
  {
    keywords: ['masonry worker', 'mason', 'brick mason', 'concrete mason'],
    socCode: '472021',
    occupation: 'Brickmasons and Blockmasons',
  },
  {
    keywords: ['heavy equipment operator', 'crane operator', 'bulldozer operator', 'excavator operator'],
    socCode: '472073',
    occupation: 'Operating Engineers and Other Construction Equipment Operators',
  },
  {
    keywords: ['glazier', 'glass installer'],
    socCode: '472121',
    occupation: 'Glaziers',
  },
  {
    keywords: ['civil engineer', 'structural engineer', 'geotechnical engineer'],
    socCode: '172051',
    occupation: 'Civil Engineers',
  },
  {
    keywords: ['mechanical engineer', 'manufacturing engineer', 'process engineer', 'product engineer'],
    socCode: '172141',
    occupation: 'Mechanical Engineers',
  },
  {
    keywords: ['electrical engineer'],
    socCode: '172071',
    occupation: 'Electrical Engineers',
  },
  {
    keywords: ['chemical engineer'],
    socCode: '172041',
    occupation: 'Chemical Engineers',
  },
  {
    keywords: ['aerospace engineer', 'aeronautical engineer'],
    socCode: '172011',
    occupation: 'Aerospace Engineers',
  },
  {
    keywords: ['industrial engineer', 'industrial engineering'],
    socCode: '172112',
    occupation: 'Industrial Engineers',
  },
  {
    keywords: ['environmental engineer'],
    socCode: '172081',
    occupation: 'Environmental Engineers',
  },
  {
    keywords: ['biomedical engineer', 'clinical engineer'],
    socCode: '172031',
    occupation: 'Bioengineers and Biomedical Engineers',
  },

  // =========================================================================
  // Administrative & Office
  // =========================================================================

  {
    keywords: ['administrative assistant', 'admin assistant', 'administrative associate'],
    socCode: '436014',
    occupation: 'Secretaries and Administrative Assistants',
  },
  {
    keywords: ['executive assistant', 'ea', 'executive secretary'],
    socCode: '436011',
    occupation: 'Executive Secretaries and Executive Administrative Assistants',
  },
  {
    keywords: ['office manager', 'office administrator', 'office coordinator'],
    socCode: '119081',
    occupation: 'Administrative Services Managers',
  },
  {
    keywords: ['receptionist', 'front desk receptionist', 'front desk coordinator'],
    socCode: '436013',
    occupation: 'Receptionists and Information Clerks',
  },
  {
    keywords: ['data entry clerk', 'data entry specialist', 'data entry operator'],
    socCode: '435402',
    occupation: 'Data Entry Keyers',
  },
  {
    keywords: ['customer service representative', 'customer service specialist', 'customer support representative', 'csr'],
    socCode: '434051',
    occupation: 'Customer Service Representatives',
  },
  {
    keywords: ['customer service manager', 'customer support manager', 'customer experience manager'],
    socCode: '113051',
    occupation: 'Customer Service Managers',
  },
  {
    keywords: ['operations coordinator', 'operations analyst', 'operations specialist', 'ops analyst'],
    socCode: '119199',
    occupation: 'Business Operations Specialists, All Other',
  },
  {
    keywords: ['operations manager', 'director of operations', 'vp of operations', 'vp operations'],
    socCode: '111021',
    occupation: 'General and Operations Managers',
  },
  {
    keywords: ['general manager', 'gm', 'branch manager'],
    socCode: '111021',
    occupation: 'General and Operations Managers',
  },
  {
    keywords: ['scheduler', 'scheduling coordinator', 'dispatcher'],
    socCode: '435031',
    occupation: 'Dispatchers',
  },
  {
    keywords: ['billing specialist', 'billing coordinator', 'billing analyst'],
    socCode: '434011',
    occupation: 'Brokerage Clerks',
  },
  {
    keywords: ['payroll specialist', 'payroll manager', 'payroll coordinator'],
    socCode: '432011',
    occupation: 'Payroll and Timekeeping Clerks',
  },
  {
    keywords: ['procurement specialist', 'purchasing agent', 'purchasing manager', 'buyer', 'sourcing specialist'],
    socCode: '131022',
    occupation: 'Purchasing Agents',
  },
  {
    keywords: ['supply chain analyst', 'supply chain manager', 'supply chain specialist'],
    socCode: '132061',
    occupation: 'Financial Examiners',
  },

  // =========================================================================
  // Human Resources
  // =========================================================================

  {
    keywords: ['human resources manager', 'hr manager', 'director of human resources', 'hr director'],
    socCode: '112021',
    occupation: 'Human Resources Managers',
  },
  {
    keywords: ['human resources specialist', 'hr specialist', 'hr coordinator', 'hr generalist', 'human resources generalist'],
    socCode: '132101',
    occupation: 'Human Resources Specialists',
  },
  {
    keywords: ['recruiter', 'talent acquisition specialist', 'talent acquisition manager', 'corporate recruiter', 'technical recruiter'],
    socCode: '132101',
    occupation: 'Human Resources Specialists',
  },
  {
    keywords: ['compensation analyst', 'benefits analyst', 'compensation and benefits specialist', 'total rewards analyst'],
    socCode: '132031',
    occupation: 'Compensation, Benefits, and Job Analysis Specialists',
  },
  {
    keywords: ['diversity and inclusion manager', 'dei manager', 'diversity specialist'],
    socCode: '132101',
    occupation: 'Human Resources Specialists',
  },

  // =========================================================================
  // Management & Executive
  // =========================================================================

  {
    keywords: ['chief executive officer', 'ceo', 'president', 'managing director'],
    socCode: '111011',
    occupation: 'Chief Executives',
  },
  {
    keywords: ['chief operating officer', 'coo'],
    socCode: '111011',
    occupation: 'Chief Executives',
  },
  {
    keywords: ['chief marketing officer', 'cmo'],
    socCode: '112021',
    occupation: 'Marketing Managers',
  },
  {
    keywords: ['business analyst', 'business systems analyst', 'functional analyst'],
    socCode: '131111',
    occupation: 'Management Analysts',
  },
  {
    keywords: ['management consultant', 'strategy consultant', 'consultant'],
    socCode: '131111',
    occupation: 'Management Analysts',
  },
  {
    keywords: ['project manager', 'program manager', 'pmp', 'project coordinator'],
    socCode: '119021',
    occupation: 'Project Management Specialists',
  },
  {
    keywords: ['director', 'senior director', 'associate director'],
    socCode: '111021',
    occupation: 'General and Operations Managers',
  },
  {
    keywords: ['vice president', 'vp', 'svp', 'evp', 'senior vice president', 'executive vice president'],
    socCode: '111011',
    occupation: 'Chief Executives',
  },

  // =========================================================================
  // Transportation & Logistics
  // =========================================================================

  {
    keywords: ['truck driver', 'cdl driver', 'semi truck driver', 'tractor trailer driver', 'long haul driver'],
    socCode: '533032',
    occupation: 'Heavy and Tractor-Trailer Truck Drivers',
  },
  {
    keywords: ['delivery driver', 'van driver', 'courier driver', 'last mile driver'],
    socCode: '533033',
    occupation: 'Light Truck Drivers',
  },
  {
    keywords: ['bus driver', 'transit bus driver', 'school bus driver'],
    socCode: '533051',
    occupation: 'Bus Drivers, School',
  },
  {
    keywords: ['warehouse worker', 'warehouse associate', 'warehouse clerk', 'distribution center associate'],
    socCode: '537065',
    occupation: 'Stockers and Order Fillers',
  },
  {
    keywords: ['forklift operator', 'forklift driver', 'material handler'],
    socCode: '537051',
    occupation: 'Industrial Truck and Tractor Operators',
  },
  {
    keywords: ['logistics coordinator', 'logistics analyst', 'logistics manager', 'freight coordinator'],
    socCode: '113071',
    occupation: 'Transportation, Storage, and Distribution Managers',
  },
  {
    keywords: ['dispatcher', 'fleet dispatcher', 'logistics dispatcher'],
    socCode: '435031',
    occupation: 'Dispatchers',
  },
  {
    keywords: ['airline pilot', 'commercial pilot', 'captain', 'first officer'],
    socCode: '532011',
    occupation: 'Airline Pilots, Copilots, and Flight Engineers',
  },
  {
    keywords: ['air traffic controller'],
    socCode: '532021',
    occupation: 'Air Traffic Controllers',
  },
  {
    keywords: ['inventory specialist', 'inventory coordinator', 'inventory analyst', 'inventory manager'],
    socCode: '435071',
    occupation: 'Shipping, Receiving, and Inventory Clerks',
  },
  {
    keywords: ['shipping coordinator', 'shipping specialist', 'receiving coordinator', 'freight agent'],
    socCode: '435071',
    occupation: 'Shipping, Receiving, and Inventory Clerks',
  },

  // =========================================================================
  // Food Service & Hospitality
  // =========================================================================

  {
    keywords: ['restaurant manager', 'food service manager', 'dining room manager'],
    socCode: '111011',
    occupation: 'Food Service Managers',
  },
  {
    keywords: ['chef', 'head chef', 'executive chef', 'sous chef', 'line cook', 'cook'],
    socCode: '351011',
    occupation: 'Chefs and Head Cooks',
  },
  {
    keywords: ['baker', 'pastry chef', 'pastry cook'],
    socCode: '511011',
    occupation: 'Bakers',
  },
  {
    keywords: ['server', 'waiter', 'waitress', 'food server'],
    socCode: '353031',
    occupation: 'Waiters and Waitresses',
  },
  {
    keywords: ['bartender', 'bar manager', 'mixologist'],
    socCode: '353011',
    occupation: 'Bartenders',
  },
  {
    keywords: ['barista', 'coffee shop manager', 'cafe worker'],
    socCode: '353099',
    occupation: 'Food and Beverage Serving Workers, All Other',
  },
  {
    keywords: ['hotel manager', 'hotel general manager', 'front office manager', 'property manager hotel', 'lodging manager'],
    socCode: '119081',
    occupation: 'Lodging Managers',
  },
  {
    keywords: ['event planner', 'event coordinator', 'meeting planner', 'catering manager', 'banquet manager'],
    socCode: '131121',
    occupation: 'Meeting, Convention, and Event Planners',
  },

  // =========================================================================
  // Manufacturing & Production
  // =========================================================================

  {
    keywords: ['quality control inspector', 'quality inspector', 'quality technician', 'qc inspector', 'quality control technician'],
    socCode: '519061',
    occupation: 'Inspectors, Testers, Sorters, Samplers, and Weighers',
  },
  {
    keywords: ['production supervisor', 'production manager', 'manufacturing supervisor', 'plant supervisor'],
    socCode: '511011',
    occupation: 'First-Line Supervisors of Production and Operating Workers',
  },
  {
    keywords: ['machinist', 'cnc machinist', 'cnc operator', 'machine operator'],
    socCode: '514041',
    occupation: 'Machinists',
  },
  {
    keywords: ['assembler', 'assembly technician', 'manufacturing technician', 'production associate', 'production worker'],
    socCode: '512098',
    occupation: 'Assemblers and Fabricators, All Other',
  },
  {
    keywords: ['maintenance technician', 'maintenance mechanic', 'equipment maintenance technician', 'facility maintenance technician'],
    socCode: '499071',
    occupation: 'Maintenance and Repair Workers, General',
  },
  {
    keywords: ['industrial maintenance mechanic', 'maintenance electrician'],
    socCode: '499041',
    occupation: 'Industrial Machinery Mechanics',
  },
  {
    keywords: ['plant manager', 'factory manager', 'operations plant manager'],
    socCode: '111021',
    occupation: 'General and Operations Managers',
  },
  {
    keywords: ['chemical technician', 'lab technician manufacturing', 'process technician'],
    socCode: '194031',
    occupation: 'Chemical Technicians',
  },
  {
    keywords: ['electronics technician', 'electronic technician', 'avionics technician'],
    socCode: '492094',
    occupation: 'Electrical and Electronics Repairers, Commercial and Industrial Equipment',
  },

  // =========================================================================
  // Other Common Roles
  // =========================================================================

  {
    keywords: ['graphic designer', 'visual artist', 'creative designer', 'print designer'],
    socCode: '271024',
    occupation: 'Graphic Designers',
  },
  {
    keywords: ['photographer', 'photojournalist', 'commercial photographer'],
    socCode: '274021',
    occupation: 'Photographers',
  },
  {
    keywords: ['journalist', 'reporter', 'news reporter', 'staff writer'],
    socCode: '273022',
    occupation: 'Reporters and Correspondents',
  },
  {
    keywords: ['editor', 'copy editor', 'managing editor', 'content editor'],
    socCode: '273041',
    occupation: 'Editors',
  },
  {
    keywords: ['social worker', 'child welfare worker', 'case worker'],
    socCode: '211021',
    occupation: 'Child, Family, and School Social Workers',
  },
  {
    keywords: ['police officer', 'law enforcement officer', 'detective'],
    socCode: '333051',
    occupation: 'Police and Sheriff\'s Patrol Officers',
  },
  {
    keywords: ['firefighter', 'fire fighter'],
    socCode: '332011',
    occupation: 'Firefighters',
  },
  {
    keywords: ['security guard', 'security officer', 'security specialist'],
    socCode: '339032',
    occupation: 'Security Guards',
  },
  {
    keywords: ['personal trainer', 'fitness trainer', 'fitness instructor', 'gym instructor'],
    socCode: '399031',
    occupation: 'Fitness Trainers and Aerobics Instructors',
  },
  {
    keywords: ['hair stylist', 'hairdresser', 'cosmetologist', 'barber'],
    socCode: '395012',
    occupation: 'Hairdressers, Hairstylists, and Cosmetologists',
  },
  {
    keywords: ['real estate property manager', 'property manager', 'apartment manager', 'leasing manager'],
    socCode: '119141',
    occupation: 'Property, Real Estate, and Community Association Managers',
  },
  {
    keywords: ['architect', 'licensed architect', 'project architect'],
    socCode: '171011',
    occupation: 'Architects, Except Landscape and Naval',
  },
  {
    keywords: ['landscape architect'],
    socCode: '171012',
    occupation: 'Landscape Architects',
  },
  {
    keywords: ['urban planner', 'city planner'],
    socCode: '193051',
    occupation: 'Urban and Regional Planners',
  },
  {
    keywords: ['economist', 'economic analyst', 'economic consultant'],
    socCode: '192011',
    occupation: 'Economists',
  },
  {
    keywords: ['statistician', 'quantitative analyst', 'quant analyst', 'biostatistician'],
    socCode: '152041',
    occupation: 'Data Analysts',
  },
  {
    keywords: ['interpreter', 'translator', 'language specialist'],
    socCode: '273091',
    occupation: 'Interpreters and Translators',
  },
  {
    keywords: ['research scientist', 'scientist', 'research associate'],
    socCode: '194099',
    occupation: 'Life, Physical, and Social Science Technicians, All Other',
  },
];

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/**
 * Prefixes/suffixes that should be stripped before matching.
 * Kept as a pre-compiled regex for performance.
 */
const STRIP_PATTERN = /\b(sr|senior|junior|jr|lead|principal|staff|associate|assistant|i{1,3}|iv|v|1|2|3|4|5|mid|entry|level|remote|contract|part[- ]time|full[- ]time|temp|temporary)\b\.?/gi;

/**
 * Normalize a job title string for matching.
 * Lowercases, trims, and strips common prefixes/suffixes and punctuation.
 *
 * @param {string} title - Raw job title string
 * @returns {string} Normalized title
 */
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(STRIP_PATTERN, ' ')
    .replace(/[^a-z0-9& ]/g, ' ')  // replace punctuation (keep & for e.g. "r&d")
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .trim();
}

// ---------------------------------------------------------------------------
// Fuzzy matching
// ---------------------------------------------------------------------------

/**
 * Find the best SOC code match for a given job title using a multi-pass strategy:
 *
 *  1. Exact keyword match — normalized title equals a keyword exactly.
 *  2. Partial match     — any keyword is a substring of the normalized title.
 *  3. Reverse match     — normalized title is a substring of any keyword.
 *  4. Fallback          — returns a generic occupation code.
 *
 * @param {string} jobTitle - The raw job title string to look up
 * @returns {{ socCode: string, occupation: string, confidence: 'exact'|'partial'|'fuzzy'|'fallback' }}
 */
export function findBestSocMatch(jobTitle) {
  if (!jobTitle || typeof jobTitle !== 'string') {
    return { socCode: '000000', occupation: 'Unknown Occupation', confidence: 'fallback' };
  }

  const normalized = normalizeTitle(jobTitle);

  if (!normalized) {
    return { socCode: '000000', occupation: 'Unknown Occupation', confidence: 'fallback' };
  }

  // --- Pass 1: Exact keyword match ---
  for (const entry of SOC_ENTRIES) {
    for (const keyword of entry.keywords) {
      if (normalized === keyword) {
        return { socCode: entry.socCode, occupation: entry.occupation, confidence: 'exact' };
      }
    }
  }

  // --- Pass 2: Partial match — keyword found inside title ---
  // Prefer the longest matching keyword for specificity
  let bestPartial = null;
  let bestPartialLen = 0;

  for (const entry of SOC_ENTRIES) {
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword) && keyword.length > bestPartialLen) {
        bestPartial = entry;
        bestPartialLen = keyword.length;
      }
    }
  }

  if (bestPartial) {
    return { socCode: bestPartial.socCode, occupation: bestPartial.occupation, confidence: 'partial' };
  }

  // --- Pass 3: Fuzzy/reverse match — title found inside keyword ---
  let bestFuzzy = null;
  let bestFuzzyLen = 0;

  for (const entry of SOC_ENTRIES) {
    for (const keyword of entry.keywords) {
      if (keyword.includes(normalized) && normalized.length > bestFuzzyLen) {
        bestFuzzy = entry;
        bestFuzzyLen = normalized.length;
      }
    }
  }

  if (bestFuzzy) {
    return { socCode: bestFuzzy.socCode, occupation: bestFuzzy.occupation, confidence: 'fuzzy' };
  }

  // --- Pass 4: Fallback ---
  return { socCode: '000000', occupation: 'All Occupations', confidence: 'fallback' };
}

// ---------------------------------------------------------------------------
// Backwards-compatibility shim
// ---------------------------------------------------------------------------

/**
 * Resolve a job title to its SOC code and occupation label.
 * Matches the interface of the legacy `resolveSoc()` in service-worker.js.
 *
 * Drop-in replacement: returns `{ socCode, occupation }` without `confidence`.
 * Falls back to SOC 150000 "Computer Occupations, All Other" (same as original
 * SOC_FALLBACK) for any title that doesn't match, rather than 000000, so that
 * the BLS series-ID builder in service-worker.js always has a usable code.
 *
 * @param {string} jobTitle - Raw job title from the job listing page
 * @returns {{ socCode: string, occupation: string }}
 */
export function resolveSoc(jobTitle) {
  const match = findBestSocMatch(jobTitle);

  if (match.confidence === 'fallback') {
    // Keep original fallback code so BLS queries still work
    return { socCode: '150000', occupation: 'Computer Occupations, All Other' };
  }

  return { socCode: match.socCode, occupation: match.occupation };
}
