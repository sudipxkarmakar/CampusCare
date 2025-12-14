document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const bookList = document.getElementById('bookList');

    // Debounce Timer
    let timeout = null;

    // Load Initial Books
    fetchBooks();

    // Event Listeners
    searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(fetchBooks, 300); // 300ms debounce
    });

    categoryFilter.addEventListener('change', fetchBooks);

    async function fetchBooks() {
        const search = searchInput.value.trim();
        const category = categoryFilter.value;
        // const availableOnly = false; // Filter removed by user request

        // Constraint: Client-side validation for search length (Min 1 char)
        if (search.length > 0 && search.length < 1) {
            bookList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:#dc2626;">Please enter at least 1 character to search.</div>`;
            return;
        }

        // Build Query URL
        const queryParams = new URLSearchParams({
            search,
            category,
            // availableOnly
        });

        try {
            const res = await fetch(`http://localhost:5000/api/library?${queryParams}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch books');
            }
            const books = await res.json();
            renderBooks(books);
        } catch (error) {
            console.error(error);
            bookList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:red;">${error.message}</div>`;
        }
    }

    function renderBooks(books) {
        if (books.length === 0) {
            bookList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:#64748b;">No books found matching your criteria.</div>`;
            return;
        }

        let html = '';
        books.forEach(book => {
            html += `
            <div style="background:white; border-radius:15px; padding:1.5rem; text-align:center; transition: transform 0.2s; box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);"
                onmouseover="this.style.transform='translateY(-5px)'"
                onmouseout="this.style.transform='translateY(0)'">
                
                <div style="width:100px; height:140px; background:#e2e8f0; margin:0 auto 1rem auto; border-radius:5px; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-book" style="font-size:3rem; color:#94a3b8;"></i>
                </div>
                
                <h3 style="font-size:1rem; margin:0 0 5px 0; color:#2d3748; font-weight:600; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" title="${book.title}">${book.title}</h3>
                <p style="font-size:0.85rem; color:#64748b; margin:0 0 10px 0;">${book.author}</p>
                
                <div style="margin-bottom:10px;">
                    <span style="font-size:0.75rem; background:#f3f4f6; color:#4b5563; padding:2px 8px; border-radius:10px;">${book.category}</span>
                </div>
            </div>
            `;
        });

        bookList.innerHTML = html;
    }
});
