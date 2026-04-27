const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
    host: process.env.STMP_HOST,
    port: process.env.STMP_PORT,
    secure: false,
    auth: {
        user: process.env.STMP_USER,
        pass: process.env.STMP_PASS
    }
});

exports.sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: `HR Management System <${process.env.STMP_USER}>`,
            to,
            subject,
            text
        });
    } catch (err) {
        logger.error('Error sending email:', {
            to,
            subject,
            error: err.message
        });
    }
};