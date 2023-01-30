import { fillInSheet } from './spreadsheet.js';
import { getSpells } from './spells.js';

// HACK/SECURITY RISK!!!
// Problem: the wiki has bad security certs
// (so bad that Node gets an error if you try and fetch them)
// Solution: We *could* download the certs here, but that's more work.
// This hack instead turns off security checks for fetches. The risk of a "man
// in the middle" attack on the p99 wiki is low enough to not care.
// @see https://stackoverflow.com/questions/31673587/error-unable-to-verify-the-first-certificate-in-nodejs
//      (@satara answer)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

// *** Error Handling Helper ***

// Logs all errors, but only the relevant bit of Google ones, and then re-throws
const logError = (error) => {
  if (error.config) {
    // Google errors are huge; only log the relevant part
    console.log('Google Error!');
    console.log(error.response.data.error);
  } else {
    console.error(error);
  }

  throw new Error('Stopped because of an error');
};

// Main
(async () => {
  // try {
  const spellsByClass = await getSpells(); // Get spells from inventory output files

  await fillInSheet(spellsByClass); // Fill in the spreadsheet with the spells
  // } catch (error) {
  //   console.error(error);
  //   logError(error);
  // }
})();
