// ĐỔI LINK NÀY THÀNH LINK WEB APP APPS SCRIPT MỚI CỦA BẠN ĐÃ CẬP NHẬT Ở BƯỚC 1
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3ukMrZ0D17rGEXwxZ3f2jzMq_EEnj6goi_z_VrobigC-J4QZqwxpEL4HNDzSKkzQ/exec";

const form = document.getElementById('memberForm');
const tableBody = document.getElementById('memberTableBody');
const accountContainer = document.getElementById('accountInputContainer');
const addAccountBtn = document.getElementById('addAccountBtn');
const searchInput = document.getElementById('searchAccount');

let allMembersData = []; // Nơi lưu trữ tạm thời danh sách tải về phục vụ việc tìm kiếm lọc

// ==========================================
// 1. CÁC QUY TẮC ÉP KIỂU KHI GÕ (YÊU CẦU 2)
// ==========================================

// [Họ và tên]: Chỉ cho phép nhập ký tự chữ (bao gồm cả Tiếng Việt có dấu) và khoảng trắng
document.getElementById('fullName').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠỢ̣̣̣̣̣́́̉̃́̉̃́̀̉̃́̀́̉̃́̀́̉̃́̉̃́ Gg]/g, '');
});

// [Năm sinh]: Chỉ được gõ số, tối đa đúng 4 ký tự
document.getElementById('birthYear').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, ''); // Xóa toàn bộ ký tự không phải số
    if (this.value.length > 4) {
        this.value = this.value.slice(0, 4); // Chặn không cho vượt quá 4 số
    }
});

// [Số điện thoại Zalo]: Chỉ được gõ số, tối đa 10 số, BẮT BUỘC ký tự đầu tiên phải là số 0
document.getElementById('zalo').addEventListener('input', function(e) {
    let val = this.value.replace(/[^0-9]/g, ''); // Xóa toàn bộ ký tự không phải số
    
    // Nếu có ký tự đầu tiên mà ký tự đó khác '0' -> Xóa luôn, buộc phải gõ số 0 đầu tiên
    if (val.length > 0 && val[0] !== '0') {
        val = '';
    }
    
    if (val.length > 10) {
        val = val.slice(0, 10); // Chặn không cho vượt quá 10 số
    }
    this.value = val;
});


// ==========================================
// 2. XỬ LÝ NÚT CỘNG THÊM Ô NHẬP ACC GAME (YÊU CẦU 1)
// ==========================================
addAccountBtn.addEventListener('click', function() {
    const wrapper = document.createElement('div');
    wrapper.className = 'account-input-wrapper';
    wrapper.style.marginTop = '8px';
    
    wrapper.innerHTML = `
        <input type="text" class="account-field" placeholder="Nhập tên Acc game khác" required>
        <button type="button" class="remove-acc-btn">-</button>
    `;
    
    accountContainer.appendChild(wrapper);
    
    // Xử lý sự kiện xóa ô nhập này nếu bấm nút trừ "-"
    wrapper.querySelector('.remove-acc-btn').addEventListener('click', function() {
        wrapper.remove();
    });
});


// ==========================================
// 3. TẢI VÀ HIỂN THỊ DANH SÁCH + TÌM KIẾM (YÊU CẦU 3)
// ==========================================
function loadMembers() {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải danh sách từ Google Sheets...</td></tr>';
    
    fetch(SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            allMembersData = data; // Lưu trữ dữ liệu gốc phục vụ việc tìm kiếm
            renderTable(allMembersData);
        })
        .catch(error => {
            console.error('Lỗi:', error);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Không thể tải dữ liệu!</td></tr>';
        });
}

// Hàm render dữ liệu ra bảng giao diện hiển thị
function renderTable(dataList) {
    tableBody.innerHTML = '';
    if(dataList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không tìm thấy kết quả hoặc danh sách trống.</td></tr>';
        return;
    }
    
    dataList.forEach(member => {
        const row = document.createElement('tr');
        
        let statusHtml = '';
        if (member.status === true || member.status === "TRUE" || member.status === "Rồi") {
            statusHtml = '<span style="color: #10b981; font-weight: bold;">✔ Đã duyệt</span>';
        } else {
            statusHtml = '<span style="color: #ef4444;">❌ Chưa</span>';
        }

        let zaloStr = String(member.zalo || '').trim();
        if (zaloStr.length === 9 && /^[35789]/.test(zaloStr)) {
            zaloStr = '0' + zaloStr;
        }

        row.innerHTML = `
            <td>${member.fullName || ''}</td>
            <td>${member.birthYear || ''}</td>
            <td class="acc-column-highlight">${member.accounts || ''}</td>
            <td><a class='zalo-link' href='https://zalo.me/${zaloStr}' target='_blank'>${zaloStr}</a></td>
            <td style="text-align:center;">${statusHtml}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Bắt sự kiện gõ vào thanh tìm kiếm lọc theo cột "Tên Acc" (Yêu cầu số 3)
searchInput.addEventListener('input', function() {
    const filterValue = this.value.toLowerCase().trim();
    
    // Lọc mảng dữ liệu gốc, chỉ lấy các hàng có chứa chuỗi tìm kiếm trong cột accounts
    const filteredData = allMembersData.filter(member => {
        const accName = String(member.accounts || '').toLowerCase();
        return accName.includes(filterValue);
    });
    
    renderTable(filteredData); // Hiển thị mảng đã lọc
});


// ==========================================
// 4. GỬI DỮ LIỆU ĐĂNG KÝ LÊN GOOGLE SHEETS
// ==========================================
form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Kiểm tra nhanh điều kiện năm sinh và sđt trước khi gửi
    const birthYearInput = document.getElementById('birthYear').value;
    const zaloInput = document.getElementById('zalo').value;
    
    if(birthYearInput.length !== 4) {
        alert("Năm sinh bắt buộc phải nhập đủ 4 chữ số!");
        return;
    }
    if(zaloInput.length !== 10) {
        alert("Số điện thoại Zalo bắt buộc phải nhập đủ 10 chữ số!");
        return;
    }

    const submitBtn = form.querySelector('.submit-main-btn');
    submitBtn.innerText = 'Đang gửi...';
    submitBtn.disabled = true;

    // Thu thập tất cả các giá trị từ các ô nhập Acc game đang hiển thị
    const accountFields = document.querySelectorAll('.account-field');
    const accountsList = [];
    accountFields.forEach(field => {
        if(field.value.trim() !== "") {
            accountsList.push(field.value.trim());
        }
    });

    const newMember = {
        fullName: document.getElementById('fullName').value.trim(),
        birthYear: birthYearInput,
        accounts: accountsList, // Truyền một mảng các Acc game
        zalo: zaloInput
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMember)
    })
    .then(() => {
        alert('Đăng ký thành công! Đã tự động phân tách mỗi Acc thành một hàng riêng biệt trên Google Sheets.');
        
        // Reset form và dọn dẹp các ô nhập Acc game cộng thêm (chỉ giữ lại ô đầu)
        form.reset();
        const wrappers = document.querySelectorAll('.account-input-wrapper');
        for(let i = 1; i < wrappers.length; i++) {
            wrappers[i].remove();
        }
        
        submitBtn.innerText = 'Đăng ký';
        submitBtn.disabled = false;
        
        // Đợi 2.5 giây rồi tải lại danh sách cập nhật mới nhất
        setTimeout(loadMembers, 2500);
    })
    .catch(error => {
        console.error('Lỗi gửi dữ liệu:', error);
        alert('Có lỗi xảy ra khi gửi đăng ký!');
        submitBtn.innerText = 'Đăng ký';
        submitBtn.disabled = false;
    });
});

// Kích hoạt chạy hàm tải danh sách ngay khi vừa mở trang web lên
loadMembers();
