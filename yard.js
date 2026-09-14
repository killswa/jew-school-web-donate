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
            charImg = 'https://i.postimg.cc/6q4FW5Pd/Gemini-Generated-Image-84ujki84ujki84uj-removebg-preview.png'; 
        } else if (rank === 2) {
            charImg = 'https://i.postimg.cc/SRYHSNP8/Gemini-Generated-Image-nf3cwunf3cwunf3c-removebg-preview.png'; 
        } else if (rank === 3) {
            charImg = 'https://i.postimg.cc/nr9NFcWB/Gemini-Generated-Image-jfjnxejfjnxejfjn-removebg-preview.png'; 
        } else {
            const isBoy = Math.random() < 0.5; 
            charImg = isBoy 
                ? 'https://i.postimg.cc/nr9NFcWB/Gemini-Generated-Image-jfjnxejfjnxejfjn-removebg-preview.png' 
                : 'https://i.postimg.cc/XqBtj7P5/Gemini-Generated-Image-x6bzg1x6bzg1x6bz-removebg-preview.png';
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
            yardMode = 'JEW'; // กลับมาแปรอักษร JEW
        } else if (yardMode === 'JEW') {
            yardMode = 'HEART';
        } else {
            yardMode = 'RANDOM';
        }
        // บังคับทุกคนเดินไปเข้าแถวพร้อมกันทันที
        studentsList.forEach(s => moveStudent(s, yard));
    }, 20000);
}

function moveStudent(student, yard) {
    const maxX = Math.max(0, yard.clientWidth - 300);
    const maxY = Math.max(0, yard.clientHeight - 320);
    const minY = yard.clientHeight * 0.25;

    let targetX, targetY;
    const index = parseInt(student.dataset.index);
    const total = parseInt(student.dataset.total);

    // ค่ากระจายตัว ให้นักเรียนยืนเหลื่อมกัน
    const offsetX = (Math.random() - 0.5) * 80; 
    const offsetY = (Math.random() - 0.5) * 60;  

    if (yardMode === 'RANDOM') {
        targetY = minY + Math.floor(Math.random() * (maxY - minY));
        targetX = Math.floor(Math.random() * maxX);
        if (targetY < minY) targetY = minY;
    } 
    else if (yardMode === 'JEW') {
        // 🌟 พิกัด JEW กระจายกว้างเต็มหน้าจอ
        const jewPoints = [
            /* --- ตัว J --- */
            {x: 0.05, y: 0.1}, {x: 0.15, y: 0.1}, {x: 0.25, y: 0.1}, 
            {x: 0.15, y: 0.3}, {x: 0.15, y: 0.5},                    
            {x: 0.15, y: 0.8}, {x: 0.05, y: 0.7},                    

            /* --- ตัว E --- */
            {x: 0.40, y: 0.1}, {x: 0.50, y: 0.1}, {x: 0.60, y: 0.1}, 
            {x: 0.40, y: 0.45}, {x: 0.50, y: 0.45},                  
            {x: 0.40, y: 0.8}, {x: 0.50, y: 0.8}, {x: 0.60, y: 0.8}, 
            {x: 0.40, y: 0.25}, {x: 0.40, y: 0.65},                  

            /* --- ตัว W --- */
            {x: 0.72, y: 0.1}, {x: 0.76, y: 0.5}, {x: 0.80, y: 0.8}, 
            {x: 0.84, y: 0.5},                                       
            {x: 0.88, y: 0.8}, {x: 0.92, y: 0.5}, {x: 0.96, y: 0.1}  
        ];
        
        const pt = jewPoints[index % jewPoints.length];
        targetX = (pt.x * maxX) + offsetX;
        targetY = minY + (pt.y * (maxY - minY)) + offsetY; 
    } 
    else if (yardMode === 'HEART') {
        const t = (index / total) * 2 * Math.PI;
        const scale = 20; 
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));

        targetX = (maxX / 2) + (x * scale) + 80 + offsetX;
        targetY = ((maxY + minY) / 2) + (y * scale) + offsetY;
    }

    const currentX = parseFloat(student.dataset.x) || 0;
    const sprite = student.querySelector('.sprite');
    
    if (targetX < currentX) {
        sprite.style.transform = 'scaleX(-1)';
    } else {
        sprite.style.transform = 'scaleX(1)';
    }

    student.dataset.x = targetX;
    student.style.zIndex = Math.floor(targetY); 
    student.style.transform = `translate(${targetX}px, ${targetY}px)`;
}
