
import Document from '../models/Document.js';
import User from '../models/User.js';

// @desc    Upload a new document
// @route   POST /api/documents
// @access  Private (Student/Hosteler)
export const uploadDocument = async (req, res) => {
    try {
        const { title, type, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const document = await Document.create({
            user: req.user._id,
            title,
            type,
            description,
            fileUrl: `/uploads/documents/${req.file.filename}`
        });

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my documents
// @route   GET /api/documents
// @access  Private
export const getMyDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await document.deleteOne();
        res.json({ message: 'Document removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
