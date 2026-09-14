// ใส่ Sheet ID ของโปรเจกต์น้องจิว
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

    donations.forEach(d => {
        if (!d.donor_name || d.donor_name.trim() === '') return;
        const amount = parseFloat(d.amount) || 0;
        donorTotals[d.donor_name] = (donorTotals[d.donor_name] || 0) + amount;
        if (d.donor_image && d.donor_image.trim() !== '') {
            donorAvatars[d.donor_name] = d.donor_image;
        }
    });

    const sortedDonors = Object.keys(donorTotals).map(name => {
        return { name: name, total: donorTotals[name], avatar: donorAvatars[name] };
    }).sort((a, b) => b.total - a.total);

    const yard = document.getElementById('school-yard');
    
    sortedDonors.forEach((donor, index) => {
        const rank = index + 1;
        const student = document.createElement('div');
        
        student.className = `student ${rank <= 3 ? 'rank-' + rank : 'rank-normal'}`;
        
        let imgUrl = donor.avatar || `https://ui-avatars.com/api/?name=${donor.name}&background=random`;
        let crown = rank === 1 ? '👑 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : '';

        student.innerHTML = `
            <div class="name-tag">${crown}#${rank} ${donor.name}</div>
            <img src="${imgUrl}" class="sprite" alt="student">
        `;

        yard.appendChild(student);

        moveStudent(student, yard);
        
        // ⏱️ สั่งให้เดินใหม่ทุกๆ 6-9 วินาที (ช้าลงเยอะมาก)
        const walkInterval = 6000 + Math.random() * 3000;
        setInterval(() => { moveStudent(student, yard); }, walkInterval);
    });
}

function moveStudent(student, yard) {
    const maxX = yard.clientWidth - 80;
    const maxY = yard.clientHeight - 80;
    
    // บังคับไม่ให้เดินขึ้นไปทับอาคารเรียน (เว้นพื้นที่ด้านบนไว้ 220px)
    const minY = 220; 
    let randomY = minY + Math.floor(Math.random() * (maxY - minY));
    
    // ป้องกันหน้าจอมือถือเล็กเกินไปจนคำนวณติดลบ
    if (randomY < minY) randomY = minY;

    const randomX = Math.floor(Math.random() * maxX);

    const currentX = parseFloat(student.dataset.x) || 0;
    const sprite = student.querySelector('.sprite');
    
    // หันซ้ายหันขวา
    if (randomX < currentX) {
        sprite.style.transform = 'scaleX(-1)'; 
    } else {
        sprite.style.transform = 'scaleX(1)';
    }

    // เซฟตำแหน่ง
    student.dataset.x = randomX;
    
    // อัปเดต z-index ให้คนที่อยู่ด้านล่างหน้าจอ (ใกล้ตา) บังคนที่อยู่ด้านบน
    student.style.zIndex = Math.floor(randomY); 
    // ย้ายตำแหน่ง
    student.style.transform = `translate(${randomX}px, ${randomY}px)`;
}
