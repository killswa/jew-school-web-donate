// ⚠️ อย่าลืมใส่ Sheet ID ของคุณตรงนี้!
const SHEET_ID = '1NbgQ_QtmMVC1d6JIZoWe2MV3_JHvakyHfJwvKuNVZ9w'; 

const URL_PROJECTS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Projects`;
const URL_DONATIONS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Donations`;

let globalProjects = {};
let globalProjectDonations = {};
let globalDonorTotals = {};
// ตัวแปรใหม่สำหรับเก็บรูปโปรไฟล์ล่าสุดของแต่ละคน
let globalDonorAvatars = {}; 

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
    globalProjects = {};
    globalProjectDonations = {};
    globalDonorTotals = {};
    globalDonorAvatars = {};
    
    let totalDonatedOverall = 0;
    let totalTargetOverall = 0;
    let validProjectsCount = 0;

    // 1. คำนวณยอดรวม และเก็บรูปโปรไฟล์
    donations.forEach(d => {
        if (!d.donor_name || d.donor_name.trim() === '') return;
        const amount = parseFloat(d.amount) || 0;
        
        globalDonorTotals[d.donor_name] = (globalDonorTotals[d.donor_name] || 0) + amount;
        totalDonatedOverall += amount; 
        
        if (d.donor_image && d.donor_image.trim() !== '') {
            globalDonorAvatars[d.donor_name] = d.donor_image;
        }
    });

    // 2. จัดกลุ่มตามโปรเจกต์
    donations.forEach(d => {
        if (!d.project_id) return;
        if (!globalProjectDonations[d.project_id]) globalProjectDonations[d.project_id] = [];
        globalProjectDonations[d.project_id].push(d);
    });

    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = '';

    // 3. สร้างการ์ดโปรเจกต์ย่อย
    projects.forEach(project => {
        if (!project.id || !project.title) return;
        globalProjects[project.id] = project; 
        
        validProjectsCount++;
        const target = parseFloat(project.target) || 0;
        totalTargetOverall += target;

        const donorsInThisProject = globalProjectDonations[project.id] || [];
        const currentAmount = donorsInThisProject.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const percent = target > 0 ? Math.min(Math.round((currentAmount / target) * 100), 100) : 0;
        const isCompleted = currentAmount >= target;

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

    // 4. อัปเดตกระดานดำด้านบน
    document.getElementById('total-donated').innerText = totalDonatedOverall.toLocaleString();
    document.getElementById('total-target').innerText = totalTargetOverall.toLocaleString();
    document.getElementById('project-count').innerText = validProjectsCount;

    // 5. 🌟 สร้างตารางจัดอันดับ (Leaderboard) 
    renderLeaderboard();
}

function renderLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';

    // แปลงข้อมูลยอดรวมให้เป็น Array แล้วเรียงลำดับจากมากไปน้อย
    const sortedDonors = Object.keys(globalDonorTotals).map(name => {
        return {
            name: name,
            total: globalDonorTotals[name],
            avatar: globalDonorAvatars[name] || `https://ui-avatars.com/api/?name=${name}&background=random`
        };
    }).sort((a, b) => b.total - a.total);

    if (sortedDonors.length > 0) {
        sortedDonors.forEach((donor, index) => {
            let rankIcon = `${index + 1}`;
            if (index === 0) rankIcon = '🥇 1';
            else if (index === 1) rankIcon = '🥈 2';
            else if (index === 2) rankIcon = '🥉 3';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="rank-medal">${rankIcon}</td>
                <td>
                    <div class="leaderboard-donor">
                        <img src="${donor.avatar}" alt="${donor.name}" class="leaderboard-avatar">
                        ${donor.name}
                    </div>
                </td>
                <td class="leaderboard-amount">${donor.total.toLocaleString()} ฿</td>
            `;
            leaderboardBody.appendChild(tr);
        });
    } else {
        leaderboardBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #8D6E63; padding: 30px;">ยังไม่มีข้อมูลผู้สนับสนุน มาร่วมเป็นคนแรกกันเถอะ! 😊</td></tr>`;
    }
}

// ระบบ Popup (เหมือนเดิม)
function openModal(projectId) {
    const project = globalProjects[projectId];
    const donors = globalProjectDonations[projectId] || [];
    
    document.getElementById('modal-project-title').innerText = `🎁 โปรเจกต์: ${project.title}`;
    const listContainer = document.getElementById('modal-donors-list');
    
    if (donors.length > 0) {
        donors.sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));
        let html = '';
        donors.forEach(d => {
            const amount = parseFloat(d.amount) || 0;
            const totalAmount = globalDonorTotals[d.donor_name] || 0;
            const avatar = globalDonorAvatars[d.donor_name] || `https://ui-avatars.com/api/?name=${d.donor_name}&background=random`;
            
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
    
    document.getElementById('donor-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('donor-modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('donor-modal');
    if (event.target == modal) {
        closeModal();
    }
}
