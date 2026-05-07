import crypto from 'crypto';
import RedisManager from './RedisManager.js';
import AIActionLog from '../../../models/AIActionLog.js';
import { EXECUTION_STATUS } from '../../../constants/aiConstants.js';

const WATCHDOG_STARTUP_DELAY_MS = 30000;
const SWEEP_INTERVAL_MS = 60000;
const STUCK_EXECUTION_THRESHOLD_MS = 60000; // 1 minute
const STUCK_PENDING_THRESHOLD_MS = 300000; // 5 minutes (matches Redis TTL)
const BATCH_SIZE = 100;

class WorkflowWatchdog {
    constructor() {
        this.active = false;
        this.timer = null;
    }

    start() {
        if (this.active) return;
        this.active = true;
        
        console.log(`[Watchdog] Initializing. Delaying first sweep by ${WATCHDOG_STARTUP_DELAY_MS}ms to allow cluster stabilization.`);
        
        setTimeout(() => {
            this._runSweepCycle();
            this.timer = setInterval(() => this._runSweepCycle(), SWEEP_INTERVAL_MS);
            this.timer.unref(); // Don't block process exit
        }, WATCHDOG_STARTUP_DELAY_MS).unref();
    }

    stop() {
        this.active = false;
        if (this.timer) clearInterval(this.timer);
    }

    async _runSweepCycle() {
        const leaseToken = crypto.randomUUID();
        const leaseAcquired = await RedisManager.client.set('ai:watchdog:primary', leaseToken, 'NX', 'EX', 60);
        
        if (leaseAcquired !== 'OK') {
            return; // Another replica holds the lease
        }

        let isSweeping = true;

        // Watchdog self-heartbeat
        const heartbeatInterval = setInterval(async () => {
            if (isSweeping) {
                const script = `
                    if redis.call("GET", KEYS[1]) == ARGV[1] then
                        return redis.call("EXPIRE", KEYS[1], ARGV[2])
                    else
                        return 0
                    end
                `;
                await RedisManager.client.eval(script, 1, 'ai:watchdog:primary', leaseToken, 60);
            }
        }, 30000);
        heartbeatInterval.unref();

        try {
            await this._sweepExecutingLogs();
            await this._sweepPendingLogs();
        } catch (err) {
            console.error('[Watchdog] Sweep cycle encountered an error:', err);
        } finally {
            isSweeping = false;
            clearInterval(heartbeatInterval);
            
            // Release lease using Compare-and-Delete Lua
            const script = `
                if redis.call("GET", KEYS[1]) == ARGV[1] then
                    return redis.call("DEL", KEYS[1])
                else
                    return 0
                end
            `;
            await RedisManager.client.eval(script, 1, 'ai:watchdog:primary', leaseToken);
        }
    }

    async _sweepExecutingLogs() {
        let lastProcessedId = null;
        let processedCount = 0;
        const cutoffTime = new Date(Date.now() - STUCK_EXECUTION_THRESHOLD_MS);

        while (true) {
            const query = {
                executionStatus: EXECUTION_STATUS.EXECUTING,
                updatedAt: { $lt: cutoffTime }
            };
            
            if (lastProcessedId) {
                query._id = { $gt: lastProcessedId };
            }

            const stuckLogs = await AIActionLog.find(query).sort({ _id: 1 }).limit(BATCH_SIZE);
            if (stuckLogs.length === 0) break;

            for (const log of stuckLogs) {
                // OCC Transition Guard
                const updated = await AIActionLog.findOneAndUpdate(
                    { _id: log._id, executionStatus: EXECUTION_STATUS.EXECUTING },
                    { 
                        $set: { 
                            executionStatus: EXECUTION_STATUS.EXECUTION_TIMEOUT,
                            errorMessage: "Workflow execution stalled and was forcefully swept.",
                            timeoutOrigin: "watchdog_sweep"
                        } 
                    }
                );
                
                if (updated) {
                    console.log(`[Watchdog] Recovered stuck execution: ${log._id} -> EXECUTION_TIMEOUT`);
                    processedCount++;
                }
                lastProcessedId = log._id;
            }
        }
        
        if (processedCount > 0) {
            console.log(`[Watchdog] Swept ${processedCount} stuck executing logs.`);
        }
    }

    async _sweepPendingLogs() {
        let lastProcessedId = null;
        let processedCount = 0;
        const cutoffTime = new Date(Date.now() - STUCK_PENDING_THRESHOLD_MS);

        while (true) {
            const query = {
                executionStatus: EXECUTION_STATUS.PENDING_CONFIRMATION,
                updatedAt: { $lt: cutoffTime }
            };
            
            if (lastProcessedId) {
                query._id = { $gt: lastProcessedId };
            }

            const stuckLogs = await AIActionLog.find(query).sort({ _id: 1 }).limit(BATCH_SIZE);
            if (stuckLogs.length === 0) break;

            for (const log of stuckLogs) {
                // Cross-check with Redis
                const pendingRedis = await RedisManager.getPendingAction(log.conversationId);
                
                if (!pendingRedis) {
                    // OCC Transition Guard
                    const updated = await AIActionLog.findOneAndUpdate(
                        { _id: log._id, executionStatus: EXECUTION_STATUS.PENDING_CONFIRMATION },
                        { $set: { executionStatus: EXECUTION_STATUS.EXPIRED } }
                    );
                    
                    if (updated) {
                        console.log(`[Watchdog] Expired orphaned pending confirmation: ${log._id}`);
                        processedCount++;
                    }
                }
                lastProcessedId = log._id;
            }
        }
    }
}

export const watchdog = new WorkflowWatchdog();
