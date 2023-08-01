const { google } = require('googleapis');
const { authorize } = require('./auth');
const Email = require('../models/email');

function getMessageData(message) {
    if (message.data.payload.parts) {
        const textPart = message.data.payload.parts.find((part) => part.mimeType === 'text/plain');
        const htmlPart = message.data.payload.parts.find((part) => part.mimeType === 'text/html');

        if (textPart) {
            return textPart.body.data;
        } else if (htmlPart) {
            return htmlPart.body.data;
        }
    } else if (message.data.payload.body) {
        return message.data.payload.body.data;
    }
}

async function fetchEmails(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:inbox', // Modify this query as needed
    });

    const emails = response.data.messages || [];

    for (const email of emails) {
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: email.id,
        });

        try {
            const messageData = getMessageData(message);
            const messageBuffer = messageData ? Buffer.from(messageData, 'base64') : '';
            const emailData = {
                messageId: message.data.id,
                threadId: message.data.threadId,
                subject: message.data.payload.headers.find((header) => header.name === 'Subject').value,
                from: message.data.payload.headers.find((header) => header.name === 'From').value,
                to: message.data.payload.headers.find((header) => header.name === 'To').value,
                date: new Date(parseInt(message.data.internalDate)),
                message: messageBuffer.toString(),
            };

            await Email.create(emailData);
        } catch (error) {
            console.error('Error parsing email:', error);
        }
    }
}

(async () => {
    const auth = await authorize();
    await fetchEmails(auth);
})();
