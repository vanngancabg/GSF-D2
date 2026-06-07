// ĐỔI ĐƯỜNG LINK DƯỚI ĐÂY THÀNH LINK WEB APP GOOGLE SHEETS CỦA BẠN (GIỮ NGUYÊN DẤU NGOẶC KÉP)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbykEzSUm8bnmxp5ypKyJcvv7ugXHIXcWBmF-R4UmS5xg7Q-qi4atCvAn0DBRvCGuJ4s4Q/exec";

const form = document.getElementById('memberForm');
const tableBody = document.getElementById('memberTableBody');
const accountContainer = document.getElementById('accountInputContainer');
const addAccountBtn = document.getElementById('addAccountBtn');
const searchInput = document.getElementById('searchAccount');
const paginationContainer = document.getElementById('pagination');

let allMembersData = []; 
let filteredMembersData = []; // Lưu trữ dữ liệu sau khi lọc tìm kiếm
let currentPage = 1;
const rowsPerPage = 20; // Giới hạn đúng 20 dòng mỗi trang

// ==========================================
// 1. ÉP KIỂU VÀ CHUẨN HÓA DỮ LIỆU NHẬP LIỆU
// ==========================================

const fullNameInput = document.getElementById('fullName');
fullNameInput.addEventListener('blur', function() {
    this.value = this.value.replace(/[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠỢ̣̣̣̣̣́́̉̃́̉̃́̀̉̃́̀́̉̃́̀́̉̃́̉̃́ Gg]/g, '').trim();
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

function cleanAccountText(text) {
    let str = text;
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
    
    str = str.toLowerCase();
    str = str.replace(/[^a-z0-9]/g, '');
    if (str.length > 15) {
        str = str.slice(0, 15);
    }
    return str;
}

function applyAccountFieldRestriction(inputField) {
    inputField.setAttribute("maxlength", "15");
    inputField.addEventListener('input', function() {
        this.value = this.value.replace(/\s+/g, '');
    });
    inputField.addEventListener('blur', function() {
        this.value = cleanAccountText(this.value);
    });
}

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
// 3. TẢI, PHÂN TRANG VÀ ĐỒNG BỘ THỐNG KÊ
// ==========================================
function loadMembers() {
    fetch(SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            allMembersData = data;
            filteredMembersData = data; // Ban đầu dữ liệu lọc bằng dữ liệu gốc
            currentPage = 1; // Reset về trang 1
            
            updateDashboardCounters(data);
            renderTable();
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

// Hàm hiển thị dữ liệu bảng kết hợp Phân Trang 20 dòng
function renderTable() {
    tableBody.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    if(filteredMembersData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #64748b;">Không tìm thấy kết quả phù hợp.</td></tr>';
        return;
    }
    
    // Tính toán dòng bắt đầu và dòng kết thúc của trang hiện tại
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    // Cắt mảng lấy đúng tối đa 20 dòng để hiển thị
    const pageData = filteredMembersData.slice(startIndex, endIndex);
    
    pageData.forEach((member, index) => {
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

        // Số thứ tự thực tế = Vị trí bắt đầu của trang + Vị trí trong trang + 1
        const actualSTT = startIndex + index + 1;

        row.innerHTML = `
            <td style="color: #64748b; font-weight: 500;">${actualSTT}</td>
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

    // Tạo thanh điều hướng nút phân trang
    setupPaginationControls();
}

// Hàm render hệ thống nút Next / Previous và số trang
function setupPaginationControls() {
    const totalPages = Math.ceil(filteredMembersData.length / rowsPerPage);
    if (totalPages <= 1) return; // Nếu chỉ có 1 trang hoặc ít hơn 20 dòng thì không cần hiện nút

    // 1. Nút TRƯỚC (Previous)
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '◀ Trước';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // 2. Các nút số trang cụ thể
    for (let i = 1; i <= totalPages; i++) {
        const pageNumBtn = document.createElement('button');
        pageNumBtn.className = `page-btn ${currentPage === i ? 'active' : ''}`;
        pageNumBtn.innerText = i;
        pageNumBtn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
        });
        paginationContainer.appendChild(pageNumBtn);
    }

    // 3. Nút SAU (Next)
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = 'Sau ▶';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Đã copy tài khoản: ${text}`);
    }).catch(err => console.error('Lỗi sao chép:', err));
}

// THANH LỌC TÌM KIẾM TOÀN BỘ DỮ LIỆU
searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    
    // Quét bộ lọc trên toàn bộ mảng dữ liệu gốc ban đầu
    filteredMembersData = allMembersData.filter(m => 
        String(m.accounts || '').toLowerCase().includes(query)
    );
    
    currentPage = 1; // Gõ tìm kiếm thì luôn đẩy về trang đầu tiên
    renderTable();   // Vẽ lại bảng theo tập dữ liệu đã lọc
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
        let cleanedAcc = cleanAccountText(f.value);
        f.value = cleanedAcc;
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
