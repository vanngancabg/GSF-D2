// ĐỔI LINK NÀY THÀNH LINK WEB APP APPS SCRIPT CỦA BẠN
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3ukMrZ0D17rGEXwxZ3f2jzMq_EEnj6goi_z_VrobigC-J4QZqwxpEL4HNDzSKkzQ/exec";

const form = document.getElementById('memberForm');
const tableBody = document.getElementById('memberTableBody');

// Hàm tải dữ liệu từ Google Sheets về hiển thị lên bảng
function loadMembers() {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải danh sách từ Google Sheets...</td></tr>';
    
    fetch(SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = '';
            if(data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có thành viên nào.</td></tr>';
                return;
            }
            
            data.forEach(member => {
                const row = document.createElement('tr');
                
                // Kiểm tra trạng thái cột E từ Google Sheets để hiển thị đẹp hơn
                let statusHtml = '';
                if (member.status === true || member.status === "TRUE" || member.status === "Rồi") {
                    statusHtml = '<span style="color: #10b981; font-weight: bold;">✔ Đã duyệt</span>';
                } else {
                    statusHtml = '<span style="color: #ef4444;">❌ Chưa</span>';
                }

                row.innerHTML = `
                    <td>${member.fullName || ''}</td>
                    <td>${member.birthYear || ''}</td>
                    <td>${member.accounts || ''}</td>

// Chuyển thành chuỗi và ép kiểu chuỗi chữ để xử lý
let zaloStr = String(member.zalo || '').trim();
// Nếu số điện thoại bắt đầu bằng số 3, 5, 7, 8, 9 và chỉ có 9 chữ số, tự động bù số 0 vào đầu
if (zaloStr.length === 9 && /^[35789]/.test(zaloStr)) {
    zaloStr = '0' + zaloStr;
}

row.innerHTML = `
    <td>${member.fullName || ''}</td>
    <td>${member.birthYear || ''}</td>
    <td>${member.accounts || ''}</td>
    <td><a class='zalo-link' href='https://zalo.me/${zaloStr}' target='_blank'>${zaloStr}</a></td>
    <td style="text-align:center;">${statusHtml}</td>
`;

                    <td style="text-align:center;">${statusHtml}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Lỗi:', error);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Không thể tải dữ liệu!</td></tr>';
        });
}

// Xử lý sự kiện khi bấm nút "Thêm thành viên" gửi lên Google Sheets
form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // SỬA TẠI ĐÂY: Lấy trực tiếp thẻ button thuộc form thay vì tìm class .submit-btn
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerText = 'Đang gửi...';
    submitBtn.disabled = true;

    const newMember = {
        fullName: document.getElementById('fullName').value,
        birthYear: document.getElementById('birthYear').value,
        accounts: document.getElementById('accounts').value,
        zalo: document.getElementById('zalo').value
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Sử dụng chế độ này để tránh lỗi bảo mật CORS khi gọi qua App Script
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMember)
    })
    .then(() => {
        alert('Đăng ký thành công! Dữ liệu đã được gửi lên Google Sheets.');
        form.reset();
        submitBtn.innerText = 'Đăng ký'; // Sửa lại chữ hiển thị ban đầu của nút
        submitBtn.disabled = false;
        // Đợi 2 giây rồi load lại bảng để Google kịp cập nhật dữ liệu mới
        setTimeout(loadMembers, 2000);
    })
    .catch(error => {
        console.error('Lỗi gửi dữ liệu:', error);
        alert('Có lỗi xảy ra khi đăng ký!');
        submitBtn.innerText = 'Đăng ký';
        submitBtn.disabled = false;
    });
});

// Chạy hàm tải danh sách ngay khi trang web vừa mở
loadMembers();
