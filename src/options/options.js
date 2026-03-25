import { STORAGE } from '../shared/constants.js';

async function loadSettings() {
  const stored = await chrome.storage.local.get(STORAGE.SETTINGS);
  const settings = stored[STORAGE.SETTINGS] ?? {};

  document.getElementById('bls-key').value = settings.blsApiKey ?? '';
  document.getElementById('cos-userid').value = settings.careerOneStopUserId ?? '';
  document.getElementById('cos-token').value = settings.careerOneStopToken ?? '';
}

async function saveSettings() {
  const settings = {
    blsApiKey: document.getElementById('bls-key').value.trim(),
    careerOneStopUserId: document.getElementById('cos-userid').value.trim(),
    careerOneStopToken: document.getElementById('cos-token').value.trim(),
  };

  await chrome.storage.local.set({ [STORAGE.SETTINGS]: settings });

  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  document.getElementById('save-btn').addEventListener('click', saveSettings);
});
