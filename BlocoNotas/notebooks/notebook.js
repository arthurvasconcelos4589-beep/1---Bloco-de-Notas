// ==============================
// ELEMENTOS
// ==============================

const textarea = document.getElementById("note");
const page = document.getElementById("page");
const cover = document.getElementById("cover");

const pageNumber = document.getElementById("pageNumber");

const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const newBtn = document.getElementById("new");

const themeBtn = document.getElementById("themeToggle");

const title = document.getElementById("title");
const priority = document.getElementById("priority");

const book = document.querySelector(".book");

const params = new URLSearchParams(window.location.search);

const currentBook = params.get("book") || "default";

const storageKey = `studyBook_${currentBook}`;

const backButton = document.getElementById("backButton");

document.getElementById("bookTitle").textContent =
    currentBook.charAt(0).toUpperCase() + currentBook.slice(1);

const pagesList = document.getElementById("pagesList");
const totalPages = document.getElementById("totalPages");
const searchPage = document.getElementById("searchPage");
const menuToggle = document.getElementById("menuToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebar = document.querySelector(".sidebar");

const favoriteBtn = document.getElementById("favoriteBtn");
const filterFavorites = document.getElementById("filterFavorites");

const exportAll  = document.getElementById("exportAll");
const exportPage = document.getElementById("exportPage");
const importBtn  = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const resetBook = document.getElementById("resetBook");

let showingFavorites = false;

// ==============================
// DADOS
// ==============================

let pages = JSON.parse(localStorage.getItem(storageKey)) || [
    {
        title: "",
        content: "",
        priority: "normal"
    }
];

let currentPage = Number(localStorage.getItem("currentPage")) || 0;

let opened = false;

// ==============================
// SALVAR
// ==============================

function save(){

    pages[currentPage] = {
        title: title.value,
        content: textarea.value,
        priority: priority.value,
        favorite: pages[currentPage].favorite || false  
    };

    localStorage.setItem(storageKey, JSON.stringify(pages));

    localStorage.setItem("currentPage", currentPage);

}

// ==============================
// PRIORIDADE
// ==============================

function updatePriority(){

    book.classList.remove(
        "normal",
        "info",
        "success",
        "warning",
        "danger"
    );
    book.classList.add(priority.value);
}

// ==============================
// CARREGAR
// ==============================

function loadPage(){

    if(!pages[currentPage].priority){
        pages[currentPage].priority = "normal";
    }

    title.value = pages[currentPage].title;

    textarea.value = pages[currentPage].content;

    priority.value = pages[currentPage].priority;

    updatePriority();

    pageNumber.textContent = `Página ${currentPage + 1}`;

    favoriteBtn.textContent = pages[currentPage].favorite ? "★" : "☆";
    favoriteBtn.classList.toggle("active", !!pages[currentPage].favorite);

    renderSidebar();

}

// ==============================
// SIDEBAR — RENDERIZAR
// ==============================

function renderSidebar(filter = "") {
    pagesList.innerHTML = "";

    let filtered = pages
        .map((p, i) => ({ ...p, index: i }))
        .filter(p => (p.title || "Sem título").toLowerCase().includes(filter.toLowerCase()));

    // filtro de favoritos
    if (showingFavorites) {
        filtered = filtered.filter(p => p.favorite);
    }

    filtered.forEach(p => {
        const item = document.createElement("div");
        item.className = "page-item" + (p.index === currentPage ? " active" : "");

        const info = document.createElement("div");
        info.className = "page-item-info";

        const h4 = document.createElement("h4");

        // estrela indicadora ao lado do título
        if (p.favorite) {
            const star = document.createElement("span");
            star.className = "star-indicator";
            star.textContent = "★";
            h4.appendChild(star);
        }

        h4.appendChild(document.createTextNode(p.title || "Sem título"));

        const span = document.createElement("p");
        span.textContent = `Página ${p.index + 1}`;

        info.appendChild(h4);
        info.appendChild(span);

        const delBtn = document.createElement("button");
        delBtn.className = "delete-page-btn";
        delBtn.textContent = "🗑";
        delBtn.title = "Deletar página";

        delBtn.addEventListener("click", e => {
            e.stopPropagation();
            deletePage(p.index);
        });

        item.appendChild(info);
        item.appendChild(delBtn);

        item.addEventListener("click", () => {
            if (!opened) openBook();
            save();
            currentPage = p.index;
            loadPage();
            renderSidebar(searchPage.value);
            closeSidebar();
        });

        pagesList.appendChild(item);
    });

    totalPages.textContent = `${pages.length} página${pages.length !== 1 ? "s" : ""}`;
}

// ==============================
// SIDEBAR — DELETAR PÁGINA
// ==============================

function deletePage(index) {
    if (pages.length === 1) {
        alert("Você não pode deletar a única página do caderno.");
        return;
    }

    if (!confirm(`Deletar a página "${pages[index].title || "Sem título"}"?`)) return;

    pages.splice(index, 1);

    if (currentPage >= pages.length) {
        currentPage = pages.length - 1;
    }

    save();
    loadPage();
    renderSidebar(searchPage.value);
}

// ==============================
// EXPORTAR CADERNO INTEIRO
// ==============================

function exportAllPages() {
    save();
    const data = {
        type: "caderno",
        book: currentBook,
        pages: pages
    };
    download(`${currentBook}_caderno.json`, data);
}

// ==============================
// EXPORTAR PÁGINA ATUAL
// ==============================

function exportCurrentPage() {
    save();
    const data = {
        type: "pagina",
        page: pages[currentPage]
    };
    download(`${currentBook}_pagina${currentPage + 1}.json`, data);
}

// ==============================
// DOWNLOAD HELPER
// ==============================

function download(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ==============================
// IMPORTAR
// ==============================

function importJSON(file) {
    const reader = new FileReader();

    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);

            // importar caderno inteiro
            if (data.type === "caderno" && Array.isArray(data.pages)) {
                if (!confirm(`Isso vai substituir todas as páginas do caderno "${currentBook}". Tem certeza?`)) return;
                pages = data.pages;
                currentPage = 0;
                save();
                loadPage();
                renderSidebar();
                alert("Caderno importado com sucesso!");

            // importar página única
            } else if (data.type === "pagina" && data.page) {
                if (!confirm(`Importar a página "${data.page.title || "Sem título"}" no final deste caderno?`)) return;
                pages.push(data.page);
                currentPage = pages.length - 1;
                save();
                loadPage();
                renderSidebar();
                alert("Página importada com sucesso!");

            } else {
                alert("Arquivo inválido. Use um .json exportado por este bloco de notas.");
            }

        } catch {
            alert("Erro ao ler o arquivo. Verifique se é um .json válido.");
        }
    };

    reader.readAsText(file);
}

// ==============================
// SIDEBAR — ABRIR / FECHAR
// ==============================

function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
}

// ==============================
// ABRIR LIVRO
// ==============================

function openBook(){
    opened = true;
    updatePriority();
    cover.classList.add("open");
    setTimeout(()=>{
        page.classList.add("show");
    },300);
}

// ==============================
// FECHAR LIVRO
// ==============================

function closeBook(){
    opened = false;
    page.classList.remove("show");
    book.classList.remove(
        "info",
        "success",
        "warning",
        "danger"
    );
    book.classList.add("normal");
    setTimeout(()=>{
        cover.classList.remove("open");
    },200);
}

// ==============================
// PRÓXIMA PÁGINA
// ==============================

function nextPage(){

    if(!opened){
        openBook();
        return;
    }

    save();

    if(currentPage >= pages.length - 1)
        return;

    page.classList.add("turn");

    setTimeout(()=>{
        currentPage++;
        loadPage();
        page.classList.remove("turn");
    },250);
}

// ==============================
// PÁGINA ANTERIOR
// ==============================

function previousPage(){

    if(!opened)
        return;

    save();

    if(currentPage === 0){
        closeBook();
        return;
    }

    page.classList.add("turn");

    setTimeout(()=>{
        currentPage--;
        loadPage();
        page.classList.remove("turn");
    },250);
}

// ==============================
// NOVA PÁGINA
// ==============================

function newPage(){

    save();

    pages.push({
        title:"",
        content:"",
        priority:"normal"
    });

    currentPage = pages.length - 1;
    save();
    loadPage();
}

// ==============================
// EVENTOS
// ==============================

textarea.addEventListener("input", save);

title.addEventListener("input", save);

priority.addEventListener("change", ()=>{
    updatePriority();
    save();
});

nextBtn.addEventListener("click", nextPage);

prevBtn.addEventListener("click", previousPage);

newBtn.addEventListener("click", newPage);

themeBtn.addEventListener("click", toggleTheme);

backButton.addEventListener("click", ()=>{
    window.location.href = "../index.html";
});

menuToggle.addEventListener("click", openSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

searchPage.addEventListener("input", () => {
    renderSidebar(searchPage.value);
});

// favoritar/desfavoritar
favoriteBtn.addEventListener("click", () => {
    pages[currentPage].favorite = !pages[currentPage].favorite;
    favoriteBtn.textContent = pages[currentPage].favorite ? "★" : "☆";
    favoriteBtn.classList.toggle("active", pages[currentPage].favorite);
    save();
    renderSidebar(searchPage.value);
});

// filtrar favoritos na sidebar
filterFavorites.addEventListener("click", () => {
    showingFavorites = !showingFavorites;
    filterFavorites.classList.toggle("active", showingFavorites);
    filterFavorites.textContent = showingFavorites ? "★ Favoritos" : "☆ Favoritos";
    renderSidebar(searchPage.value);
});

exportAll.addEventListener("click",  exportAllPages);
exportPage.addEventListener("click", exportCurrentPage);

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) {
        importJSON(file);
        importFile.value = ""; // reseta o input pra poder importar o mesmo arquivo de novo
    }
});

// junto com os outros addEventListener:
resetBook.addEventListener("click", () => {
    if (!confirm(`Zerar o caderno "${currentBook}"? Todas as páginas serão apagadas e você começará do zero.`)) return;

    pages = [{ title: "", content: "", priority: "normal", favorite: false }];
    currentPage = 0;
    opened = false;

    save();
    closeBook();
    loadPage();
    renderSidebar();
});

// ==============================
// INICIALIZAÇÃO
// ==============================

const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme") || (systemDark ? "dark" : "light");
applyTheme(savedTheme); // ← move pra ANTES do loadPage

loadPage();
renderSidebar();

// ==============================
// MODO ESCURO
// ==============================

function applyTheme(theme){
    if(theme === "dark"){
        document.body.classList.add("dark");
        document.documentElement.classList.add("dark"); // ← adiciona essa linha
        themeBtn.textContent = "☀️ Modo Claro";
    }else{
        document.body.classList.remove("dark");
        document.documentElement.classList.remove("dark"); // ← e essa
        themeBtn.textContent = "🌙 Modo Escuro";
    }
}

function toggleTheme(){
    const darkMode = document.body.classList.contains("dark");
    if(darkMode){
        document.body.classList.remove("dark");
        document.documentElement.classList.remove("dark"); // ← adiciona
        localStorage.setItem("theme","light");
        themeBtn.textContent = "🌙 Modo Escuro";
    }else{
        document.body.classList.add("dark");
        document.documentElement.classList.add("dark"); // ← adiciona
        localStorage.setItem("theme","dark");
        themeBtn.textContent = "☀️ Modo Claro";
    }
}

// ==============================
// SINCRONIZAR ALTURA DOS ASIDES
// ==============================

function syncSidebarHeight() {
    const book = document.querySelector(".book");
    const topBar = document.querySelector(".top-bar");
    const sidebarLeft = document.querySelector(".sidebar");
    const sidebarRight = document.querySelector(".sidebar-right");

    const bookHeight = book.offsetHeight;
    const topBarHeight = topBar.offsetHeight + 12; // 12 = margin-bottom da top-bar

    const totalHeight = bookHeight + topBarHeight;

    sidebarLeft.style.maxHeight = totalHeight + "px";
    sidebarRight.style.maxHeight = totalHeight + "px";
}

// roda ao carregar e ao redimensionar
window.addEventListener("resize", syncSidebarHeight);
window.addEventListener("load", syncSidebarHeight);

// pequeno delay pra garantir que o layout já renderizou
setTimeout(syncSidebarHeight, 100);