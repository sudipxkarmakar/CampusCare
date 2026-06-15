import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdfsDir = path.join(__dirname, '../../docs/assets/pdfs');

if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
}

const booksToCreate = [
    { filename: 'building_materials.pdf', title: 'Building Materials', author: 'S.K. Duggal' },
    { filename: 'clean_code.pdf', title: 'Clean Code', author: 'Robert C. Martin' },
    { filename: 'design_patterns.pdf', title: 'Design Patterns', author: 'Erich Gamma' },
    { filename: 'digital_logic.pdf', title: 'Digital Logic Design', author: 'Morris Mano' },
    { filename: 'fluid_mechanics.pdf', title: 'Fluid Mechanics', author: 'Frank M. White' },
    { filename: 'harry_potter.pdf', title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling' },
    { filename: 'algorithms.pdf', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein' },
    { filename: 'great_gatsby.pdf', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { filename: 'electronic_devices.pdf', title: 'Electronic Devices', author: 'Thomas L. Floyd' },
    { filename: 'concrete_technology.pdf', title: 'Concrete Technology', author: 'M.S. Shetty' },
    { filename: 'node_express.pdf', title: 'Web Development with Node & Express', author: 'Ethan Brown' },
    { filename: 'thermodynamics.pdf', title: 'Fundamentals of Thermodynamics', author: 'Claus Borgnakke' },
    { filename: 'electromagnetics.pdf', title: 'Principles of Electromagnetics', author: 'Matthew N.O. Sadiku' },
    { filename: 'structural_analysis.pdf', title: 'Structural Analysis', author: 'Russell C. Hibbeler' },
    { filename: 'hobbit.pdf', title: 'The Hobbit', author: 'J.R.R. Tolkien' }
];

function createMinimalPDF(filename, bookTitle, author) {
    const text = `BT /F1 18 Tf 50 750 Td (CampusCare E-Library) Tj 0 -35 Td (Title: ${bookTitle}) Tj 0 -25 Td (Author: ${author}) Tj 0 -40 Td (This is a preview version of the e-book available for digital reading.) Tj ET`;
    
    const header = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${text.length} >>\nstream\n${text}\nendstream\nendobj\n`;
    
    const obj1 = header.indexOf('1 0 obj');
    const obj2 = header.indexOf('2 0 obj');
    const obj3 = header.indexOf('3 0 obj');
    const obj4 = header.indexOf('4 0 obj');
    
    const pad = (num, size) => ('0000000000' + num).slice(-size);
    const xref = `xref\n0 5\n0000000000 65535 f \n${pad(obj1, 10)} 00000 n \n${pad(obj2, 10)} 00000 n \n${pad(obj3, 10)} 00000 n \n${pad(obj4, 10)} 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${header.length}\n%%EOF\n`;
    
    fs.writeFileSync(path.join(pdfsDir, filename), header + xref);
    console.log(`Created PDF: ${filename}`);
}

booksToCreate.forEach(b => {
    createMinimalPDF(b.filename, b.title, b.author);
});

console.log("All E-book PDFs successfully created.");
