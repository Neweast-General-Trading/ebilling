#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '../server/.env');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { sendMail, resolveMailRecipient } = require('../server/dist/config/mail.config');

async function main() {
  const subject = 'Excess approval #1 completed — INV2038345804 sent to Oracle';
  const html = `<p>All approval levels are complete for excess request <strong>#1</strong>.</p>
<ul>
<li><strong>Invoice:</strong> INV2038345804</li>
<li><strong>Employee:</strong> Guru Gopalan (0581093603)</li>
<li><strong>Month:</strong> Jun 2026</li>
<li><strong>Invoice total:</strong> AED 116.00</li>
<li><strong>Package:</strong> AED 105.00</li>
<li><strong>Personal usage:</strong> AED 11.00</li>
<li><strong>Official usage:</strong> AED 0.00</li>
<li><strong>Exceeded:</strong> AED 11.00</li>
<li><strong>Oracle:</strong> Personal recovery sent successfully</li>
<li><strong>Approvers:</strong> L1 Jad Sakour, L2 Guru Gopalan</li>
</ul>
<p>The personal excess amount has been sent to Oracle recovery.</p>
<p><a href="https://ebilling.neweast.cloud/approval-request">Open Approval Request</a></p>`;

  const recipients = ['sakour@neweast.com', 'guru@neweast.com'];
  for (const email of recipients) {
    const { deliverTo } = resolveMailRecipient(email);
    const info = await sendMail({ to: deliverTo, subject, html });
    console.log(`Sent to ${email} -> ${deliverTo}:`, info.messageId || info.response);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
