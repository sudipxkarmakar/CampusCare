import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const policyPath = path.resolve(__dirname, '../../config/complaintEligibilityPolicies.json');
const complaintEligibilityPolicies = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

const norm = (value) => String(value || '').trim().toLowerCase();
const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const roleIsHosteller = (user = {}) => (
    norm(user.role) === 'hosteler' ||
    norm(user.role) === 'hosteller' ||
    (hasValue(user.hostelName) && hasValue(user.roomNumber))
);

const booleanish = (value) => value === true || ['true', 'yes', 'active', 'subscribed'].includes(norm(value));

const roomMatches = (user = {}, fields = {}) => {
    const requestedRoom = fields.room || fields.roomNumber;
    const requestedBuilding = fields.building || fields.hostelName;

    if (requestedRoom && hasValue(user.roomNumber) && norm(requestedRoom) !== norm(user.roomNumber)) return false;
    if (requestedBuilding && hasValue(user.hostelName) && norm(requestedBuilding) !== norm(user.hostelName)) return false;

    return hasValue(user.roomNumber) || !requestedRoom;
};

const conditionChecks = {
    isHosteller: ({ user }) => roleIsHosteller(user),
    messSubscriber: ({ user }) => booleanish(user?.messSubscriber) || booleanish(user?.isMessSubscriber) || roleIsHosteller(user),
    ownsRoom: ({ user, fields }) => roleIsHosteller(user) && roomMatches(user, fields),
    assignedDepartment: ({ user }) => hasValue(user?.department)
};

const formatEligibilityMessage = ({ category, policy, failedReasons, roleAllowed }) => {
    if (category === 'Electrical') {
        return [
            'Based on your profile, hostel room maintenance requests are handled through the Hostel Maintenance module.',
            'Would you like me to open it instead?',
            ...failedReasons,
            policy.alternativeAction ? `Suggested next step: ${policy.alternativeAction}` : null
        ].filter(Boolean).join('\n');
    }

    if (category === 'Mess') {
        return [
            'Based on your profile, mess complaints are available only for active mess subscribers.',
            'You can open Cafeteria Feedback, contact Student Welfare, or continue with a general food-safety report if this affected campus safety.',
            ...failedReasons,
            policy.alternativeAction ? `Suggested next step: ${policy.alternativeAction}` : null
        ].filter(Boolean).join('\n');
    }

    const lines = [
        `You cannot raise a ${category} complaint from this account.`,
        ...(!roleAllowed ? [`Your role is not allowed for this complaint category.`] : []),
        ...failedReasons,
        policy.alternativeAction ? `Suggested next step: ${policy.alternativeAction}` : null
    ].filter(Boolean);

    return lines.join('\n');
};

class PolicyEngine {
    constructor() {
        this.policies = [];
        this.complaintPolicies = complaintEligibilityPolicies;
    }

    registerPolicy(policy) {
        this.policies.push(policy);
    }

    async evaluate(context, capabilityId) {
        const matching = this.policies.filter(p => p.capabilityId === capabilityId);
        for (const policy of matching) {
            const check = await policy.rule(context);
            if (!check.allowed) {
                return { success: false, reason: check.reason };
            }
        }
        return { success: true };
    }

    getComplaintPolicy(category) {
        const categories = this.complaintPolicies?.categories || {};
        return categories[category] || categories.Other;
    }

    evaluateComplaintEligibility({ user, category, fields = {} }) {
        const normalizedCategory = category || 'Other';
        const policy = this.getComplaintPolicy(normalizedCategory);
        if (!policy) {
            return {
                success: false,
                category: normalizedCategory,
                reason: `No eligibility policy is configured for ${normalizedCategory} complaints.`
            };
        }

        const userRole = norm(user?.role);
        const allowedRoles = policy.allowedRoles || [];
        const roleAllowed = allowedRoles.map(norm).includes(userRole);
        const failedReasons = [];

        for (const conditionName of policy.requiredConditions || []) {
            const check = conditionChecks[conditionName];
            const passed = check ? check({ user, fields }) : false;
            if (!passed) {
                const meta = this.complaintPolicies?.conditions?.[conditionName] || {};
                failedReasons.push(meta.failureReason || `Required condition failed: ${conditionName}.`);
            }
        }

        if (!roleAllowed || failedReasons.length) {
            return {
                success: false,
                category: normalizedCategory,
                reason: formatEligibilityMessage({ category: normalizedCategory, policy, failedReasons, roleAllowed }),
                alternativeAction: policy.alternativeAction,
                failedConditions: failedReasons
            };
        }

        return {
            success: true,
            category: normalizedCategory,
            policy
        };
    }
}

export default new PolicyEngine();
