<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }
  </style>
</head>
<body>
<!-- STITCH_THREEJS_START:ANIMATION_40 class="fixed inset-0 w-full h-full bg-transparent" -->
<div class="fixed inset-0 w-full h-full bg-transparent" style="display:block;">
<script src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"></script>
<div id="threejs-container-ANIMATION_40" style="width:100%;height:100%"></div>
<script>
(function() {
  const container = document.getElementById('threejs-container-ANIMATION_40');
  const devicePixelRatio = window.devicePixelRatio || 1;
  // Konfigurasi: Ganti dengan URL 'exec' dari Google Apps Script yang sudah di-deploy sebagai Web App
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxFGn9YxIcy-SLjeyQqxHDG5aXcNV0crp7_KMJ0Xm-flV2A_m7BqQKnBp4_FbVxeMTF/exec';

/**
 * Fungsi Utama: Mengambil data Dashboard (Traffic, Activity, Notifications, App Status)
 */
async function fetchDashboardData() {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  try {
    const response = await fetch(`${GAS_API_URL}?action=getDashboardData&t=${new Date().getTime()}`);
    if (!response.ok) throw new Error('Network error');

    const data = await response.json();
    console.log('Real-time Data received:', data);

    if (data) {
      // 1. Update Scorecards (Traffic Overview)
      updateTrafficUI(data.traffic);
      
      // 2. Update Recent Activity
      updateActivityUI(data.recentActivity);

      // 3. Update Notifications
      updateNotificationsUI(data.notifications);

      // 4. Update App Badges/Statuses
      updateAppStatusesUI(data.apps);

      // Status Sistem Online
      if (statusIndicator) {
        statusIndicator.classList.remove('bg-error', 'animate-pulse');
        statusIndicator.classList.add('bg-tertiary-fixed-dim');
      }
      if (statusText) statusText.innerText = 'Sistem Online';
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    if (statusIndicator) statusIndicator.classList.add('bg-error');
    if (statusText) statusText.innerText = 'API Offline';
  }
}

/**
 * Mengirim log aktivitas ke GAS saat user mengklik "Luncurkan"
 */
async function logAppLaunch(appId, appName) {
  console.log(`Logging launch for: ${appName} (${appId})`);
  try {
    // Mengirim data menggunakan parameter URL (GET) ke GAS
    const url = `${GAS_API_URL}?action=logActivity&appId=${appId}&appName=${encodeURIComponent(appName)}&user=Admin&t=${new Date().getTime()}`;
    await fetch(url, { mode: 'no-cors' }); // no-cors cukup untuk tracking beacon
    
    // Refresh data setelah jeda singkat agar data terbaru (termasuk klik barusan) muncul
    setTimeout(fetchDashboardData, 1500);
  } catch (error) {
    console.warn('Silent log error:', error);
  }
}

function updateTrafficUI(traffic) {
  const totalAkses = document.getElementById('total-akses-value');
  const userAktif = document.getElementById('user-aktif-value');
  if (totalAkses && traffic.totalAkses) totalAkses.innerText = traffic.totalAkses.toLocaleString();
  if (userAktif && traffic.userAktif) userAktif.innerText = traffic.userAktif;
}

function updateActivityUI(activities) {
  const activityList = document.getElementById('activity-list');
  if (!activityList || !activities) return;

  activityList.innerHTML = activities.map(act => `
    <div class="flex justify-between items-center text-xs py-1 border-b border-outline-variant/30 last:border-0">
      <span class="text-on-surface">${act.user} - ${act.app}</span>
      <span class="text-on-surface-variant">${act.time}</span>
    </div>
  `).join('');
}

function updateNotificationsUI(notifications) {
  const list = document.getElementById('notifications-list');
  const dot = document.getElementById('notification-dot');
  if (!list) return;
  
  if (!notifications || notifications.length === 0) {
    list.innerHTML = `<div class="text-center py-8 text-on-surface-variant"><p>Tidak ada notifikasi baru</p></div>`;
    if (dot) dot.classList.add('hidden');
    return;
  }

  if (dot) dot.classList.remove('hidden');
  list.innerHTML = notifications.map(notif => {
    const color = notif.type === 'error' ? 'border-error' : (notif.type === 'warning' ? 'border-secondary' : 'border-tertiary');
    const icon = notif.type === 'error' ? 'cancel' : (notif.type === 'warning' ? 'warning' : 'check_circle');
    const iconColor = notif.type === 'error' ? 'text-error' : (notif.type === 'warning' ? 'text-secondary' : 'text-tertiary');
    return `
      <div class="p-4 rounded-lg bg-surface-container-high border-l-4 ${color} flex gap-3 transform transition-all hover:scale-[1.02]">
        <span class="material-symbols-outlined ${iconColor}">${icon}</span>
        <div>
          <p class="font-label-md text-on-surface">${notif.title}</p>
          <p class="text-sm text-on-surface-variant">${notif.msg}</p>
        </div>
      </div>
    `;
  }).join('');
}

function updateAppStatusesUI(appData) {
  if (!appData) return;
  Object.entries(appData).forEach(([appId, config]) => {
    const card = document.querySelector(`[data-app-id="${appId}"]`);
    if (!card) return;
    const container = card.querySelector('.status-container');
    if (!container) return;

    if (config.alerts > 0) {
      container.innerHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-mono-data bg-error-container text-on-error-container border border-error/20 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-error"></span> ${config.alerts} ALERTS</span>`;
    } else {
      const colors = { 'LIVE': 'bg-tertiary-container text-tertiary-fixed', 'STABLE': 'bg-surface-container-high', 'ACTIVE': 'bg-surface-container-high' };
      const cls = colors[config.status] || 'bg-surface-container-high';
      container.innerHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-mono-data ${cls} border border-outline-variant">${config.status}</span>`;
    }
  });
}

// Inisialisasi Event Listeners untuk Tombol Luncurkan
function initLaunchTracking() {
  document.querySelectorAll('.launch-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('article');
      const appId = card ? card.getAttribute('data-app-id') : 'unknown';
      const appName = card ? card.querySelector('h4').innerText : 'Unknown App';
      logAppLaunch(appId, appName);
    });
  });
}

// Jalankan saat dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();
  initLaunchTracking();
  setInterval(fetchDashboardData, 30000); // Refresh data tiap 30 detik
});
})();
</script>
</div>
<!-- STITCH_THREEJS_END:ANIMATION_40 -->
</body>
</html>