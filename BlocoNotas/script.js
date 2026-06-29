// ==============================
// ELEMENTOS
// ==============================

const themeBtn         = document.getElementById("themeToggle");
const search           = document.getElementById("search");
const addBook          = document.getElementById("addBook");

const modalOverlay     = document.getElementById("modalOverlay");
const modalName        = document.getElementById("modalName");
const modalDesc        = document.getElementById("modalDesc");
const modalEmoji       = document.getElementById("modalEmoji");
const modalImage       = document.getElementById("modalImage");
const modalCancel      = document.getElementById("modalCancel");
const modalConfirm     = document.getElementById("modalConfirm");

const tabEmoji         = document.getElementById("tabEmoji");
const tabImage         = document.getElementById("tabImage");
const panelEmoji       = document.getElementById("panelEmoji");
const panelImage       = document.getElementById("panelImage");
const uploadArea       = document.getElementById("uploadArea");
const uploadLabel      = document.getElementById("uploadLabel");
const previewImg       = document.getElementById("previewImg");

const deleteOverlay    = document.getElementById("deleteOverlay");
const deleteMessage    = document.getElementById("deleteMessage");
const deleteCancelBtn  = document.getElementById("deleteCancelBtn");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

// ==============================
// MODO ESCURO
// ==============================

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);
themeBtn.addEventListener("click", toggleTheme);

function applyTheme(theme){
    if(theme === "dark"){
        document.body.classList.add("dark");
        themeBtn.textContent = "☀️ Tema Claro";
    }else{
        document.body.classList.remove("dark");
        themeBtn.textContent = "🌙 Tema Escuro";
    }
}

function toggleTheme(){
    const dark = document.body.classList.contains("dark");
    if(dark){
        document.body.classList.remove("dark");
        localStorage.setItem("theme","light");
        themeBtn.textContent = "🌙 Tema Escuro";
    }else{
        document.body.classList.add("dark");
        localStorage.setItem("theme","dark");
        themeBtn.textContent = "☀️ Tema Claro";
    }
}

// ==============================
// PESQUISA
// ==============================

search.addEventListener("input", () => {
    const value = search.value.toLowerCase().trim();
    document.querySelectorAll(".book-card").forEach(card => {
        if(card.classList.contains("add-book")) return;
        const title = card.querySelector("h2").textContent.toLowerCase();
        card.style.display = title.includes(value) ? "block" : "none";
    });
});

// ==============================
// ABAS EMOJI / IMAGEM
// ==============================

let activeTab = "emoji"; // controla qual aba está ativa
let imageBase64 = null;  // guarda a imagem convertida

tabEmoji.addEventListener("click", () => {
    activeTab = "emoji";
    tabEmoji.classList.add("active");
    tabImage.classList.remove("active");
    panelEmoji.classList.remove("hidden");
    panelImage.classList.add("hidden");
});

tabImage.addEventListener("click", () => {
    activeTab = "image";
    tabImage.classList.add("active");
    tabEmoji.classList.remove("active");
    panelImage.classList.remove("hidden");
    panelEmoji.classList.add("hidden");
});

// clica na área de upload → abre o input file
uploadArea.addEventListener("click", () => modalImage.click());

// quando escolhe uma imagem, converte pra base64 e mostra preview
modalImage.addEventListener("change", () => {
    const file = modalImage.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        imageBase64 = e.target.result;
        previewImg.src = imageBase64;
        previewImg.classList.remove("hidden");
        uploadLabel.textContent = file.name;
    };
    reader.readAsDataURL(file);
});

// ==============================
// MODAL NOVO CADERNO
// ==============================

function openModal() {
    modalName.value  = "";
    modalDesc.value  = "";
    modalEmoji.value = "";
    modalImage.value = "";
    imageBase64      = null;
    activeTab        = "emoji";

    // reset abas
    tabEmoji.classList.add("active");
    tabImage.classList.remove("active");
    panelEmoji.classList.remove("hidden");
    panelImage.classList.add("hidden");

    // reset preview
    previewImg.src = "";
    previewImg.classList.add("hidden");
    uploadLabel.textContent = "Clique para escolher uma imagem";

    modalOverlay.classList.add("active");
    setTimeout(() => modalName.focus(), 100);
}

function closeModal() {
    modalOverlay.classList.remove("active");
}

addBook.addEventListener("click", openModal);
modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) closeModal();
});

modalConfirm.addEventListener("click", () => {
    const name  = modalName.value.trim();
    const desc  = modalDesc.value.trim();

    if (!name) {
        modalName.focus();
        modalName.style.borderColor = "#EF4444";
        setTimeout(() => modalName.style.borderColor = "", 1500);
        return;
    }

    // define o ícone: imagem base64 ou emoji
    let icon, iconType;
    if (activeTab === "image" && imageBase64) {
        icon     = imageBase64;
        iconType = "image";
    } else {
        icon     = modalEmoji.value.trim() || "📓";
        iconType = "emoji";
    }

    const id = name.toLowerCase().replace(/\s+/g, "-");
    let custom = JSON.parse(localStorage.getItem("customBooks") || "[]");

    if (custom.find(b => b.id === id)) {
        modalName.style.borderColor = "#EF4444";
        modalName.value = "";
        modalName.placeholder = "Já existe um caderno com esse nome";
        setTimeout(() => {
            modalName.style.borderColor = "";
            modalName.placeholder = "Ex: Python, Git, SQL...";
        }, 2000);
        return;
    }

    custom.push({ id, name, desc, icon, iconType });
    localStorage.setItem("customBooks", JSON.stringify(custom));
    closeModal();
    loadCustomBooks();
});

// fecha com ESC
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        closeModal();
        closeDeleteModal();
    }
});

// ==============================
// MODAL DELETAR
// ==============================

let pendingDeleteId = null;

function openDeleteModal(id, name) {
    pendingDeleteId = id;
    deleteMessage.textContent = `Deletar "${name}"? As anotações dentro dele também serão apagadas.`;
    deleteOverlay.classList.add("active");
}

function closeDeleteModal() {
    deleteOverlay.classList.remove("active");
    pendingDeleteId = null;
}

deleteCancelBtn.addEventListener("click", closeDeleteModal);
deleteOverlay.addEventListener("click", e => {
    if (e.target === deleteOverlay) closeDeleteModal();
});

deleteConfirmBtn.addEventListener("click", () => {
    if (!pendingDeleteId) return;
    let custom = JSON.parse(localStorage.getItem("customBooks") || "[]");
    custom = custom.filter(b => b.id !== pendingDeleteId);
    localStorage.setItem("customBooks", JSON.stringify(custom));
    localStorage.removeItem(`studyBook_${pendingDeleteId}`);
    closeDeleteModal();
    loadCustomBooks();
});

// ==============================
// CARREGAR CADERNOS CUSTOMIZADOS
// ==============================

function loadCustomBooks() {
    const custom  = JSON.parse(localStorage.getItem("customBooks") || "[]");
    const section = document.querySelector(".books");

    document.querySelectorAll(".book-card.custom").forEach(el => el.remove());

    custom.forEach(book => {
        const card = document.createElement("a");
        card.href  = `notebooks/notebook.html?book=${book.id}`;
        card.className = "book-card custom";

        // monta o ícone: imagem ou emoji
        const iconHTML = book.iconType === "image"
            ? `<img class="emoji" src="${book.icon}" alt="${book.name}" style="width:48px;height:48px;object-fit:contain;border-radius:6px;">`
            : `<span class="emoji" style="font-size:42px;">${book.icon}</span>`;

        card.innerHTML = `
            <div class="card-row">
                ${iconHTML}
                <div class="card-text">
                    <h2>${book.name}</h2>
                    <p>${book.desc || "Caderno personalizado."}</p>
                </div>
                <button class="delete-book-btn" title="Deletar caderno">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;

        card.querySelector(".delete-book-btn").addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            openDeleteModal(book.id, book.name);
        });

        section.insertBefore(card, addBook);
    });
}

loadCustomBooks();