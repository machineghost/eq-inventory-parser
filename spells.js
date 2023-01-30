import assert from 'assert';
import cheerio from 'cheerio';
import { promisify } from 'util';

import fs from 'fs-extra';
import { JSONFile, Low } from 'lowdb';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { readFile } = fs;
import * as dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const sleep = promisify(setTimeout);

const randomNumber = (max) => {
  return Math.floor(Math.random() * max);
};

// The path to the EQ folder on your computer
const EQ_ROOT = process.env.EQ_DIRECTORY;

// Use JSON file for storage
const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

db.data ||= { spells: {} }; // Node >= 15.x

// const spellToonPartialNames = Object.keys(partialClassNamesToFull);
const spellToonNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(
  (letter) => `Kingdomspells${letter}`
);
const store = async (key, value) => {
  // Read data from JSON file, this will set db.data content
  await db.read();

  if (value) {
    db.data.spells[key] = value;
    await db.write();
  }

  return db.data.spells[key];
};

// *** Helpers ***

// Determine if a line from the file is a line for an item (not contianer) slot
const isItemSlot = (line) => !!line.match(/^General\d/);

// Determines if a line specifically holds a spell
const isASpellOrSong = (line) =>
  line.includes('Spell: ') || line.includes('Song: ');

// Extract the spell name from the rest of the line
const extractSpell = (line) => {
  // NOTE: The regex includes ":", "'" and "`" as they aren't words or space
  const spell = line.match(/((?:Song|Spell): [\w\s:`']*?)\s+\d/)?.[1];
  assert(spell, `Unable to parse: ${line}`);
  return spell;
};

// Parses one class's worth of spells from an inventory output file
const parseSpells = async (characterName) => {
  console.log(`Parsing ${characterName} spells`);
  try {
    const fileName = `${characterName}-Inventory.txt`;
    const allLines = await readFile(`${EQ_ROOT}/${fileName}`, 'utf8');

    const lines = allLines.split('\r\n');
    const itemLines = lines.filter(isItemSlot);
    const spellLines = itemLines.filter(isASpellOrSong);
    const spells = spellLines.map(extractSpell).sort();
    // printedSpells += `\n\n${characterName}\n`
    return spells;
    // await Promise.all(spells.map(spell => printedSpells += spell + '\n'))
  } catch (error) {
    console.error(`\nCouldn't find spell output for ${characterName}`);
    // logError(error);
  }
};

// need to start over
// phase #1: get an array of objects with spell name and toon that has it
// #2: check each spell ...
//  if we have its data, add it (with data) to the list
// if not, get its data, add it (with data) to the list
// #3:

const lookupSpellInWiki = async (spellName) => {
  console.log(`Looking up ${spellName} in wiki`);
  if (spellName.startsWith('Spell: '))
    spellName = spellName.substr('Spell: '.length);

  if (spellName.includes('Tears of Prexus')) spellName = `Spell:${spellName}`;

  const fixedName = spellName.replaceAll(' ', '_').replaceAll('`', `'`);
  const url = `https://wiki.project1999.com/${fixedName}`;
  const response = await fetch(url);
  const wikiHtml = await response.text();
  const $ = cheerio.load(wikiHtml);

  // Determine classes
  const classLIs = $('#Classes').parent().next().children();
  assert(classLIs.length, `Couldn't find class info for ${spellName} (${url})`);
  const classes = classLIs
    .text()
    .split('\n') // ' Druid - Level 5', ''
    .filter((x) => x) // ' Druid - Level 5',
    .map((x) => x.trim().split('-')[0].trim()); // 'Druid'

  // Determine price
  const ninetyDayTd = $('#auc_Green table tbody tr td:eq(1)');
  let price;
  try {
    const priceText = ninetyDayTd.text().split('±')[0];
    price = Number(priceText);
    // price = Math.round(price / 100) * 100; // round off to the nearest 100
  } catch (err) {}

  await sleep(randomNumber(5) * 1000); // wait 1-5 seconds so we don't overload wiki

  return { name: spellName, classes, price };
};

const lookupSpell = async (spellName) => {
  const existingData = await store(spellName);
  if (!existingData /* TODO : || isStale(existingData) */) {
    console.log(`didn't have "${spellName}" in cache`);
    const spell = await lookupSpellInWiki(spellName);
    await store(spellName, { ...spell, updated: new Date() });
  }
  // return spell data from local
  return await store(spellName);
};

// Build an object of:
// { Clr: arrayOfClericSpellNames, Dru: arrayOfDruidSpellNames, etc. }
// by parsing the spells for each class from their inventory output file
export const getSpells = async () => {
  const spells = [];
  for (let toonName of spellToonNames) {
    try {
      const spellNames = await parseSpells(toonName);
      if (spellNames) {
        for (let spellName of spellNames) {
          if (!spellName.startsWith('Spell:')) continue;
          const spell = await lookupSpell(spellName);
          spell.toon = toonName;
          spells.push(spell);
        }
      }
    } catch (err) {
      console.error(err);
      console.error(`Couldn't find output inventory file for ${toonName}`);
    }
  }
  const spellsByClass = spells.reduce((spellsByClass, spell) => {
    spell.classes.forEach((clazz) => {
      spellsByClass[clazz] ||= [];
      spellsByClass[clazz].push(spell);
    });
    return spellsByClass;
  }, {});
  return spellsByClass;
};
