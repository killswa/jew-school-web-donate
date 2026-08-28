// ⚠️ อย่าลืมใส่ Sheet ID ของคุณตรงนี้!
const SHEET_ID = '1NbgQ_QtmMVC1d6JIZoWe2MV3_JHvakyHfJwvKuNVZ9w'; 

const URL_PROJECTS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Projects`;
const URL_DONATIONS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Donations`;

// ตัวแปรส่วนกลางสำหรับเก็บข้อมูลไว้ใช้ตอนเปิด Popup
let globalProjects = {};
let globalProjectDonations = {};
let globalDonorTotals = {};

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
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
            '<div class="loading">❌ ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบ Sheet ID</div>';
    }
}

function processAndRender(projects, donations) {
    // ล้างข้อมูลเก่า
    globalProjects = {};
    globalProjectDonations = {};
    globalDonorTotals = {};
    
    let totalDonatedOverall = 0;
    let totalTargetOverall = 0;
    let validProjectsCount = 0;

    // คำนวณยอดของแต่ละคน
    donations.forEach(d => {
        if (!d.donor_name || d.donor_name.trim() === '') return;
        const amount = parseFloat(d.amount) || 0;
        globalDonorTotals[d.donor_name] = (globalDonorTotals[d.donor_name] || 0) + amount;
        totalDonatedOverall += amount; 
    });

    // จัดกลุ่มตามโปรเจกต์
    donations.forEach(d => {
        if (!d.project_id) return;
        if (!globalProjectDonations[d.project_id]) globalProjectDonations[d.project_id] = [];
        globalProjectDonations[d.project_id].push(d);
    });

    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = '';

    // สร้างการ์ดโปรเจกต์
    projects.forEach(project => {
        if (!project.id || !project.title) return;
        
        // เก็บข้อมูลโปรเจกต์ไว้ใช้ตอนกด Popup
        globalProjects[project.id] = project; 
        
        validProjectsCount++;
        const target = parseFloat(project.target) || 0;
        totalTargetOverall += target;

        const donorsInThisProject = globalProjectDonations[project.id] || [];
        const currentAmount = donorsInThisProject.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const percent = target > 0 ? Math.min(Math.round((currentAmount / target) * 100), 100) : 0;
        const isCompleted = currentAmount >= target;

        // ประกอบ HTML การ์ด (เปลี่ยนจากลิสต์รายชื่อ เป็นปุ่มกด)
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
                    <button class="btn-view-donors" onclick="openModal('${project.id}')">🎁 ดูรายชื่อผู้สนับสนุน</button>
                </div>
            </div>
        `;
        projectsGrid.innerHTML += cardHTML;
    });

    // อัปเดตกระดานดำด้านบน
    document.getElementById('total-donated').innerText = totalDonatedOverall.toLocaleString();
    document.getElementById('total-target').innerText = totalTargetOverall.toLocaleString();
    document.getElementById('project-count').innerText = validProjectsCount;
}

// 🌟 ระบบ Popup (Modal)
function openModal(projectId) {
    const project = globalProjects[projectId];
    const donors = globalProjectDonations[projectId] || [];
    
    // อัปเดตชื่อโปรเจกต์บนหัว Popup
    document.getElementById('modal-project-title').innerText = `🎁 โปรเจกต์: ${project.title}`;
    
    const listContainer = document.getElementById('modal-donors-list');
    
    if (donors.length > 0) {
        // เรียงลำดับคนที่โดเนทเยอะสุดขึ้นก่อน
        donors.sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));
        
        let html = '';
        donors.forEach(d => {
            const amount = parseFloat(d.amount) || 0;
            const totalAmount = globalDonorTotals[d.donor_name] || 0;
            const avatar = d.donor_image || `https://ui-avatars.com/api/?name=${d.donor_name}&background=random`;
            
            html += `
                <div class="donor-item">
                    <img src="${avatar}" alt="${d.donor_name}" class="donor-avatar">
                    <div class="donor-info">
                        <div class="donor-name">${d.donor_name}</div>
                        <div class="donor-amounts">
                            โดเนทโปรเจกต์นี้: <span>${amount.toLocaleString()} ฿</span><br>
                            (โดเนททุกโปรเจกต์รวมกัน: ${totalAmount.toLocaleString()} ฿)
                        </div>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    } else {
        listContainer.innerHTML = `<div style="text-align:center; padding: 40px 20px; color:#8D6E63;">ยังไม่มีผู้สนับสนุน<br>มาร่วมระดมทุนให้น้องจิวกันเถอะ! 😊</div>`;
    }
    
    // โชว์ Popup
    document.getElementById('donor-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('donor-modal').style.display = 'none';
}

// ถ้าคลิกพื้นที่ว่างๆ นอกกล่อง Popup ให้ปิด Popup
window.onclick = function(event) {
    const modal = document.getElementById('donor-modal');
    if (event.target == modal) {
        closeModal();
    }
}
