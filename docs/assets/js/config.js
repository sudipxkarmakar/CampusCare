const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === "" || window.location.protocol === 'file:';
window.CAMPUS_CARE_CONFIG = {
    API_BASE: isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com'
};
