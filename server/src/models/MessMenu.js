import mongoose from 'mongoose';

const messMenuSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
        unique: true, // One entry per day usually
    },
    breakfast: {
        type: String,
        required: true,
    },
    lunch: {
        type: String,
        required: true,
    },
    snacks: {
        type: String,
        required: true,
    },
    dinner: {
        type: String,
        required: true,
    },
    special: {
        type: String, // Special items if any
    }
}, { timestamps: true });

const MessMenu = mongoose.model('MessMenu', messMenuSchema);
export default MessMenu;
