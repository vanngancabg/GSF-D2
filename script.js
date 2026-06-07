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

// [HÀM TIỆN ÍCH]: Chuyển chuỗi có dấu thành không dấu, viết thường, loại bỏ khoảng trắng và ký tự đặc biệt
function cleanAccountText(text) {
    let str = text;
    // Chuyển chữ có dấu thành không dấu
    str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
    str = str.replace(/[èéẹẻẽêềếệểễ]/g, "e");
    str = str.replace(/[ìíịỉĩ]/g, "i");
    str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
    str = str.replace(/[ùúụủũưừứựửữ]/g, "u");
    str = str.replace(/[ỳýỵỷỹ]/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, "a");
    str = str.replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, "e");
    str = str.replace(/[ÌÍỊỈĨ]/g, "i");
    str = str.replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, "o");
    str = str.replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, "u");
    str = str.replace(/[ỲÝỴỶỸ]/g, "y");
    str = str.replace(/Đ/g, "d");
    
    // Ép về chữ thường
    str = str.toLowerCase();
    // Xóa khoảng trắng và ký tự đặc biệt, chỉ giữ lại chữ cái a-z và số 0-9
    str = str.replace(/[^a-z0-9]/g, '');
    // Cắt chuỗi lấy tối đa 15 ký tự
    if (str.length > 15) {
        str = str.slice(0, 15);
    }
    return str;
}

// Đối với các ô Acc game: KHÔNG lọc khi đang gõ (tránh lỗi nuốt chữ của UniKey), chỉ lọc sạch khi nhấn chuột ra ngoài ô nhập
function applyAccountFieldRestriction(inputField) {
    inputField.addEventListener('blur', function() {
        this.value = cleanAccountText(this.value);
    });
}

// Áp dụng ngay cho ô nhập Acc game mặc định đầu tiên
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
    
    // Chuẩn hóa dọn dẹp sạch sẽ ô Họ Tên
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

    // Tiến hành quét dọn và chuẩn hóa sạch sẽ Từng ô nhập Acc game ngay trước khi đóng gói gửi đi
    const accountFields = document.querySelectorAll('.account-field');
    const accountsList = [];
    accountFields.forEach(f => { 
        let cleanedAcc = cleanAccountText(f.value);
        f.value = cleanedAcc; // hiển thị lại chữ đã làm sạch trên form
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
