import assert from 'assert';
import fs from 'fs-extra';
import { GoogleSpreadsheet } from 'google-spreadsheet';
const { readFile } = fs;
import * as dotenv from 'dotenv';

dotenv.config();

// *** Constants ***

const CREDENTIALS_PATH = 'goblincraft-188907-71d45950f398.json';

const spreadsheetUrl = process.env.SHEET_URL;

// Our spell toons aren't named "ClericSpells", they're named "Clrspells", so
// the script needs to be able to "translate"
const partialClassNamesToFull = {
  Clrscrolls: 'Cleric',
  Collectinthings: 'Hybrid',
  Druscrolls: 'Druid',
  Encscrolls: 'Enchanter',
  Magscrolls: 'Magician',
  Necscrolls: 'Necromancer',
  Shmscrolls: 'Shaman',
  Wizscrolls: 'Wizard',
};
// Add one class's worth of spells to the spreadsheet (cleaing any existing)
const addSpells = async (doc, spells, className) => {
  const sheet = doc.sheetsByTitle[className];
  await sheet.clear();
  await sheet.setHeaderRow([
    'Spell Name',
    'Toon',
    'Price Estimate',
    'Last updated ' + new Date(),
  ]);
  const newSpellRows = spells.map((spell) => [
    spell.name,
    spell.toon,
    spell.price,
  ]);
  await sheet.addRows(newSpellRows);
  console.log(`Added ${newSpellRows.length} ${className} spells`);
};

// Use the Google API to get access to the spell spreadsheet document
const getDoc = async () => {
  try {
    const doc = new GoogleSpreadsheet(spreadsheetUrl);

    const credentials = JSON.parse(await readFile(CREDENTIALS_PATH, 'utf8'));
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo(); // loads document properties and worksheets
    return doc;
  } catch (err) {
    console.error('Error getting doc');
    throw err;
  }
};

// For each class, add its spells to the spreadsheet document
export const fillInSheet = async (spellsByClass) => {
  let doc;

  doc = await getDoc(); // Get the spreadsheet
  if (!doc) return;

  for (let className in spellsByClass) {
    console.log(`adding ${className} spells`);
    const sortedSpells = spellsByClass[className].sort((left, right) => {
      return left.name > right.name ? 1 : -1;
    });
    console.log(sortedSpells);
    await addSpells(doc, sortedSpells, className);
  }
};
