const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3ukMrZ0D17rGEXwxZ3f2jzMq_EEnj6goi_z_VrobigC-J4QZqwxpEL4HNDzSKkzQ/exec";

const form = document.getElementById('memberForm');
const tableBody = document.getElementById('memberTableBody');
const accountContainer = document.getElementById('accountInputContainer');
const addAccountBtn = document.getElementById('addAccountBtn');
const searchInput = document.getElementById('searchAccount');

let allMembersData = []; 

// ==========================================
// ÉP KIỂU NHẬP LIỆU NGAY KHI GÕ
// ==========================================
document.getElementById('fullName').addEventListener('input', function() {
    this.value = this.value.replace(/[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠỢ̣̣̣̣̣́́̉̃́̉̃́̀̉̃́̀́̉̃́̀́̉̃́̉̃́ Gg]/g, '');
});

document.getElementById('birthYear').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length > 4) this.value = this.value.slice(0, 4);
});

document.getElementById('zalo').addEventListener('input', function() {
    let val = this.value.replace(/[^0-9]/g, '');
    if (val.length > 0 && val[0] !== '0') val = '';
    if (val.length > 10) val = val.slice(0, 10);
    this.value = val;
});

// ==========================================
// THÊM/XÓA Ô NHẬP ACC GAME
// ==========================================
addAccountBtn.addEventListener('click', function() {
    const wrapper = document.createElement('div');
    wrapper.className = 'account-input-wrapper animated fadeIn';
    wrapper.style.marginTop = '10px';
    wrapper.innerHTML = `
        <input type="text" class="account-field" placeholder="Nhập tên tài khoản game khác" required autocomplete="off">
        <button type="button" class="remove-acc-btn">-</button>
    `;
    accountContainer.appendChild(wrapper);
    wrapper.querySelector('.remove-acc-btn').addEventListener('click', () => wrapper.remove());
});

// ==========================================
// TẢI DỮ LIỆU & TÍNH TOÁN THỐNG KÊ
// ==========================================
function loadMembers() {
    fetch(SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            allMembersData = data;
            updateDashboardCounters(data);
            renderTable(data);
        })
        .catch(error => {
            console.error('Lỗi:', error);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Lỗi tải dữ liệu danh sách!</td></tr>';
        });
}

function updateDashboardCounters(data) {
    let total = data.length;
    let approved = 0;
    
    data.forEach(m => {
        if (m.status === true || m.status === "TRUE" || m.status === "Rồi") approved++;
    });
    
    document.getElementById('totalAccs').innerText = total;
    document.getElementById('approvedAccs').innerText = approved;
    document.getElementById('pendingAccs').innerText = (total - approved);
}

function renderTable(dataList) {
    tableBody.innerHTML = '';
    if(dataList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #64748b;">Không tìm thấy tài khoản nào phù hợp.</td></tr>';
        return;
    }
    
    dataList.forEach((member, index) => {
        const row = document.createElement('tr');
        
        let isApproved = (member.status === true || member.status === "TRUE" || member.status === "Rồi");
        let statusHtml = isApproved 
            ? '<span class="status-badge approved">✔ Đã duyệt</span>' 
            : '<span class="status-badge pending">⏳ Chờ duyệt</span>';

        if (!isApproved) row.className = 'row-pending';

        let zaloStr = String(member.zalo || '').trim();
        if (zaloStr.length === 9 && /^[35789].test(zaloStr)) zaloStr = '0' + zaloStr;

        row.innerHTML = `
            <td style="color: #64748b; font-weight: 500;">${index + 1}</td>
            <td style="font-weight: 500;">${member.fullName || ''}</td>
            <td>${member.birthYear || ''}</td>
            <td>
                <div class="acc-cell">
                    <span class="acc-name">${member.accounts || ''}</span>
                    <button class="btn-copy-mini" onclick="copyToClipboard('${member.accounts}')" title="Copy tên Acc">📋</button>
                </div>
            </td>
            <td><a class='zalo-link-row' href='https://zalo.me/${zaloStr}' target='_blank'>💬 ${zaloStr}</a></td>
            <td>${statusHtml}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Hàm hỗ trợ copy nhanh tên tài khoản
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Đã copy tài khoản: ${text}`);
    }).catch(err => console.error('Không thể copy', err));
}

// BỘ LỌC TÌM KIẾM
searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    const filtered = allMembersData.filter(m => String(m.accounts || '').toLowerCase().includes(query));
    renderTable(filtered);
});

// GỬI DATA FORM ĐĂNG KÝ
form.addEventListener('submit', function(event) {
    event.preventDefault();
    const birth = document.getElementById('birthYear').value;
    const zaloVal = document.getElementById('zalo').value;
    
    if(birth.length !== 4 || zaloVal.length !== 10) {
        alert("Vui lòng kiểm tra lại độ dài Năm sinh (4 số) hoặc Số Zalo (10 số)!");
        return;
    }

    const submitBtn = form.querySelector('.submit-main-btn');
    submitBtn.innerText = 'Đang gửi thông tin đăng ký...';
    submitBtn.disabled = true;

    const accountFields = document.querySelectorAll('.account-field');
    const accountsList = [];
    accountFields.forEach(f => { if(f.value.trim() !== "") accountsList.push(f.value.trim()); });

    const newMember = {
        fullName: document.getElementById('fullName').value.trim(),
        birthYear: birth,
        accounts: accountsList,
        zalo: zaloVal
    };

    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMember) })
    .then(() => {
        alert('Đăng ký thành công! Đang đồng bộ hóa dữ liệu hệ thống.');
        form.reset();
        document.querySelectorAll('.account-input-wrapper').forEach((w, idx) => { if(idx > 0) w.remove(); });
        submitBtn.innerText = 'Gửi Đăng Ký Tham Gia';
        submitBtn.disabled = false;
        setTimeout(loadMembers, 2000);
    })
    .catch(error => {
        console.error(error);
        alert('Có lỗi hệ thống xảy ra!');
        submitBtn.innerText = 'Gửi Đăng Ký Tham Gia';
        submitBtn.disabled = false;
    });
});

loadMembers();
