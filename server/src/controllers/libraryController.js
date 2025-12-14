import Book from '../models/Book.js';

// @desc    Get Books with Filters
// @route   GET /api/library
export const getBooks = async (req, res) => {
    try {
        const { search, category, availableOnly } = req.query;

        let query = {};

        // 1. Search Filter (Title or Author or ISBN)
        if (search) {
            // Constraint: Minimum 1 character
            if (search.length < 1) {
                return res.status(400).json({ message: 'Search query must be at least 1 character long.' });
            }

            // Constraint: Escape Regex Characters for safety
            const escapeRegex = (string) => {
                return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            };

            const cleanSearch = escapeRegex(search);
            const searchRegex = new RegExp(cleanSearch, 'i');

            // Constraint: Search by Title Only
            query.title = searchRegex;
        }

        // 2. Category Filter
        if (category && category !== 'All') {
            query.category = category;
        }

        // 3. Availability Filter
        if (availableOnly === 'true') {
            query.availableCopies = { $gt: 0 };
        }

        // Constraint: Limit results to 50
        const books = await Book.find(query).sort({ title: 1 }).limit(50);
        res.json(books);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a Book (Admin/Teacher only - optional for now but good to have)
// @route   POST /api/library
export const addBook = async (req, res) => {
    try {
        const book = new Book(req.body);
        const savedBook = await book.save();
        res.status(201).json(savedBook);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
