const fs = require('fs');
const rules = JSON.parse(fs.readFileSync('rules.json')).rules;
const { authorize } = require('./auth');
const Email = require('../models/email');
const { google } = require('googleapis');

let gmail;

// condition types: Contains, Does not Contain, Equals, Does not equal, Less than, Greater than for days and months
function checkCondition(condition, email) {
    if (condition.operator === 'contains') {
        return email[condition.field].includes(condition.value);
    }

    if (condition.operator === 'does_not_contain') {
        return !email[condition.field].includes(condition.value);
    }

    if (condition.operator === 'equals') {
        return email[condition.field] === condition.value;
    }

    if (condition.operator === 'does_not_equal') {
        return email[condition.field] !== condition.value;
    }

    if (condition.operator === 'less_than_days') {
        const date = new Date(email[condition.field]);
        const days = condition.value;

        return date.getTime() < Date.now() - days * 24 * 60 * 60 * 1000;
    }

    if (condition.operator === 'greater_than_days') {
        const date = new Date(email[condition.field]);
        const days = condition.value;

        return date.getTime() > Date.now() - days * 24 * 60 * 60 * 1000;
    }

    if (condition.operator === 'less_than_months') {
        const date = new Date(email[condition.field]);
        const months = condition.value;

        return date.getTime() < Date.now() - months * 30 * 24 * 60 * 60 * 1000;
    }

    if (condition.operator === 'greater_than_months') {
        const date = new Date(email[condition.field]);
        const months = condition.value;

        return date.getTime() > Date.now() - months * 30 * 24 * 60 * 60 * 1000;
    }

    return false;
}

// Function to mark an email as read
async function markAsRead(messageId) {
    try {
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            resource: {
                removeLabelIds: ['UNREAD'],
            },
        });
        console.log('Email marked as read successfully.');
    } catch (error) {
        console.error('Error marking email as read:', error.message);
    }
}

// Function to mark an email as unread
async function markAsUnread(messageId) {
    try {
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            resource: {
                addLabelIds: ['UNREAD'],
            },
        });
        console.log('Email marked as unread successfully.');
    } catch (error) {
        console.error('Error marking email as unread:', error.message);
    }
}

// Function to archive an email
async function archiveEmail(messageId) {
    try {
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            resource: {
                removeLabelIds: ['INBOX']
            },
        });
        console.log('Email archived successfully.');
    } catch (error) {
        console.error('Error archiving email:', error.message);
    }
}

// Function to add a custom label to an email
async function addCustomLabel(messageId, labelName) {
    try {
        // Get the existing label with the given labelName
        const labelsResponse = await gmail.users.labels.list({
            userId: 'me',
        });

        const label = labelsResponse.data.labels.find((label) => label.name === labelName);

        if (label) {
            await gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                resource: {
                    addLabelIds: [label.id],
                },
            });
            console.log(`Label "${labelName}" added to the email successfully.`);
        } else {
            console.error(`Label "${labelName}" not found.`);
        }
    } catch (error) {
        console.error('Error adding label to the email:', error.message);
    }
}

function performActions(actions, email) {
    for (const action of actions) {
        if (action.type === 'mark_as_read') {
            markAsRead(email.messageId);
        }

        if (action.type === 'mark_as_unread') {
            markAsUnread(email.messageId);
        }

        if (action.type === 'archive') {
            archiveEmail(email.messageId);
        }

        if (action.type === 'add_label') {
            addCustomLabel(email.messageId, action.value);
        }
    }
}

function applyRules(email) {
    for (const rule of rules) {
        const { predicate, conditions, actions } = rule;

        if (predicate === 'All' && conditions.every((condition) => checkCondition(condition, email))) {
            performActions(actions, email);
        } else if (predicate === 'Any' && conditions.some((condition) => checkCondition(condition, email))) {
            performActions(actions, email);
        }
    }
}

// Function to fetch emails from the database
async function fetchEmailsFromDB() {
    try {
        const emails = await Email.findAll();
        return emails;
    } catch (error) {
        console.error('Error fetching emails from the database:', error);
        return [];
    }
}

// Fetch emails from the database and apply rules to each email
(async () => {
    gmail = google.gmail({ version: 'v1', auth: await authorize() });

    try {
        const emails = await fetchEmailsFromDB();

        for (const email of emails) {
            applyRules(email);
        }
    } catch (error) {
        console.error('Error fetching emails from the database:', error);
    }
})();
