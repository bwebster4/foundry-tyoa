export const registerSettings = function () {

  game.settings.register("tyoa", "randomHP", {
    name: game.i18n.localize("TYOA.Setting.RandomHP"),
    hint: game.i18n.localize("TYOA.Setting.RandomHPHint"),
    default: false,
    scope: "client",
    type: Boolean,
    config: true,
    requiresReload: true
  });

  game.settings.register("tyoa", "initiative", {
    name: game.i18n.localize("TYOA.Setting.Initiative"),
    hint: game.i18n.localize("TYOA.Setting.InitiativeHint"),
    default: "group",
    scope: "world",
    type: String,
    config: true,
    choices: {
      individual: "TYOA.Setting.InitiativeIndividual",
      group: "TYOA.Setting.InitiativeGroup",
    },
    requiresReload: true
  });

  game.settings.register("tyoa", "rerollInitiative", {
    name: game.i18n.localize("TYOA.Setting.RerollInitiative"),
    hint: game.i18n.localize("TYOA.Setting.RerollInitiativeHint"),
    default: "keep",
    scope: "world",
    type: String,
    config: true,
    choices: {
      keep: "TYOA.Setting.InitiativeKeep",
      reset: "TYOA.Setting.InitiativeReset",
      reroll: "TYOA.Setting.InitiativeReroll",
    }
  });

  game.settings.register("tyoa", "movementRate", {
    name: game.i18n.localize("TYOA.Setting.MovementRate"),
    hint: game.i18n.localize("TYOA.Setting.MovementRateHint"),
    default: "movetyoa",
    scope: "world",
    type: String,
    config: true,
    choices: {
      movetyoa: "TYOA.Setting.MoveTYOA",
      movebx: "TYOA.Setting.MoveBX",
    },
    requiresReload: true
  });

  game.settings.register("tyoa", "showMovement", {
    name: game.i18n.localize("TYOA.Setting.showMovement"),
    hint: game.i18n.localize("TYOA.Setting.showMovementHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    requiresReload: true
  });

  game.settings.register("tyoa", "morale", {
    name: game.i18n.localize("TYOA.Setting.Morale"),
    hint: game.i18n.localize("TYOA.Setting.MoraleHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: true,
  });

  game.settings.register("tyoa", "hideInstinct", {
    name: game.i18n.localize("TYOA.Setting.hideInstinct"),
    hint: game.i18n.localize("TYOA.Setting.hideInstinctHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true
  });

  game.settings.register("tyoa", "languageList", {
    name: game.i18n.localize("TYOA.Languages"),
    hint: game.i18n.localize("TYOA.LanguagesHint"),
    default: "Trade Cant,Ancient Vothian,Old Vothian,Modern Vothian,Ancient Olok,Brass Speech,Ancient Lin,Emedian,Ancient Osrin,Thurian,Ancient Khalan,Llaigisan,Anak Speech,Predecessant,Abased,Recurrent,Deep Speech",
    scope: "world",
    type: String,
    config: true,
  });

  game.settings.register("tyoa", "xpConfig", {
    name: game.i18n.localize("TYOA.Setting.xpConfig"),
    hint: game.i18n.localize("TYOA.Setting.xpConfigHint"),
    default: "xpFast",
    scope: "world",
    type: String,
    config: true,
    choices: {
      xpFast: "TYOA.Setting.xpFast",
      xpSlow: "TYOA.Setting.xpSlow",
      xpCustom: "TYOA.Setting.xpCustom"
    },
    requiresReload: true
  });

  game.settings.register("tyoa", "xpCustomList", {
    name: game.i18n.localize("TYOA.Setting.xpCustomList"),
    hint: game.i18n.localize("TYOA.Setting.xpCustomListHint"),
    default: [
      2000,
      4000,
      8000,
      16000,
      32000,
      64000,
      120000,
      240000,
      360000,
      480000,
      600000,
      720000,
      840000
    ],
    scope: "world",
    type: String,
    config: true,
    requiresReload: true
  });

  game.settings.register("tyoa", "currencyTypes", {
    name: game.i18n.localize("TYOA.items.Currency"),
    hint: game.i18n.localize("TYOA.items.CurrencyHint"),
    default: "currencytyoa",
    scope: "world",
    type: String,
    config: true,
    choices: {
      currencytyoa: "TYOA.Setting.CurrencyTYOA",
      currencybx: "TYOA.Setting.CurrencyBX",
    },
    requiresReload: true
  });

  game.settings.register("tyoa", "systemMigrationVersion", {
    config: false,
    scope: "world",
    type: String,
    default: ""
  });
};
