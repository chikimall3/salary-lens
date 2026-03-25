export function resolveMsa() {
  return { msaCode: '0000000', msaName: 'National (US)', areaType: 'national' };
}

export function buildAreaSeriesId(msaResult, socCode, dataType) {
  return `OEUN0000000000000${socCode}${dataType}`;
}
