
const SCRIPT_URL = "DAN_LINK_GOOGLE_SCRIPT_VAO_DAY";

const form = document.getElementById("memberForm");
const tableBody = document.getElementById("memberTableBody");

async function loadMembers(){

tableBody.innerHTML = "<tr><td colspan='4'>Đang tải dữ liệu...</td></tr>";

try{

const response = await fetch(SCRIPT_URL);
const data = await response.json();

tableBody.innerHTML = "";

data.reverse().forEach(member => {

const row = document.createElement("tr");

row.innerHTML = `
<td>${member.fullName}</td>
<td>${member.birthYear}</td>
<td>${member.accounts}</td>
<td>
<a class="zalo-link" href="https://zalo.me/${member.zalo}" target="_blank">
${member.zalo}
</a>
</td>
`;

tableBody.appendChild(row);

});

}catch(error){

tableBody.innerHTML = "<tr><td colspan='4'>Không tải được dữ liệu.</td></tr>";

}

}

form.addEventListener("submit", async function(event){

event.preventDefault();

const memberData = {
fullName: document.getElementById("fullName").value,
birthYear: document.getElementById("birthYear").value,
accounts: document.getElementById("accounts").value,
zalo: document.getElementById("zalo").value
};

try{

await fetch(SCRIPT_URL, {
method:"POST",
body: JSON.stringify(memberData)
});

alert("Đăng ký thành công");

form.reset();

loadMembers();

}catch(error){

alert("Không gửi được dữ liệu");

}

});

loadMembers();
