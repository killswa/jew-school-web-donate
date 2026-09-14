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
        
        let charImg = '';
        if (rank === 1) {
            charImg = 'https://i.postimg.cc/6q4FW5Pd/Gemini-Generated-Image-84ujki84ujki84uj-removebg-preview.png'; // 👑 ใส่ลิงก์รูปอันดับ 1
        } else if (rank === 2) {
            charImg = 'https://i.postimg.cc/SRYHSNP8/Gemini-Generated-Image-nf3cwunf3cwunf3c-removebg-preview.png'; // 🕊️ ใส่ลิงก์รูปอันดับ 2
        } else if (rank === 3) {
            charImg = 'https://i.postimg.cc/nr9NFcWB/Gemini-Generated-Image-jfjnxejfjnxejfjn-removebg-preview.png'; // 🎀 ใส่ลิงก์รูปอันดับ 3
        } else {
            // 🌟 ระบบสุ่มนักเรียนชาย-หญิง สำหรับอันดับทั่วไป
            const isBoy = Math.random() < 0.5; 
            
            if (isBoy) {
                charImg = 'https://i.postimg.cc/nr9NFcWB/Gemini-Generated-Image-jfjnxejfjnxejfjn-removebg-preview.png'; // 👦 ใส่ลิงก์รูปนักเรียนชาย
            } else {
                charImg = 'https://i.postimg.cc/XqBtj7P5/Gemini-Generated-Image-x6bzg1x6bzg1x6bz-removebg-preview.png'; // 👧 ใส่ลิงก์รูปนักเรียนหญิง
            }
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
        moveStudent(student, yard);
        
        const walkInterval = 6000 + Math.random() * 3000;
        setInterval(() => { moveStudent(student, yard); }, walkInterval);
    });
}

function moveStudent(student, yard) {
    // 1. ปรับขอบขวา: หักลบความกว้างตัวละคร (300px) เพื่อไม่ให้เดินทะลุจอฝั่งขวา
    const maxX = Math.max(0, yard.clientWidth - 300); 
    
    // 2. ปรับขอบล่าง: หักลบความสูงตัวละคร (เผื่อไว้ 320px) เพื่อไม่ให้ตกขอบล่างจอ (โดยเฉพาะอันดับ 1 ที่ตัวใหญ่มาก)
    const maxY = Math.max(0, yard.clientHeight - 320); 
    
    // 3. ปรับขอบบน: ลดตัวเลขจาก 0.4 เหลือ 0.25 (25% ของหน้าจอ) เพื่อให้เดินขึ้นไปใกล้ตึกเรียนและเสาธงได้มากขึ้น
    const minY = yard.clientHeight * 0.25; 
    
    let randomY = minY + Math.floor(Math.random() * (maxY - minY));
    if (randomY < minY) randomY = minY;

    const randomX = Math.floor(Math.random() * maxX);
    const currentX = parseFloat(student.dataset.x) || 0;
    const sprite = student.querySelector('.sprite');
    
    // กลับด้านรูปภาพให้หันตามทิศที่เดิน
    if (randomX < currentX) {
        sprite.style.transform = 'scaleX(-1)';
    } else {
        sprite.style.transform = 'scaleX(1)';
    }

    student.dataset.x = randomX;
    
    // ให้คนที่อยู่ด้านล่างจอ (ค่า Y มาก) บังคนที่อยู่ด้านบน (ค่า Y น้อย)
    student.style.zIndex = Math.floor(randomY); 
    student.style.transform = `translate(${randomX}px, ${randomY}px)`;
}
