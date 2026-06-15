document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const bookList = document.getElementById('bookList');

    let cachedBooks = [];
    let timeout = null;

    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === "" || window.location.protocol === 'file:')
        ? 'http://localhost:5000'
        : 'https://campuscare-backend-96cn.onrender.com';

    // Simple HTML escaping helper
    const esc = (value) => {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
    };

    const getPlaceholderCover = (category) => {
        const cat = (category || 'General').toUpperCase();
        let coverGradient = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)';
        if (cat.includes('CSE') || cat.includes('IT')) coverGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        else if (cat.includes('CIVIL')) coverGradient = 'linear-gradient(135deg, #20bf55 0%, #01baef 100%)';
        else if (cat.includes('ECE')) coverGradient = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        else if (cat.includes('MECHANICAL') || cat.includes('MECH')) coverGradient = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
        else if (cat.includes('GENERAL')) coverGradient = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
        else if (cat.includes('ELECTRICAL') || cat.includes('EE')) coverGradient = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
        else if (cat.includes('MANAGEMENT') || cat.includes('MBA')) coverGradient = 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)';
        else if (cat.includes('LITERATURE') || cat.includes('ENG')) coverGradient = 'linear-gradient(135deg, #1fa2ff 0%, #12d8fa 100%, #a6ffcb 100%)';

        return `
          <div style="width: 100px; min-width: 100px; height: 140px; border-radius: 10px; background: ${coverGradient}; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); flex-shrink: 0; color: white; padding: 8px; box-sizing: border-box; text-align: center;">
            <i class="fa-solid fa-book" style="font-size: 2.2rem; margin-bottom: 10px; opacity: 0.95;"></i>
            <span style="font-size: 0.62rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; line-height: 1.2; word-break: break-all; opacity: 0.9;">${esc(category || 'General')}</span>
          </div>`;
    };

    // Make helper globally accessible for onerror handler
    window.getPlaceholderCover = getPlaceholderCover;

    // Helper to calculate and render stats based on current visible books
    const updateStats = (books) => {
        const total = books.length;
        const categories = new Set(books.map(b => (b.category || 'General').toUpperCase())).size;
        const previewAvailable = books.filter(b => b.pdfUrl).length;

        const statTotal = document.getElementById('statTotalBooks');
        const statAvailable = document.getElementById('statAvailableBooks'); // physically unused, but handle if present
        const statBorrowed = document.getElementById('statBorrowedBooks');   // physically unused, but handle if present
        const statCats = document.getElementById('statCategories');
        const statPreviews = document.getElementById('statPreviewsAvailable');
        const statActive = document.getElementById('statActiveReaders');

        if (statTotal) statTotal.textContent = total;
        if (statCats) statCats.textContent = categories;
        if (statPreviews) statPreviews.textContent = previewAvailable;
        if (statActive) statActive.textContent = Math.floor(total * 1.5) + 3;

        // Clean up legacy statistics if they exist in other dashboards
        if (statAvailable) statAvailable.textContent = '-';
        if (statBorrowed) statBorrowed.textContent = '-';
    };

    // Helper to render filtered books
    const renderBooks = (books) => {
        if (!bookList) return;
        if (books.length === 0) {
            bookList.innerHTML = `
              <div class="module-empty" style="grid-column: 1 / -1; width: 100%; box-sizing: border-box; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                <i class="fa-regular fa-folder-open" style="font-size: 3rem; color: var(--primary); margin-bottom: 8px;"></i>
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-dark);">No Books Found</h3>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); max-width: 400px; text-align: center; line-height: 1.5;">We couldn't find any books matching your search criteria. Try adjusting your search term or choosing a different category.</p>
              </div>`;
            return;
        }

        bookList.innerHTML = books.map(book => {
            // cover image priority
            const coverImage = book.coverImage || book.imageUrl || book.cover || '';
            let coverHtml = '';
            if (coverImage) {
                coverHtml = `<img src="${esc(coverImage)}" alt="${esc(book.title)}" style="width: 100px; min-width: 100px; height: 140px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.1); flex-shrink: 0;" onerror="this.outerHTML=window.getPlaceholderCover('${esc(book.category)}')">`;
            } else {
                coverHtml = getPlaceholderCover(book.category);
            }

            // formatting publication date
            const pubDate = book.createdAt 
                ? new Date(book.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                : 'N/A';

            // digital access badge
            const badgeStyle = 'background: #e6fffa; color: #008767; border: 1px solid #b2f5ea;';
            const badgeText = 'E-Book ⚡';

            // read action button
            let pdfUrl = book.pdfUrl || '/assets/pdfs/general_reading.pdf';
            if (pdfUrl.startsWith('/')) {
                pdfUrl = '..' + pdfUrl;
            }
            const actionBtnHtml = `
                <button onclick="window.open('${esc(pdfUrl)}', '_blank')" class="btn-filled-purple" style="width: 100%; font-size: 0.8rem; padding: 8px 12px; font-weight: 700; border-radius: var(--radius-sm); border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; transition: all 0.2s;">
                  <i class="fa-solid fa-book-open"></i> Read Book
                </button>`;

            return `
              <div class="book-card" style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; display: flex; gap: 16px; box-shadow: var(--shadow-sm); transition: all 0.2s ease; position: relative; overflow: hidden; align-items: stretch; text-align: left;"
                   onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='var(--shadow-md)'; this.style.borderColor='var(--primary)';"
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)'; this.style.borderColor='var(--border-color)';">
                
                ${coverHtml}
                
                <div style="display: flex; flex-direction: column; flex-grow: 1; min-width: 0; justify-content: space-between;">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3;" title="${esc(book.title)}">${esc(book.title)}</h3>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">by ${esc(book.author)}</div>
                    
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-barcode" style="width: 14px; color: var(--primary);"></i>
                      <span>ISBN: <strong>${esc(book.isbn || 'N/A')}</strong></span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-calendar-days" style="width: 14px; color: var(--primary);"></i>
                      <span>Published: <strong>${pubDate}</strong></span>
                    </div>
                  </div>
                  
                  <div style="margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                      <span style="${badgeStyle} padding: 4px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${badgeText}</span>
                      <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-globe" style="margin-right: 4px; color: var(--success);"></i>Online</span>
                    </div>
                    ${actionBtnHtml}
                  </div>
                </div>
              </div>`;
        }).join('');
    };

    const filterAndRender = () => {
        const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const category = categoryFilter ? categoryFilter.value : 'All';

        const filtered = cachedBooks.filter(book => {
            // category match
            const matchesCategory = category === 'All' || 
                (book.category && book.category.toUpperCase() === category.toUpperCase());

            // search match
            const matchesSearch = !search ||
                (book.title && book.title.toLowerCase().includes(search)) ||
                (book.author && book.author.toLowerCase().includes(search)) ||
                (book.category && book.category.toLowerCase().includes(search)) ||
                (book.isbn && book.isbn.toLowerCase().includes(search));

            return matchesCategory && matchesSearch;
        });

        renderBooks(filtered);
        updateStats(filtered);
    };

    // Populate categories dynamically from available books
    const setupCategoryDropdown = (books) => {
        if (!categoryFilter) return;
        const categories = [...new Set(books.map(b => b.category).filter(Boolean))];
        
        // Preserve "All" and append dynamically found categories
        categoryFilter.innerHTML = '<option value="All">All Categories</option>' + 
            categories.sort().map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('');
    };

    async function fetchBooks() {
        if (bookList) {
            bookList.innerHTML = '<div class="module-empty" style="grid-column: 1 / -1;"><i class="fa-solid fa-spinner fa-spin"></i><span>Loading books...</span></div>';
        }

        try {
            const res = await fetch(`${API_BASE}/api/library`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch books');
            }
            cachedBooks = await res.json();
            
            setupCategoryDropdown(cachedBooks);
            renderBooks(cachedBooks);
            updateStats(cachedBooks);
        } catch (error) {
            console.error(error);
            if (bookList) {
                bookList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:red;">${error.message}</div>`;
            }
        }
    }

    // Load Initial Books
    fetchBooks();

    // Event Listeners
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(filterAndRender, 150); // 150ms debounce
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndRender);
    }
});
