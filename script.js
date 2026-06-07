// ĐỔI ĐƯỜNG LINK DƯỚI ĐÂY THÀNH LINK WEB APP GOOGLE SHEETS CỦA BẠN (GIỮ NGUYÊN DẤU NGOẶC KÉP)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3ukMrZ0D17rGEXwxZ3f2jzMq_EEnj6goi_z_VrobigC-J4QZqwxpEL4HNDzSKkzQ/exec";

const form = document.getElementById('memberForm');
const tableBody = document.getElementById('memberTableBody');
const accountContainer = document.getElementById('accountInputContainer');
const addAccountBtn = document.getElementById('addAccountBtn');
const searchInput = document.getElementById('searchAccount');

let allMembersData = []; 

// ==========================================
// 1. ÉP KIỂU VÀ CHUẨN HÓA DỮ LIỆU NHẬP LIỆU
// ==========================================

// [Họ và Tên]: Cho phép gõ tự do, tự động lọc sạch số/ký tự đặc biệt khi rời ô nhập.
const fullNameInput = document.getElementById('fullName');
fullNameInput.addEventListener('blur', function() {
    this.value = this.value.replace(/[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠỢ̣̣̣̣̣́́̉̃́̉̃́̀̉̃́̀́̉̃́̀́̉̃́̉̃́ Gg]/g, '').trim();
});

// [Năm sinh]: Chỉ được gõ số, tối đa 4 ký tự
document.getElementById('birthYear').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length > 4) this.value = this.value.slice(0, 4);
});

// [Số điện thoại Zalo]: Chỉ gõ số, tối đa 10 ký tự, bắt đầu bằng số 0
document.getElementById('zalo').addEventListener('input', function() {
    let val = this.value.replace(/[^0-9]/g, '');
    if (val.length > 0 && val[0] !== '0') val = '';
    if (val.length > 10) val = val.slice(0, 10);
    this.value = val;
});

// [HÀM TIỆN ÍCH]: Chốt chặn tối cao cho Acc Game - Chỉ cho gõ chữ thường không dấu và số, tối đa đúng 15 ký tự
function applyAccountFieldRestriction(inputField) {
    // Thuộc tính chặn độ dài tối đa 15 ký tự trực tiếp từ trình duyệt
    inputField.setAttribute("maxlength", "15");

    // BƯỚC 1: Chặn ngay khi vừa nhấn phím xuống (Chặn đứng phím tạo dấu của UniKey)
    inputField.addEventListener('keydown', function(e) {
        // Cho phép các phím chức năng hoạt động (Xóa Backspace, Delete, Mũi tên, Tab...)
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
            return;
        }

        // Tạo danh sách các phím tạo dấu Telex tiếng Việt cần chặn đứng: 
        // s, f, r, x, j (dấu), w (ư,ơ), a (nếu gõ thêm để thành â), e, o, d (thành đ)
        const telexKeys = ['s', 'f', 'r', 'x', 'j', 'w'];
        if (telexKeys.includes(e.key.toLowerCase())) {
            // Kiểm tra xem ký tự trước đó có trùng để tạo dấu không (như aa, ee, oo, dd)
            const lastChar = this.value.slice(-1).toLowerCase();
            if ((e.key === 'a' && lastChar === 'a') || 
                (e.key === 'e' && lastChar === 'e') || 
                (e.key === 'o' && lastChar === 'o') || 
                (e.key === 'd' && lastChar === 'd')) {
                e.preventDefault(); // Chặn đứng không cho gõ phím lặp tạo dấu
                return;
            }
            
            // Chặn luôn các phím dấu đơn lẻ để UniKey không thể bỏ dấu vào chữ
            e.preventDefault();
            return;
        }

        // Chặn tất cả những gì không phải là chữ thường tiếng Anh (a-z) và số (0-9)
        // Chặn luôn chữ viết HOA (A-Z) và Khoảng trắng (Space)
        if (!/^[a-z0-9]$/.test(e.key)) {
            e.preventDefault();
        }
    });

    // BƯỚC 2: Phòng hờ trường hợp copy-paste hoặc bộ gõ đi đường vòng, ép quét sạch lần nữa
    inputField.addEventListener('input', function() {
        // Bẻ thẳng chữ hoa thành chữ thường, xóa sạch ký tự lạ và chữ có dấu
        let val = this.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (val.length > 15) {
            val = val.slice(0, 15);
        }
        this.value = val;
    });
}

// Áp dụng ngay quy tắc tối cao cho ô nhập Acc game mặc định đầu tiên
const firstAccountField = document.querySelector('.account-field');
if (firstAccountField) {
    applyAccountFieldRestriction(firstAccountField);
}


// ==========================================
// 2. THÊM / XÓA Ô NHẬP LIỆU ACC GAME
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
    
    const newAccountField = wrapper.querySelector('.account-field');
    applyAccountFieldRestriction(newAccountField);

    wrapper.querySelector('.remove-acc-btn').addEventListener('click', function() {
        wrapper.remove();
    });
});

// ==========================================
// 3. TẢI VÀ ĐỒNG BỘ DỮ LIỆU THỐNG KÊ
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
            console.error('Lỗi tải dữ liệu:', error);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Không thể kết nối đến dữ liệu Google Sheets!</td></tr>';
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
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #64748b;">Không tìm thấy kết quả phù hợp.</td></tr>';
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
        if (zaloStr.length === 9 && /^[35789]/.test(zaloStr)) {
            zaloStr = '0' + zaloStr;
        }

        row.innerHTML = `
            <td style="color: #64748b; font-weight: 500;">${index + 1}</td>
            <td style="font-weight: 500;">${member.fullName || ''}</td>
            <td>${member.birthYear || ''}</td>
            <td>
                <div class="acc-cell">
                    <span class="acc-name">${member.accounts || ''}</span>
                    <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${member.accounts}')" title="Copy tài khoản">📋</button>
                </div>
            </td>
            <td><a class='zalo-link-row' href='https://zalo.me/${zaloStr}' target='_blank'>💬 ${zaloStr}</a></td>
            <td>${statusHtml}</td>
        `;
        tableBody.appendChild(row);
    });
}

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Đã copy tài khoản: ${text}`);
    }).catch(err => console.error('Lỗi sao chép:', err));
}

searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    const filtered = allMembersData.filter(m => String(m.accounts || '').toLowerCase().includes(query));
    renderTable(filtered);
});

// ==========================================
// 4. THAO TÁC GỬI ĐĂNG KÝ MỚI
// ==========================================
form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    let finalCleanName = fullNameInput.value.replace(/[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠỢ̣̣̣̣̣́́̉̃́̉̃́̀̉̃́̀́̉̃́̀́̉̃́̉̃́ Gg]/g, '').trim();
    fullNameInput.value = finalCleanName;

    const birth = document.getElementById('birthYear').value;
    const zaloVal = document.getElementById('zalo').value;
    
    if(finalCleanName === "") {
        alert("Vui lòng nhập họ và tên hợp lệ!");
        return;
    }
    if(birth.length !== 4 || zaloVal.length !== 10) {
        alert("Vui lòng kiểm tra lại! Năm sinh phải đủ 4 số, Số Zalo phải đủ 10 số.");
        return;
    }

    const submitBtn = form.querySelector('.submit-main-btn');
    submitBtn.innerText = 'Đang đồng bộ đăng ký...';
    submitBtn.disabled = true;

    const accountFields = document.querySelectorAll('.account-field');
    const accountsList = [];
    accountFields.forEach(f => { 
        let cleanedAcc = f.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        if(cleanedAcc !== "") {
            accountsList.push(cleanedAcc); 
        }
    });

    if(accountsList.length === 0) {
        alert("Vui lòng nhập ít nhất một tên Acc game hợp lệ!");
        submitBtn.innerText = 'Gửi Đăng Ký Tham Gia';
        submitBtn.disabled = false;
        return;
    }

    const newMember = {
        fullName: finalCleanName,
        birthYear: birth,
        accounts: accountsList,
        zalo: zaloVal
    };

    fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(newMember) 
    })
    .then(() => {
        alert('Đăng ký thành công! Hệ thống đang xử lý phân dòng dữ liệu trên Google Sheets.');
        form.reset();
        document.querySelectorAll('.account-input-wrapper').forEach((w, idx) => { 
            if(idx > 0) w.remove(); 
        });
        submitBtn.innerText = 'Gửi Đăng Ký Tham Gia';
        submitBtn.disabled = false;
        setTimeout(loadMembers, 2500);
    })
    .catch(error => {
        console.error('Lỗi gửi form:', error);
        alert('Có lỗi hệ thống kết nối xảy ra!');
        submitBtn.innerText = 'Gửi Đăng Ký Tham Gia';
        submitBtn.disabled = false;
    });
});

loadMembers();
