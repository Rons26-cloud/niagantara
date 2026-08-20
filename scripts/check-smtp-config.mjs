const value = (name) => process.env[name]?.trim() ?? '';

const host = value('SMTP_HOST');
const port = value('SMTP_PORT');
const user = value('SMTP_USER');
const password = value('SMTP_PASSWORD');
const fromEmail = value('SMTP_FROM_EMAIL').toLowerCase();
const fromName = value('SMTP_FROM_NAME');
const secure = value('SMTP_SECURE').toLowerCase();

const portNumber = Number(port);
const portValid = Number.isInteger(portNumber) && portNumber >= 1 && portNumber <= 65535;
const secureValid = ['true', 'false'].includes(secure);
const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail);
const configPresent = Boolean(host && port && user && fromEmail && fromName && secure);
const secretPresent = password.length > 0;
const ready = configPresent && secretPresent && portValid && secureValid && emailValid;

const yesNo = (condition) => condition ? 'YES' : 'NO';

console.log(`SMTP_CONFIG_PRESENT = ${yesNo(configPresent)}`);
console.log(`SMTP_SECRET_PRESENT = ${yesNo(secretPresent)}`);
console.log(`SMTP_FROM_VALID = ${yesNo(emailValid)}`);
console.log(`CUSTOM_SMTP_READY = ${yesNo(ready)}`);
