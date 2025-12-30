let currentView = 'list';
let selectedServiceId = null;
let pollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  startPolling();
  document.getElementById('back-btn').addEventListener('click', showList);
});

function startPolling() {
  loadData();
  pollInterval = setInterval(loadData, 5000);
}

function loadData() {
  if (currentView === 'list') {
    fetchServices();
  } else if (currentView === 'details' && selectedServiceId) {
    fetchDetails(selectedServiceId);
  }
}

async function fetchServices() {
  try {
    const response = await fetch('/api/services');
    const services = await response.json();
    renderServices(services);
  } catch (error) {
    console.error('Error loading services:', error);
  }
}

function renderServices(services) {
  const container = document.getElementById('services');
  container.style.display = 'block';
  document.getElementById('details').style.display = 'none';
  document.getElementById('back-btn').style.display = 'none';
  
  if (services.length === 0) {
    container.innerHTML = '<p>No monitored service.</p>';
    return;
  }

  container.innerHTML = services.map(service => `
    <div class="service-card status-${service.status || 'offline'}" onclick="showDetails(${service.id}, '${service.name}')">
      <h3>${service.name} <span class="badge bg-${service.status || 'offline'}">${service.status || 'UNKNOWN'}</span></h3>
      <p><b>URL:</b> <a href="${service.base_url}" target="_blank" onclick="event.stopPropagation()">${service.base_url}</a></p>
      <p><b>Last check:</b> ${service.checked_at ? new Date(service.checked_at).toLocaleString() : 'Never'}</p>
      <p><b>Time:</b> ${service.response_time_ms || 0} ms</p>
    </div>
  `).join('');
}

function showList() {
  currentView = 'list';
  selectedServiceId = null;
  fetchServices();
}

async function showDetails(id, name) {
  currentView = 'details';
  selectedServiceId = id;
  document.getElementById('services').style.display = 'none';
  document.getElementById('details').style.display = 'block';
  document.getElementById('back-btn').style.display = 'block';
  
  document.getElementById('details').innerHTML = `<h2>Logs: ${name}</h2><div id="history-content">Loading...</div>`;
  fetchDetails(id);
}

async function fetchDetails(id) {
  try {
    const [historyRes, eventsRes] = await Promise.all([
      fetch(`/api/services/${id}/history?limit=20`),
      fetch(`/api/services/${id}/events`)
    ]);
    
    const historyData = await historyRes.json();
    const history = historyData.data;
    
    const html = `
      <table>
        <thead><tr><th>Status</th><th>Code</th><th>Time</th><th>Date</th></tr></thead>
        <tbody>
          ${history.map(h => `
            <tr>
              <td><span class="badge bg-${h.status}">${h.status}</span></td>
              <td>${h.http_code || '-'}</td>
              <td>${h.response_time_ms} ms</td>
              <td>${new Date(h.checked_at).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.getElementById('history-content').innerHTML = html;
  } catch (e) {
    console.error(e);
  }
}