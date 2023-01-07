export const TYOA = {
  scores: {
    str: "TYOA.scores.str.short",
    dex: "TYOA.scores.dex.short",
    con: "TYOA.scores.con.short",
    int: "TYOA.scores.int.short",
    wis: "TYOA.scores.wis.short",
    cha: "TYOA.scores.cha.short",
  },
  roll_type: {
    result: "=",
    above: "≥",
    below: "≤"
  },
  saves: {
    evasion: "TYOA.saves.evasion",
    mental: "TYOA.saves.mental",
    physical: "TYOA.saves.physical",
    luck: "TYOA.saves.luck",
  },
  skills: {
    admin: "TYOA.skills.administer",
    connect: "TYOA.skills.connect",
    convince: "TYOA.skills.convince",
    craft: "TYOA.skills.craft",
    exert: "TYOA.skills.exert",
    heal: "TYOA.skills.heal",
    know: "TYOA.skills.know",
    lead: "TYOA.skills.lead",
    magic: "TYOA.skills.magic",
    notice: "TYOA.skills.notice",
    perform: "TYOA.skills.perform",
    pray: "TYOA.skills.pray",
    punch: "TYOA.skills.punch",
    ride: "TYOA.skills.ride",
    sail: "TYOA.skills.sail",
    shoot: "TYOA.skills.shoot",
    sneak: "TYOA.skills.sneak",
    stab: "TYOA.skills.stab",
    survive: "TYOA.skills.survive",
    trade: "TYOA.skills.trade",
    work: "TYOA.skills.work"
  },
  encumbLocation: {
    readied: "TYOA.items.readied",
    stowed: "TYOA.items.stowed",
    other: "TYOA.items.other"
  },
  weightless: {
    never: "TYOA.items.WeightlessNever",
    whenReadied: "TYOA.items.WeightlessReadied",
    whenStowed: "TYOA.items.WeightlessStowed"
  },
  attackSkills: {
    punch: "TYOA.skills.punch",
    shoot: "TYOA.skills.shoot",
    stab: "TYOA.skills.stab",
    magic: "TYOA.skills.magic"
  },
  armor : {
    unarmored: "TYOA.armor.unarmored",
    light: "TYOA.armor.light",
    medium: "TYOA.armor.medium",
    heavy: "TYOA.armor.heavy",
    shield: "TYOA.armor.shield",
  },
  colors: {
    green: "TYOA.colors.green",
    red: "TYOA.colors.red",
    yellow: "TYOA.colors.yellow",
    purple: "TYOA.colors.purple",
    blue: "TYOA.colors.blue",
    orange: "TYOA.colors.orange",
    white: "TYOA.colors.white"
  },
  languages: [
    "Trade Cant",
    "Ancient Vothian",
    "Old Vothian",
    "Modern Vothian",
    "Ancient Olok",
    "Brass Speech",
    "Ancient Lin",
    "Emedian",
    "Ancient Osrin",
    "Thurian",
    "Ancient Khalan",
    "Llaigisan",
    "Anak Speech",
    "Predecessant",
    "Abased",
    "Recurrent",
    "Deep Speech"
  ],
  tags: {
    melee: "TYOA.items.Melee",
    missile: "TYOA.items.Missile",
    SR: "TYOA.items.SR",
    TH: "TYOA.items.2H",
    AP: "TYOA.items.AP",
    FX: "TYOA.items.FX",
    L: "TYOA.items.L",
    R: "TYOA.items.R",
    LL: "TYOA.items.LL",
    N: "TYOA.items.N",
    PM: "TYOA.items.PM",
    S: "TYOA.items.S",
    SS: "TYOA.items.SS",
    T: "TYOA.items.T",
    CB: "TYOA.items.CB"
  },
  tag_images: {
    melee: "systems/tyoa/assets/melee.png",
    missile: "systems/tyoa/assets/missile.png",
    SR: "systems/tyoa/assets/slow_reload.png",
    TH: "systems/tyoa/assets/twohanded.png",
    AP: "systems/tyoa/assets/armor_piercing.png",
    FX: "systems/tyoa/assets/fixed.png",
    L: "systems/tyoa/assets/long.png",
    R: "systems/tyoa/assets/reload.png",
    LL: "systems/tyoa/assets/less_lethal.png",
    N: "systems/tyoa/assets/numerous.png",
    PM: "systems/tyoa/assets/precisely_murderous.png",
    S: "systems/tyoa/assets/subtle.png",
    SS: "systems/tyoa/assets/single_shot.png",
    T: "systems/tyoa/assets/throwable.png",
    CB: "systems/tyoa/assets/crossbow.png"
  },
  tag_desc: {
    melee: "TYOA.items.desc.Melee",
    missile: "TYOA.items.desc.Missile",
    SR: "TYOA.items.desc.SR",
    TH: "TYOA.items.desc.2H",
    AP: "TYOA.items.desc.AP",
    FX: "TYOA.items.desc.FX",
    L: "TYOA.items.desc.L",
    R: "TYOA.items.desc.R",
    LL: "TYOA.items.desc.LL",
    N: "TYOA.items.desc.N",
    PM: "TYOA.items.desc.PM",
    S: "TYOA.items.desc.S",
    SS: "TYOA.items.desc.SS",
    T: "TYOA.items.desc.T",
    CB: "TYOA.items.desc.CB"
  },
  assetTypes: {
    cunning: "TYOA.asset.cunning",
    force: "TYOA.asset.force",
    wealth: "TYOA.asset.wealth"
  },
  assetMagic: {
    none: "TYOA.asset.magicNone",
    low: "TYOA.asset.magicLow",
    medium: "TYOA.asset.magicMedium",
    high: "TYOA.asset.magicHigh",
  },
  monster_saves: {
    0: {
      label: "Normal Human",
      d: 14,
      w: 15,
      p: 16,
      b: 17,
      s: 18
    },
    1: {
      label: "1-3",
      d: 12,
      w: 13,
      p: 14,
      b: 15,
      s: 16
    },
    4: {
      label: "4-6",
      d: 10,
      w: 11,
      p: 12,
      b: 13,
      s: 14
    },
    7: {
      label: "7-9",
      d: 8,
      w: 9,
      p: 10,
      b: 10,
      s: 12
    },
    10: {
      label: "10-12",
      d: 6,
      w: 7,
      p: 8,
      b: 8,
      s: 10
    },
    13: {
      label: "13-15",
      d: 4,
      w: 5,
      p: 6,
      b: 5,
      s: 8
    },
    16: {
      label: "16-18",
      d: 2,
      w: 3,
      p: 4,
      b: 3,
      s: 6
    },
    19: {
      label: "19-21",
      d: 2,
      w: 2,
      p: 2,
      b: 2,
      s: 4
    },
    22: {
      label: "22+",
      d: 2,
      w: 2,
      p: 2,
      b: 2,
      s: 2
    },
  }
};