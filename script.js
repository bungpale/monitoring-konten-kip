const API_URL = 'https://script.google.com/macros/s/AKfycbz733bxyCYyjTZa8VH1-Qpf-WMGUl8cho4oOf2IL7Ca2T4y2Jv7yHmBeERrfM-DHQ8-sw/exec';

const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

const tanggalInput = document.getElementById('tanggalInput');
const loadBtn = document.getElementById('loadBtn');
const logoutBtn = document.getElementById('logoutBtn');

const contentList = document.getElementById('contentList');
const dashboardMessage = document.getElementById('dashboardMessage');

const totalCabang = document.getElementById('totalCabang');
const sudahUpload = document.getElementById('sudahUpload');
const belumUpload = document.getElementById('belumUpload');

document.addEventListener('DOMContentLoaded', () => {
  tanggalInput.value = getTodayDate();

  const token = localStorage.getItem('kip_token');

  if (token) {
    showDashboard();
    loadMonitoring();
  } else {
    showLogin();
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  loginMessage.textContent = 'Memproses login...';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const result = await apiRequest({
      action: 'login',
      username: username,
      password: password
    });

    if (!result.ok) {
      loginMessage.textContent = result.message;
      return;
    }

    localStorage.setItem('kip_token', result.token);
    localStorage.setItem('kip_user', JSON.stringify(result.user));

    loginMessage.textContent = '';

    showDashboard();
    loadMonitoring();

  } catch (error) {
    loginMessage.textContent = 'Login gagal. Periksa koneksi atau API URL.';
  }
});

loadBtn.addEventListener('click', () => {
  loadMonitoring();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('kip_token');
  localStorage.removeItem('kip_user');
  showLogin();
});

async function loadMonitoring() {
  dashboardMessage.textContent = 'Mengambil data...';
  contentList.innerHTML = '';

  const token = localStorage.getItem('kip_token');
  const tanggal = tanggalInput.value;

  try {
    const result = await apiRequest({
      action: 'getMonitoring',
      token: token,
      tanggal: tanggal
    });

    if (!result.ok) {
      dashboardMessage.textContent = result.message;
      localStorage.removeItem('kip_token');
      showLogin();
      return;
    }

    renderMonitoring(result.data);
    dashboardMessage.textContent = '';

  } catch (error) {
    dashboardMessage.textContent = 'Gagal mengambil data.';
  }
}

function renderMonitoring(data) {
  contentList.innerHTML = '';

  let jumlahSudahUpload = 0;
  let jumlahBelumUpload = 0;

  data.forEach((item) => {
    const isDone = item.status === 'Sudah Upload';

    if (isDone) {
      jumlahSudahUpload++;
    } else {
      jumlahBelumUpload++;
    }

    const card = document.createElement('div');
    card.className = 'branch-card';

    card.innerHTML = `
      <div class="branch-info">
        <h3>${escapeHtml(item.cabang)}</h3>
        <span class="status ${isDone ? 'done' : 'not-yet'}">
          ${isDone ? 'Sudah Upload' : 'Belum Upload'}
        </span>
        <p style="margin-top:8px;color:#64748b;font-size:14px;">
          Terakhir update: ${item.updatedAt ? escapeHtml(item.updatedAt) : '-'}
        </p>
      </div>

      <div class="branch-action">
        <div class="checkbox-row">
          <input type="checkbox" class="status-checkbox" ${isDone ? 'checked' : ''}>
          <span>Sudah upload konten hari ini</span>
        </div>

        <input 
          type="text" 
          class="catatan-input" 
          placeholder="Catatan opsional"
          value="${escapeHtml(item.catatan)}"
        >

        <button class="save-btn">Simpan</button>
      </div>
    `;

    const checkbox = card.querySelector('.status-checkbox');
    const catatanInput = card.querySelector('.catatan-input');
    const saveBtn = card.querySelector('.save-btn');

    saveBtn.addEventListener('click', async () => {
      await saveStatus(item.cabang, checkbox.checked, catatanInput.value);
    });

    contentList.appendChild(card);
  });

  totalCabang.textContent = data.length;
  sudahUpload.textContent = jumlahSudahUpload;
  belumUpload.textContent = jumlahBelumUpload;
}

async function saveStatus(cabang, status, catatan) {
  dashboardMessage.textContent = 'Menyimpan data...';

  const token = localStorage.getItem('kip_token');
  const tanggal = tanggalInput.value;

  try {
    const result = await apiRequest({
      action: 'saveStatus',
      token: token,
      tanggal: tanggal,
      cabang: cabang,
      status: status,
      catatan: catatan
    });

    if (!result.ok) {
      dashboardMessage.textContent = result.message;
      return;
    }

    dashboardMessage.textContent = 'Data berhasil disimpan.';
    loadMonitoring();

  } catch (error) {
    dashboardMessage.textContent = 'Gagal menyimpan data.';
  }
}

async function apiRequest(data) {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    }
  });

  return await response.json();
}

function showLogin() {
  loginPage.classList.remove('hidden');
  dashboardPage.classList.add('hidden');
}

function showDashboard() {
  loginPage.classList.add('hidden');
  dashboardPage.classList.remove('hidden');
}

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}