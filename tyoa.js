// Import Modules
import { TyoaItemSheet } from "./module/item/item-sheet.js";
import { TyoaActorSheetCharacter } from "./module/actor/character-sheet.js";
import { TyoaActorSheetMonster } from "./module/actor/monster-sheet.js";
import { TyoaActorSheetFaction } from "./module/actor/faction-sheet.js";
import { preloadHandlebarsTemplates } from "./module/preloadTemplates.js";
import { TyoaActor } from "./module/actor/entity.js";
import { TyoaItem } from "./module/item/entity.js";
import { TYOA } from "./module/config.js";
import { registerSettings } from "./module/settings.js";
import { registerHelpers } from "./module/helpers.js";
import * as chat from "./module/chat.js";
import * as treasure from "./module/treasure.js";
import * as macros from "./module/macros.js";
import * as party from "./module/party.js";
import { TyoaCombat } from "./module/combat.js";
import * as migrations from "./module/migration.js";
import { TyoaItemProxy } from "./module/item/item-proxy.js";
import { TyoaActorProxy } from "./module/actor/actor-proxy.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "2d6 + @initiative.value",
    decimals: 2,
  };

  CONFIG.TYOA = TYOA;

  game.tyoa = {
    rollItemMacro: macros.rollItemMacro,
  };

  // Custom Handlebars helpers
  registerHelpers();

  // Register custom system settings
  registerSettings();

  CONFIG.Actor.documentClass = TyoaActorProxy;
  CONFIG.Item.documentClass = TyoaItemProxy;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("tyoa", TyoaActorSheetCharacter, {
    types: ["character"],
    makeDefault: true,
    label: "TYOA.SheetClassCharacter"
  });
  Actors.registerSheet("tyoa", TyoaActorSheetMonster, {
    types: ["monster"],
    makeDefault: true,
    label: "TYOA.SheetClassMonster"
  });
  Actors.registerSheet("tyoa", TyoaActorSheetFaction, {
    types: ["faction"],
    makeDefault: true,
    label: "TYOA.SheetClassFaction"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("tyoa", TyoaItemSheet, {
    makeDefault: true,
    label: "TYOA.SheetClassItem"
  });

  await preloadHandlebarsTemplates();
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function () {
  // Localize CONFIG objects once up-front
  const toLocalize = ["armor", "weightless", "colors", "tags", "skills", "attackSkills", "encumbLocation", "assetTypes", "assetMagic"];
  for (let o of toLocalize) {
    CONFIG.TYOA[o] = Object.entries(CONFIG.TYOA[o]).reduce((obj, e) => {
      obj[e[0]] = game.i18n.localize(e[1]);
      return obj;
    }, {});
  }
});

Hooks.once("ready", async () => {
  Hooks.on("hotbarDrop", (bar, data, slot) =>
    macros.createTyoaMacro(data, slot)
  );

  // Check migration
  if ( !game.user.isGM ) return;
  const currentVersion = game.settings.get("tyoa", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = "0.1.0";
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if ( !currentVersion && totalDocuments === 0 ) return game.settings.set("tyoa", "systemMigrationVersion", game.system.version);
  const needsMigration = !currentVersion || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);

  if (needsMigration) {
    migrations.migrateWorld();
  }

});

// License and KOFI infos
Hooks.on("renderSidebarTab", async (object, html) => {
  if (object instanceof ActorDirectory) {
    party.addControl(object, html);
  }
  if (object instanceof Settings) {
    let gamesystem = html.find("#game-details");
    // SRD Link
    let tyoa = gamesystem.find('h4').last();
    tyoa.append(` <sub><a href="https://oldschoolessentials.necroticgnome.com/srd/index.php">SRD<a></sub>`);

    // License text
    const template = "systems/tyoa/templates/chat/license.html";
    const rendered = await renderTemplate(template);
    gamesystem.find(".system").append(rendered);
    
  }
});

Hooks.on("preCreateCombatant", (combat, data, options, id) => {
  let init = game.settings.get("tyoa", "initiative");
  if(init === "group") {
    TyoaCombat.addCombatant(combat, data, options, id);
  }
});

Hooks.on("updateCombatant", TyoaCombat.updateCombatant);
Hooks.on("renderCombatTracker", TyoaCombat.format);
Hooks.on("preUpdateCombat", TyoaCombat.preUpdateCombat);
Hooks.on("getCombatTrackerEntryContext", TyoaCombat.addContextEntry);
Hooks.on("preCreateToken", TyoaCombat.preCreateToken);

Hooks.on("renderChatLog", (app, html, data) => TyoaItem.chatListeners(html));
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
Hooks.on("renderChatMessage", chat.addChatMessageButtons);
Hooks.on("renderRollTableConfig", treasure.augmentTable);
Hooks.on("updateActor", party.update);