
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPendingLeaves, getDepartmentComplaints } from '../src/controllers/hodController.js';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

import fs from 'fs';
const logFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'debug_lc_log.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
};

const debugEndpoints = async () => {
    try {
        fs.writeFileSync(logFile, 'Starting debug...\n');
        log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        log('Connected.');

        const hod = await User.findOne({ role: 'hod' });
        if (!hod) {
            log('No HOD found to test with.');
            return;
        }

        log(`Testing with HOD: ${hod.name}, Dept: ${hod.department}`);

        const req = {
            user: hod
        };

        const res = {
            status: (code) => {
                log(`Response Status: ${code}`);
                return res; // Chainable
            },
            json: (data) => {
                log('Response JSON (Summary):');
                if (Array.isArray(data)) {
                    log(`Array length: ${data.length}`);
                    if (data.length > 0) log(data[0]);
                } else {
                    log(data);
                }
                return res;
            }
        };

        log('--- Testing getPendingLeaves ---');
        try {
            await getPendingLeaves(req, res);
            log('getPendingLeaves finished.');
        } catch (e) {
            log('getPendingLeaves FAILED:');
            log(e);
        }

        log('--- Testing getDepartmentComplaints ---');
        try {
            await getDepartmentComplaints(req, res);
            log('getDepartmentComplaints finished.');
        } catch (e) {
            log('getDepartmentComplaints FAILED:');
            log(e);
        }

    } catch (error) {
        log('General Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugEndpoints();
