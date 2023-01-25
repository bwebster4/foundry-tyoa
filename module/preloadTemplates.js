export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        //Character Sheets
        'systems/tyoa/templates/actors/character-sheet.html',
        'systems/tyoa/templates/actors/monster-sheet.html',
        'systems/tyoa/templates/actors/faction-sheet.html',
        //Actor partials
        //Sheet tabs
        'systems/tyoa/templates/actors/partials/character-header.html',
        'systems/tyoa/templates/actors/partials/character-attributes-tab.html',
        'systems/tyoa/templates/actors/partials/character-techniques-tab.html',
        'systems/tyoa/templates/actors/partials/character-inventory-tab.html',
        'systems/tyoa/templates/actors/partials/character-notes-tab.html',

        'systems/tyoa/templates/actors/partials/monster-header.html',
        'systems/tyoa/templates/actors/partials/monster-attributes-tab.html',

        'systems/tyoa/templates/actors/partials/faction-assets.html'
    ];
    return loadTemplates(templatePaths);
};
