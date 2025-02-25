const { jsPDF } = window.jspdf;
let entries = JSON.parse(localStorage.getItem('financeData')) || [];
let currentUser = null;
let editingIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    populateMonthFilter();
    populateYearFilter();
    setupEventListeners();
    if (entries.length > 0) renderTable();
}


function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('entryForm').addEventListener('submit', handleSubmit);
    document.getElementById('monthFilter').addEventListener('change', renderTable);
    document.getElementById('yearFilter').addEventListener('change', renderTable);
    document.getElementById('pdfBtn').addEventListener('click', generatePDF);
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if ((username === 'ADMIN' && password === 'ADMIN') || 
        (username === 'ARAB' && password === 'ADMIN')) {
        currentUser = username;
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        renderTable();
    } else {
        alert('Invalid credentials');
    }
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const tfoot = document.getElementById('tableFooter');
    const monthFilter = document.getElementById('monthFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    
    tbody.innerHTML = '';
    let totals = createEmptyTotals();

    entries.filter(entry => {
        const [year, month] = entry.date.split('-');
        return (monthFilter === 'all' || month === monthFilter) &&
               (yearFilter === 'all' || year === yearFilter);
    }).forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(entry.date).toLocaleDateString('en-GB')}</td>
            <td>${entry.creditCard.toFixed(2)}</td>
            <td>${entry.cash.toFixed(2)}</td>
            <td>${entry.expenses.toFixed(2)}</td>
            <td>${entry.charity.toFixed(2)}</td>
            <td>${entry.cashInHand.toFixed(2)}</td>
            <td>${entry.totalCash.toFixed(2)}</td>
            <td>
                ${currentUser === 'ARAB' ? `
                <button class="edit-btn" onclick="editEntry(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteEntry(${index})">Delete</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
        updateTotals(totals, entry);
    });

    renderFooterTotals(tfoot, totals);
}

function generatePDF() {
    try {
        const doc = new jsPDF();
        const monthFilter = document.getElementById('monthFilter');
        const yearFilter = document.getElementById('yearFilter');
        const selectedMonth = monthFilter.options[monthFilter.selectedIndex].text;
        const selectedYear = yearFilter.options[yearFilter.selectedIndex].text;
        const pageWidth = doc.internal.pageSize.width;

        // PDF title with center alignment
        const title = selectedMonth === 'All Months' && selectedYear === 'All Years' ? 
            'Complete Financial Report' : 
            ` ${selectedMonth} ${selectedYear}`;

        doc.setFontSize(16);
        doc.text(title, pageWidth / 2, 15, { align: 'center' });

        // Filter data
        const filteredData = entries.filter(entry => {
            const [year, month] = entry.date.split('-');
            return (monthFilter.value === 'all' || month === monthFilter.value) &&
                   (yearFilter.value === 'all' || year === yearFilter.value);
        });

        // Prepare table data
        const data = filteredData.map(entry => [
            new Date(entry.date).toLocaleDateString('en-GB'),
            entry.creditCard.toFixed(2),
            entry.cash.toFixed(2),
            entry.expenses.toFixed(2),
            entry.charity.toFixed(2),
            entry.cashInHand.toFixed(2),
            entry.totalCash.toFixed(2)
        ]);

        // Add totals row
        if (filteredData.length > 0) {
            const totals = calculateTotals(filteredData);
            data.push([
                'TOTAL',
                totals.creditCard.toFixed(2),
                totals.cash.toFixed(2),
                totals.expenses.toFixed(2),
                totals.charity.toFixed(2),
                totals.cashInHand.toFixed(2),
                totals.totalCash.toFixed(2)
            ]);
        }

        // Generate PDF table
        doc.autoTable({
            head: [['Date', 'Credit Card', 'Cash', 'Expenses', 'Charity', 'Cash in Hand', 'Total Cash']],
            body: data,
            startY: 25,
            theme: 'grid',
            headStyles: { 
                fillColor: [44, 62, 80], 
                textColor: 255, 
                fontStyle: 'bold' 
            },
            styles: { 
                fontSize: 9, 
                cellPadding: 2, 
                halign: 'center' 
            }
        });

        doc.save(`${title.replace(/ /g, '_')}.pdf`);
    } catch (error) {
        console.error('PDF Error:', error);
        alert('Error generating PDF');
    }
}

// Helper functions
function createEmptyTotals() {
    return {
        creditCard: 0,
        cash: 0,
        expenses: 0,
        charity: 0,
        cashInHand: 0,
        totalCash: 0
    };
}

function calculateTotals(data) {
    return data.reduce((acc, entry) => ({
        creditCard: acc.creditCard + entry.creditCard,
        cash: acc.cash + entry.cash,
        expenses: acc.expenses + entry.expenses,
        charity: acc.charity + entry.charity,
        cashInHand: acc.cashInHand + entry.cashInHand,
        totalCash: acc.totalCash + entry.totalCash
    }), createEmptyTotals());
}

function updateTotals(totals, entry) {
    Object.keys(totals).forEach(key => {
        totals[key] += entry[key];
    });
}

function renderFooterTotals(tfoot, totals) {
    tfoot.innerHTML = `
        <tr>
            <td>Total</td>
            <td>${totals.creditCard.toFixed(2)}</td>
            <td>${totals.cash.toFixed(2)}</td>
            <td>${totals.expenses.toFixed(2)}</td>
            <td>${totals.charity.toFixed(2)}</td>
            <td>${totals.cashInHand.toFixed(2)}</td>
            <td>${totals.totalCash.toFixed(2)}</td>
            <td></td>
        </tr>
    `;
}

function handleSubmit(e) {
    e.preventDefault();
    if (currentUser !== 'ARAB') return;

    const newEntry = {
        date: document.getElementById('entryDate').value,
        creditCard: parseFloat(document.getElementById('creditCard').value),
        cash: parseFloat(document.getElementById('cash').value),
        expenses: parseFloat(document.getElementById('expenses').value),
        charity: parseFloat(document.getElementById('charity').value)
    };

    if (!validateEntry(newEntry)) return;

    newEntry.cashInHand = newEntry.cash - newEntry.expenses - newEntry.charity;
    newEntry.totalCash = newEntry.creditCard + newEntry.cashInHand;

    if (editingIndex > -1) {
        entries[editingIndex] = newEntry;
        editingIndex = -1;
    } else {
        entries.push(newEntry);
    }

    localStorage.setItem('financeData', JSON.stringify(entries));
    populateYearFilter();
    renderTable();
    e.target.reset();
}

function validateEntry(entry) {
    const values = Object.values(entry).slice(1);
    if (values.some(isNaN)) {
        alert('Invalid numeric values');
        return false;
    }
    if (values.some(v => v < 0)) {
        alert('Negative values not allowed');
        return false;
    }
    return true;
}

function deleteEntry(index) {
    if (confirm('Delete this entry?')) {
        entries.splice(index, 1);
        localStorage.setItem('financeData', JSON.stringify(entries));
        renderTable();
    }
}

function editEntry(index) {
    const entry = entries[index];
    document.getElementById('entryDate').value = entry.date;
    document.getElementById('creditCard').value = entry.creditCard;
    document.getElementById('cash').value = entry.cash;
    document.getElementById('expenses').value = entry.expenses;
    document.getElementById('charity').value = entry.charity;
    editingIndex = index;
}

function populateMonthFilter() {
    const months = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
    const select = document.getElementById('monthFilter');
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = (index + 1).toString().padStart(2, '0');
        option.textContent = month;
        select.appendChild(option);
    });
}

function populateYearFilter() {
    const years = new Set(entries.map(entry => entry.date.split('-')[0]));
    const select = document.getElementById('yearFilter');
    select.innerHTML = '<option value="all">All Years</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });
}

function handleLogout() {
    currentUser = null;
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'block';
}
