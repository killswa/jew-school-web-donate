// ⚠️ อย่าลืมใส่ Sheet ID ของคุณ (รหัสเดียวกับที่ใช้ใน script.js)
const SHEET_ID = '1NbgQ_QtmMVC1d6JIZoWe2MV3_JHvakyHfJwvKuNVZ9w'; 

const URL_DONATIONS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Donations`;

document.addEventListener('DOMContentLoaded', () => {
    fetchCSV(URL_DONATIONS).then(data => {
        document.getElementById('loading-yard').style.display = 'none';
        processYardData(data);
    }).catch(err => {
        document.getElementById('loading-yard').innerText = '❌ โหลดข้อมูลไม่สำเร็จ';
    });
});

function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true, header: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
        });
    });
}

function processYardData(donations) {
    let donorTotals = {};
    let donorAvatars = {};

    // คำนวณยอดรวมและเก็บรูป
    donations.forEach(d => {
        if (!d.donor_name || d.donor_name.trim() === '') return;
        const amount = parseFloat(d.amount) || 0;
        donorTotals[d.donor_name] = (donorTotals[d.donor_name] || 0) + amount;
        if (d.donor_image && d.donor_image.trim() !== '') {
            donorAvatars[d.donor_name] = d.donor_image;
        }
    });

    // เรียงลำดับจากมากไปน้อย
    const sortedDonors = Object.keys(donorTotals).map(name => {
        return { name: name, total: donorTotals[name], avatar: donorAvatars[name] };
    }).sort((a, b) => b.total - a.total);

    const yard = document.getElementById('school-yard');
    
    // สร้างตัวละครนักเรียน
    sortedDonors.forEach((donor, index) => {
        const rank = index + 1;
        const student = document.createElement('div');
        
        // กำหนดคลาสออร่าตามอันดับ
        student.className = `student ${rank <= 3 ? 'rank-' + rank : 'rank-normal'}`;
        
        // ถ้ารูปไม่มี ให้ใช้รูป Avatar อัตโนมัติ หรือถ้าเป็น Top 3 จะมีไอเทมพิเศษ
        let imgUrl = donor.avatar || `https://ui-avatars.com/api/?name=${donor.name}&background=random`;
        let crown = rank === 1 ? '👑 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : '🎒 ';

        student.innerHTML = `
            <div class="name-tag">${crown}#${rank} ${donor.name}</div>
            <img src="${imgUrl}" class="sprite" alt="student">
        `;

        yard.appendChild(student);

        // ให้ตำแหน่งเริ่มต้น (สุ่ม)
        moveStudent(student, yard);
        
        // สั่งให้เดินใหม่ทุกๆ 3-5 วินาที
        const walkInterval = 3000 + Math.random() * 2000;
        setInterval(() => { moveStudent(student, yard); }, walkInterval);
    });
}

function moveStudent(student, yard) {
    // คำนวณพื้นที่ของสนามหญ้า (เผื่อขอบไว้ไม่ให้เดินทะลุจอ)
    const maxX = yard.clientWidth - 80;
    const maxY = yard.clientHeight - 80;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    // เช็กว่าเดินไปทางซ้ายหรือขวา เพื่อหันหน้าให้ถูกทาง
    const currentX = parseFloat(student.dataset.x) || 0;
    const sprite = student.querySelector('.sprite');
    
    if (randomX < currentX) {
        sprite.style.transform = 'scaleX(-1)'; // หันซ้าย
    } else {
        sprite.style.transform = 'scaleX(1)'; // หันขวา
    }

    // เซฟตำแหน่งล่าสุด และสั่งให้เดินไปตำแหน่งใหม่
    student.dataset.x = randomX;
    student.style.transform = `translate(${randomX}px, ${randomY}px)`;
}
