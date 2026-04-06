let currentSitePass = localStorage.getItem('site_main_password') || "123";
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRjuadpGVjrkoKzVW8nECVEUfl-445zj-HdFosnR_zF52ieoJvb6KaNjtpsGfFBSYu87qM-R3mfMAwn/pub?output=csv';
let products = [];
let orders = JSON.parse(localStorage.getItem('pappu_orders')) || [];
let currentItem = {};
let adminClick = 0;

function checkSitePassword() {
    const input = document.getElementById('sitePassInput').value;
    if (currentSitePass === "" || input === currentSitePass) {
        document.getElementById('lockScreen').style.display = 'none';
        document.getElementById('mainWebsite').classList.remove('hidden');
        fetchProducts();
    } else { alert("पासवर्ड गलत है!"); }
}

function updateSitePassword() {
    let newPass = document.getElementById('newSitePass').value;
    localStorage.setItem('site_main_password', newPass);
    currentSitePass = newPass;
    alert("पासवर्ड सफलतापूर्वक बदल गया!");
}

function handleAdminSecret() {
    adminClick++;
    if (adminClick === 5) {
        adminClick = 0;
        if (prompt("एडमिन पासवर्ड:") === "123") {
            showView('adminView');
            renderOrderHistory();
            renderStockTable();
        }
    }
    setTimeout(() => adminClick = 0, 3000);
}

async function fetchProducts() {
    try {
        const response = await fetch(sheetUrl + '&t=' + new Date().getTime());
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        products = rows.map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return cols.length < 4 ? null : {
                name: cols[0].replace(/"/g, ''), weight: cols[1].replace(/"/g, ''),
                size: cols[2].replace(/"/g, ''), price: cols[3].replace(/"/g, ''),
                desc: cols[4] ? cols[4].replace(/"/g, '') : '',
                imgs: cols[5] ? cols[5].replace(/"/g, '').split(',') : []
            };
        }).filter(p => p);
        document.getElementById('loader').style.display = 'none';
        renderStore(products);
    } catch (e) { document.getElementById('loader').innerText = "सर्वर एरर!"; }
}

function renderStore(data) {
    document.getElementById('productList').innerHTML = data.map(p => `
        <div class="card">
            <h3>${p.name}</h3>
            <div class="img-grid">${p.imgs.map(i => `<img src="${i.trim()}" onclick="openImg('${i.trim()}')">`).join('')}</div>
            <div class="specs"><span class="spec-item">⚖️ वजन: ${p.weight}</span><span class="spec-item">📏 साइज: ${p.size}</span></div>
            <div class="desc-box">📝 ${p.desc}</div>
            <span class="price-tag">₹${p.price}</span>
            <button class="btn" onclick="openBooking('${p.name}','${p.price}','${p.weight}','${p.size}')">🛍️ अभी बुकिंग करें</button>
        </div>
    `).join('');
}

function filterProducts() {
    const query = document.getElementById('smartSearch').value.toLowerCase().trim();
    const filtered = products.filter(p => {
        if (!isNaN(query) && query !== "") return (parseFloat(p.price) || 0) <= parseFloat(query);
        return p.name.toLowerCase().includes(query);
    });
    renderStore(filtered);
}

function openBooking(n, p, w, s) {
    currentItem = {n, p, w, s};
    document.getElementById('selectedItemName').innerText = "ऑर्डर के लिए चुना: " + n;
    showView('bookingView');
}

document.getElementById('orderForm').onsubmit = function(e) {
    e.preventDefault();
    const uName = document.getElementById('uName').value;
    const uPhone = document.getElementById('uPhone').value;
    const village = document.getElementById('uVillage').value;
    const address = document.getElementById('uAddress').value;

    const order = { date: new Date().toLocaleString(), user: uName, phone: uPhone, item: currentItem.n, w: currentItem.w, s: currentItem.s, village: village, address: address };
    orders.push(order);
    localStorage.setItem('pappu_orders', JSON.stringify(orders));
    
    let msg = `*--- नया ऑर्डर प्राप्त हुआ ---*%0A%0A*📦 वस्तु:* ${currentItem.n}%0A*⚖️ वजन:* ${currentItem.w}%0A*📏 साइज:* ${currentItem.s}%0A*💰 कीमत:* ₹${currentItem.p}%0A%0A*👤 ग्राहक:* ${uName}%0A*📞 संपर्क:* ${uPhone}%0A*🏘️ क्षेत्र:* ${village}%0A*📍 पता:* ${address}`;
    window.open(`https://wa.me/918305797478?text=${msg}`);
    goHome();
};

function renderOrderHistory() {
    document.getElementById('orderHistoryTableBody').innerHTML = orders.map(o => `
        <tr><td>${o.date}</td><td><b>${o.user}</b><br>📞 ${o.phone}</td><td><b>${o.item}</b><br>W:${o.w} S:${o.s}</td><td><b>🏘️ ${o.village}</b><br>${o.address}</td></tr>
    `).join('') || "<tr><td colspan='4'>कोई ऑर्डर नहीं।</td></tr>";
}

function renderStockTable() {
    document.getElementById('stockTableBody').innerHTML = "<tr><th>नाम</th><th>वजन</th><th>साइज</th><th>कीमत</th></tr>" + 
    products.map(p => `<tr><td>${p.name}</td><td>${p.weight}</td><td>${p.size}</td><td>₹${p.price}</td></tr>`).join('');
}

function googleTranslateElementInit() { new google.translate.TranslateElement({pageLanguage: 'hi'}, 'google_translate_element'); }
function changeLang(langCode) {
    var selectField = document.querySelector(".goog-te-combo");
    if (selectField) { selectField.value = langCode; selectField.dispatchEvent(new Event('change')); }
}

function clearOrders() { if(confirm("डिलीट?")) { localStorage.removeItem('pappu_orders'); orders = []; renderOrderHistory(); } }
function showView(id) { document.querySelectorAll('.container > div').forEach(d => d.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); }
function goHome() { showView('storeView'); renderStore(products); }
function openImg(s) { document.getElementById('fullImage').src = s; document.getElementById('imageViewer').style.display = 'flex'; }