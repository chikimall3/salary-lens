const SOC_TABLE = {
  'software engineer': { socCode: '151252', occupation: 'Software Developers' },
  'software developer': { socCode: '151252', occupation: 'Software Developers' },
  'financial analyst': { socCode: '132051', occupation: 'Financial and Investment Analysts' },
  'accountant': { socCode: '132011', occupation: 'Accountants and Auditors' },
  'nurse': { socCode: '291141', occupation: 'Registered Nurses' },
};

export function resolveSoc(jobTitle) {
  const key = jobTitle.trim().toLowerCase();
  if (SOC_TABLE[key]) return SOC_TABLE[key];
  for (const [k, v] of Object.entries(SOC_TABLE)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { socCode: '150000', occupation: 'Computer Occupations, All Other' };
}
