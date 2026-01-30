import initAdminPage from './admin.js';
initAdminPage();

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('.table-wrapper table');
  if (!table) return;

  for (let i = 3; i <= 24; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="row-num">${i}</td><td></td><td></td><td></td><td></td>`;
    table.appendChild(tr);
  }
});
