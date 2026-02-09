
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getHodDashboardStats } from '../src/controllers/hodController.js';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

import fs from 'fs';
const logFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'verify_fix_log.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
};

const verifyFix = async () => {
    try {
        fs.writeFileSync(logFile, 'Starting verification...\n');
        log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        log('Connected.');

        const hod = await User.findOne({ role: 'hod' });
        if (!hod) {
            log('No HOD found to test with.');
            return;
        }

        log(`Testing controller with HOD: ${hod.name}`);

        const req = {
            user: hod
        };

        const res = {
            status: (code) => {
                log(`Response Status: ${code}`);
                return {
                    json: (data) => {
                        log('Response JSON:');
                        log(data);
                    }
                };
            },
            json: (data) => {
                log('Response JSON:');
                log(data);
            }
        };

        log('Calling getHodDashboardStats...');
        await getHodDashboardStats(req, res);
        log('Controller call finished successfully.');

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyFix();
