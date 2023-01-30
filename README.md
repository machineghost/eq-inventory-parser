# eq-inventory-parser

## Setup

Before you can use this script you need to sign up for a Google Developer's API account, specifically for the Google Sheets API (https://developers.google.com/sheets/api/reference/rest).  You then need to download a JSON credentials file (https://developers.google.com/workspace/guides/create-credentials).

Once you have your credentials file ...

**1.** Change line 34 of the file `spells.js` to reflect the names of your spell toons (ie. spell-holding characters).  Kingdom named their toons Kingdomspellsa, Kingdomspellsb, etc., so the code currently reads:

    const spellToonNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(
      (letter) => `Kingdomspells${letter}`
    );
    
but you probably want to change that to something like:

    const spellToonNames = ['firstSpellToon', 'secondSpellToon'] // ...
    
**Future TODO:** Make the above into an environmental variable (or make a separate config file)

**2.** Create a Google Sheet, with tabs for every spell-casting class

**3.** Edit the file `.env` and set the three environmental variables for
  * the `CREDENTIALS_PATH` (ie. where the credentials file is on your computer
  * the `SHEET_URL` (not the full URL of your Google Sheet, just the unique part at the end
  ** NOTE: You can switch this variable to use a test spreadsheet before you use your actual one
  * the `EQ_DIRECTORY` (ie. the path to your EQ directory, where the output files are located)

## Usage

Once the script is configured properly, running it is as simple as running:

    npm start
    
from the command line (from the project's folder).

When you do this, the script will ...

1. check the output inventory files of all of your spell toons (to see what spells they have)

2. go get the prices of those spells from the wiki (if any), and save them in a `db.json` file (so it doesn't hit the wiki unecessarily)

3. it will update the spreadsheet to show what spells the spell toons have, by class.    
