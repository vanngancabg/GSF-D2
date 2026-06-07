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
    this.value = this.value.trim(); // Chỉ cắt bỏ khoảng trắng thừa ở đầu/cuối, giữ nguyên 100% chữ có dấu
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

// ĐÃ SỬA: Hàm lọc chỉ loại bỏ khoảng trắng và giữ độ dài 15 ký tự (chấp nhận mọi ký tự đặc biệt)
function cleanAccountText(text) {
    let str = text;
    // Xóa tất cả các khoảng trắng, dấu cách thụt lề
    str = str.replace(/\s+/g, '');
    // Cắt chuỗi lấy tối đa đúng 15 ký tự theo quy ước
    if (str.length > 15) {
        str = str.slice(0, 15);
    }
    return str;
}

function applyAccountFieldRestriction(inputField) {
    // Khóa cứng trình duyệt không cho nhập quá 15 ký tự
    inputField.setAttribute("maxlength", "15");
    
    // Xóa dấu cách khoảng trắng NGAY LẬP TỨC khi gõ mà không chặn ký tự đặc biệt hay gây nuốt chữ
    inputField.addEventListener('input', function() {
        this.value = this.value.replace(/\s+/g, '');
    });
    
    // Khi rời chuột khỏi ô nhập, tiến hành kiểm tra lại một lần nữa
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
            filteredMembersData = data; 
            currentPage = 1; 
            
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

function isMemberApproved(member) {
    return (member.status === true || member.status === "TRUE" || member.status === "Rồi");
}

function renderTable() {
    tableBody.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    if(filteredMembersData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #64748b;">Không tìm thấy kết quả phù hợp.</td></tr>';
        return;
    }
    
    filteredMembersData.sort((a, b) => {
        let aApproved = isMemberApproved(a);
        let bApproved = isMemberApproved(b);
        if (!aApproved && bApproved) return -1;
        if (aApproved && !bApproved) return 1;
        return 0;
    });
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    const pageData = filteredMembersData.slice(startIndex, endIndex);
    
    pageData.forEach((member, index) => {
        const row = document.createElement('tr');
        let isApproved = isMemberApproved(member);
        let statusHtml = isApproved 
            ? '<span class="status-badge approved">✔ Đã duyệt</span>' 
            : '<span class="status-badge pending">⏳ Chờ duyệt</span>';

        if (!isApproved) row.className = 'row-pending';

        let zaloStr = String(member.zalo || '').trim();
        if (zaloStr.length === 9 && /^[35789]/.test(zaloStr)) {
            zaloStr = '0' + zaloStr;
        }

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

    setupPaginationControls();
}

function setupPaginationControls() {
    const totalPages = Math.ceil(filteredMembersData.length / rowsPerPage);
    if (totalPages <= 1) return;

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

searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    filteredMembersData = allMembersData.filter(m => 
        String(m.accounts || '').toLowerCase().includes(query)
    );
    currentPage = 1; 
    renderTable();   
});

// ==========================================
// 4. THAO TÁC GỬI ĐĂNG KÝ MỚI
// ==========================================
form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    let rawName = fullNameInput.value.trim();

    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(rawName)) {
        alert("Lỗi: Họ và tên không được chứa số hoặc ký tự đặc biệt!");
        return;
    }
    if (rawName === "") {
        alert("Vui lòng nhập họ và tên hợp lệ!");
        return;
    }

    const birth = document.getElementById('birthYear').value;
    const zaloVal = document.getElementById('zalo').value;
    
    if(birth.length !== 4 || zaloVal.length !== 10) {
        alert("Vui lòng kiểm tra lại! Năm sinh phải đủ 4 số, Số Zalo phải đủ 10 số.");
        return;
    }

    const accountFields = document.querySelectorAll('.account-field');
    const accountsList = [];
    let hasDuplicate = false;
    let duplicateName = "";

    accountFields.forEach(f => { 
        let cleanedAcc = cleanAccountText(f.value);
        f.value = cleanedAcc;
        if(cleanedAcc !== "") {
            // Kiểm tra trùng tài khoản (không phân biệt hoa thường)
            let isExist = allMembersData.some(m => String(m.accounts || '').toLowerCase() === cleanedAcc.toLowerCase());
            if (isExist) {
                hasDuplicate = true;
                duplicateName = f.value;
            }
            accountsList.push(cleanedAcc); 
        }
    });

    if (hasDuplicate) {
        alert(`Lỗi đăng ký: Tài khoản game "${duplicateName}" đã tồn tại trong danh sách của nhóm! Vui lòng kiểm tra lại.`);
        return;
    }

    if(accountsList.length === 0) {
        alert("Vui lòng nhập ít nhất một tên Acc game hợp lệ!");
        return;
    }

    const submitBtn = form.querySelector('.submit-main-btn');
    submitBtn.innerText = 'Đang đồng bộ đăng ký...';
    submitBtn.disabled = true;

    const newMember = {
        fullName: rawName,
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
        alert('Đăng ký thành công! Dữ liệu đã truyền trực tiếp lên trang chủ.');
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
