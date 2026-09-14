const SHEET_ID = '1NbgQ_QtmMVC1d6JIZoWe2MV3_JHvakyHfJwvKuNVZ9w'; 
const URL_DONATIONS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Donations`;

let yardMode = 'RANDOM'; // สถานะปัจจุบัน: RANDOM, JEW, HEART
let studentsList = []; // เก็บข้อมูลนักเรียนทั้งหมดในหน้าจอ

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
        Papa.parse(url, { download: true, header: true, complete: (results) => resolve(results.data), error: (err) => reject(err) });
    });
}

function processYardData(donations) {
    let donorTotals = {};
    let donorAvatars = {};

    donations.forEach(d => {
        if (!d.donor_name || d.donor_name.trim() === '') return;
        const amount = parseFloat(d.amount) || 0;
        donorTotals[d.donor_name] = (donorTotals[d.donor_name] || 0) + amount;
        if (d.donor_image && d.donor_image.trim() !== '') donorAvatars[d.donor_name] = d.donor_image;
    });

    const sortedDonors = Object.keys(donorTotals).map(name => {
        return { name: name, total: donorTotals[name], avatar: donorAvatars[name] };
    }).sort((a, b) => b.total - a.total);

    const yard = document.getElementById('school-yard');
    
    sortedDonors.forEach((donor, index) => {
        const rank = index + 1;
        const student = document.createElement('div');
        student.className = `student ${rank <= 3 ? 'rank-' + rank : 'rank-normal'}`;
        
        // กำหนด Index ให้นักเรียนแต่ละคนเพื่อใช้คำนวณตำแหน่งแปรแถว
        student.dataset.index = index;
        student.dataset.total = sortedDonors.length;
        
        let charImg = '';
        if (rank === 1) {
            charImg = 'https://i.postimg.cc/cLFhzG9N/Gemini-Generated-Image-84ujki84ujki84uj.jpg'; 
        } else if (rank === 2) {
            charImg = 'https://i.postimg.cc/BbfBFS64/Gemini-Generated-Image-nf3cwunf3cwunf3c.jpg'; 
        } else if (rank === 3) {
            charImg = 'https://i.postimg.cc/vHMvHZkC/Gemini-Generated-Image-jfjnxejfjnxejfjn.jpg'; 
        } else {
            const isBoy = Math.random() < 0.5; 
            charImg = isBoy 
                ? 'https://i.postimg.cc/vHMvHZkC/Gemini-Generated-Image-jfjnxejfjnxejfjn.jpg' 
                : 'https://i.postimg.cc/GmgPQJtp/Gemini-Generated-Image-x6bzg1x6bzg1x6bz.jpg';
        }

        let crown = rank === 1 ? '✨ ' : rank === 2 ? '🕊️ ' : rank === 3 ? '🎀 ' : '';

        student.innerHTML = `
            <div class="name-tag">
                <div class="rank-text">${crown}No.${rank}</div>
                <div class="name-text">${donor.name}</div>
            </div>
            <img src="${charImg}" class="sprite" alt="student">
        `;

        yard.appendChild(student);
        studentsList.push(student);
        moveStudent(student, yard);
        
        // เดินเล่นแบบสุ่มเฉพาะตอนที่สถานะเป็น RANDOM
        const walkInterval = 6000 + Math.random() * 3000;
        setInterval(() => { 
            if (yardMode === 'RANDOM') moveStudent(student, yard); 
        }, walkInterval);
    });

    // 🌟 ระบบ Master Control สั่งเปลี่ยนโหมดแปรอักษร
    setInterval(() => {
        if (yardMode === 'RANDOM') {
            yardMode = 'JEW'; // สั่งเรียงตัวอักษร JEW
        } else if (yardMode === 'JEW') {
            yardMode = 'HEART'; // สั่งเรียงรูปหัวใจ
        } else {
            yardMode = 'RANDOM'; // ปล่อยเดินเล่น
        }
        // บังคับทุกคนเดินไปเข้าแถวพร้อมกันทันที
        studentsList.forEach(s => moveStudent(s, yard));
    }, 20000); // สลับโหมดทุกๆ 20 วินาที
}

function moveStudent(student, yard) {
    const maxX = Math.max(0, yard.clientWidth - 300);
    const maxY = Math.max(0, yard.clientHeight - 320);
    const minY = yard.clientHeight * 0.25;

    let targetX, targetY;
    const index = parseInt(student.dataset.index);
    const total = parseInt(student.dataset.total);

    if (yardMode === 'RANDOM') {
        // โหมดเดินเล่น
        targetY = minY + Math.floor(Math.random() * (maxY - minY));
        targetX = Math.floor(Math.random() * maxX);
        if (targetY < minY) targetY = minY;
    } 
    else if (yardMode === 'JEW') {
        // โหมดแปรอักษร JEW (แบ่งจุดพิกัดตัวอักษร 3 ตัว)
        const jewPoints = [
            /* J */ {x: 0.1, y: 0.2}, {x: 0.2, y: 0.2}, {x: 0.3, y: 0.2}, {x: 0.2, y: 0.4}, {x: 0.2, y: 0.6}, {x: 0.1, y: 0.6},
            /* E */ {x: 0.45, y: 0.2}, {x: 0.55, y: 0.2}, {x: 0.45, y: 0.4}, {x: 0.55, y: 0.4}, {x: 0.45, y: 0.6}, {x: 0.55, y: 0.6}, {x: 0.45, y: 0.3}, {x: 0.45, y: 0.5},
            /* W */ {x: 0.7, y: 0.2}, {x: 0.75, y: 0.6}, {x: 0.8, y: 0.4}, {x: 0.85, y: 0.6}, {x: 0.9, y: 0.2}
        ];
        const pt = jewPoints[index % jewPoints.length];
        targetX = pt.x * maxX;
        targetY = minY + pt.y * (maxY - minY) * 0.8; 
    } 
    else if (yardMode === 'HEART') {
        // โหมดแปรขบวนรูปหัวใจ (ใช้สูตรคำนวณกราฟเส้นหัวใจ)
        const t = (index / total) * 2 * Math.PI;
        const scale = 12; // ขนาดความกว้างหัวใจ
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));

        targetX = (maxX / 2) + (x * scale) + 80;
        targetY = ((maxY + minY) / 2) + (y * scale);
    }

    const currentX = parseFloat(student.dataset.x) || 0;
    const sprite = student.querySelector('.sprite');
    
    // หันซ้ายขวา
    if (targetX < currentX) {
        sprite.style.transform = 'scaleX(-1)';
    } else {
        sprite.style.transform = 'scaleX(1)';
    }

    student.dataset.x = targetX;
    student.style.zIndex = Math.floor(targetY); 
    student.style.transform = `translate(${targetX}px, ${targetY}px)`;
}
