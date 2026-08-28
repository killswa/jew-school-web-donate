// ⚠️ 1. เอา ID ดั้งเดิมจาก URL ด้านบน มาใส่ในเครื่องหมายคำพูดด้านล่างนี้เลยครับ
const SHEET_ID = '1fv0qwGCUbdICdpr3f4Xqm_YX3zLBEiZSyZuE0Cv7V3k';

// URL สำหรับดึงข้อมูลทั้ง 2 แท็บ (แท็บ Projects และ แท็บ Donations)
const URL_PROJECTS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Projects`;
const URL_DONATIONS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Donations`;

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});

// ฟังก์ชันสำหรับดึงข้อมูล CSV
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
        });
    });
}

// ฟังก์ชันหลักสำหรับดึงข้อมูล 2 ชีตพร้อมกัน
async function fetchDashboardData() {
    try {
        const [projectsData, donationsData] = await Promise.all([
            fetchCSV(URL_PROJECTS),
            fetchCSV(URL_DONATIONS)
        ]);

        processAndRender(projectsData, donationsData);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('projects-grid').innerHTML = 
            '<div class="loading">❌ ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบว่าใส่ Sheet ID ถูกต้องและเปิดแชร์เป็น "ทุกคนที่มีลิงก์" แล้ว</div>';
    }
}

// ฟังก์ชันประมวลผลและวาดหน้าจอ
function processAndRender(projects, donations) {
    let totalDonatedOverall = 0;
    let totalTargetOverall = 0;
    let validProjectsCount = 0;

    // 1. คำนวณยอดบริจาครวมของ "ผู้บริจาคแต่ละคน" (Total per person)
    const donorTotals = {};
    donations.forEach(d => {
        if (!d.donor_name || d.donor_name.trim() === '') return;
        const amount = parseFloat(d.amount) || 0;
        donorTotals[d.donor_name] = (donorTotals[d.donor_name] || 0) + amount;
        totalDonatedOverall += amount; // บวกเข้ายอดรวมของโปรเจกต์จิว
    });

    // 2. จัดกลุ่มประวัติการบริจาคตาม "โปรเจกต์" (Project ID)
    const projectDonations = {};
    donations.forEach(d => {
        if (!d.project_id) return;
        if (!projectDonations[d.project_id]) projectDonations[d.project_id] = [];
        projectDonations[d.project_id].push(d);
    });

    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = '';

    // 3. สร้างการ์ดโปรเจกต์
    projects.forEach(project => {
        if (!project.id || !project.title) return;
        
        validProjectsCount++;
        const target = parseFloat(project.target) || 0;
        totalTargetOverall += target;

        // ดึงรายการคนโดเนทของโปรเจกต์นี้
        const donorsInThisProject = projectDonations[project.id] || [];
        
        // คำนวณยอดปัจจุบันของโปรเจกต์นี้จากชีต Donations
        const currentAmount = donorsInThisProject.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const percent = target > 0 ? Math.min(Math.round((currentAmount / target) * 100), 100) : 0;
        const isCompleted = currentAmount >= target;

        // 4. สร้าง HTML สำหรับรายการผู้บริจาคในโปรเจกต์นี้
        let donorsHTML = '';
        if (donorsInThisProject.length > 0) {
            donorsHTML = `<div class="donors-section">
                <div class="donors-title">🎁 ผู้สนับสนุนน้องจิว</div>
                <div class="donor-list">`;
            
            donorsInThisProject.forEach(d => {
                const donatedToThis = parseFloat(d.amount) || 0;
                const totalByThisPerson = donorTotals[d.donor_name];
                // ถ้ารูปไม่มี ให้ใช้รูปตัวแทนที่สร้างจากชื่อ
                const avatar = d.donor_image || `https://ui-avatars.com/api/?name=${d.donor_name}&background=random`;

                donorsHTML += `
                    <div class="donor-item">
                        <img src="${avatar}" alt="${d.donor_name}" class="donor-avatar">
                        <div class="donor-info">
                            <div class="donor-name">${d.donor_name}</div>
                            <div class="donor-amounts">
                                โดเนทโปรเจกต์นี้: <span>${donatedToThis.toLocaleString()} ฿</span><br>
                                (โดเนทรวมทั้งหมด: ${totalByThisPerson.toLocaleString()} ฿)
                            </div>
                        </div>
                    </div>
                `;
            });
            donorsHTML += `</div></div>`;
        } else {
            donorsHTML = `<div class="donors-section"><div class="donors-title" style="color:#aaa;">ยังไม่มีผู้สนับสนุน ร่วมเป็นคนแรกสิ! 😊</div></div>`;
        }

        // 5. ประกอบการ์ด
        const cardHTML = `
            <div class="project-card">
                <span class="status-badge ${isCompleted ? 'completed' : ''}">
                    ${isCompleted ? 'สำเร็จแล้ว 🎉' : 'กำลังระดมทุน ✏️'}
                </span>
                <img src="${project.image || 'https://placehold.co/400x250/8d6e63/fff?text=Jew+Project'}" alt="${project.title}" class="card-img">
                <div class="card-body">
                    <h3 class="card-title">${project.title}</h3>
                    <p class="card-desc">${project.description || ''}</p>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${percent}%;"></div>
                    </div>
                    <div class="card-finance">
                        <span class="finance-current">ได้: ${currentAmount.toLocaleString()} ฿ (${percent}%)</span>
                        <span class="finance-target">เป้า: ${target.toLocaleString()} ฿</span>
                    </div>
                    ${donorsHTML}
                </div>
            </div>
        `;

        projectsGrid.innerHTML += cardHTML;
    });

    // 6. อัปเดตยอดรวมด้านบนสุด
    document.getElementById('total-donated').innerText = totalDonatedOverall.toLocaleString();
    document.getElementById('total-target').innerText = totalTargetOverall.toLocaleString();
    document.getElementById('project-count').innerText = validProjectsCount;
}
