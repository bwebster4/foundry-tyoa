import { TyoaDice } from "../dice.js";
import { TyoaItem } from "../item/entity.js";

export class TyoaActor extends Actor {
  /**
   * Extends data from base Actor class
   */

  prepareData() {
    super.prepareData();

    // Compute modifiers from actor scores
    this.computeAC();
    this.computeEncumbrance();
    this._calculateMovement();
    this.computeResources();
    this.computeTreasure();
    this.computeEffort();
    this.computeTotalSP();
    this.setXP();
    this.computeInit();
  }

  async createEmbeddedDocuments(embeddedName, data = [], context = {}) {
    if (!game.user.isGM && !this.isOwner) return;
    data.map((item) => {
      if (item.img === undefined) {
        item.img = TyoaItem.defaultIcons[item.type];
      }
    });
    super.createEmbeddedDocuments(embeddedName, data, context);
  }

  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers
    /* -------------------------------------------- */
  getExperience(value, options = {}) {
    if (this.type != "character") {
      return;
    }
    let modified = Math.floor(
      value + (this.system.details.xp.bonus * value) / 100
    );
    return this.update({
      "system.details.xp.value": modified + this.system.details.xp.value,
    }).then(() => {
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        content: game.i18n.format("TYOA.messages.GetExperience", {
          name: this.name,
          value: modified,
        }),
        speaker,
      });
    });
  }

  getBank(value, options = {}) {
    if (this.type != "character") {
      return;
    }
    return this.update({
      "system.currency.bank": value + this.system.currency.bank,
    }).then(() => {
      const speaker = ChatMessage.getSpeaker({ actor: this });
      ChatMessage.create({
        content: game.i18n.format("TYOA.messages.GetCurrency", {
          name: this.name,
          value,
        }),
        speaker,
      });
    });
  }

  /* -------------------------------------------- */
  /*  Rolls                                       */
  /* -------------------------------------------- */

  rollHP(options = {}) {
    const roll = new Roll(this.system.hp.hd).roll({ async: false });
    return this.update({
      data: {
        hp: {
          max: roll.total,
          value: roll.total,
        },
      },
    });
  }

  rollDP(options = {}) {
    const roll = new Roll(this.system.dp.wd).roll({ async: false });
    return this.update({
      data: {
        dp: {
          max: roll.total,
          value: roll.total,
        },
      },
    });
  }

  rollSave(save, options = {}) {
    const label = game.i18n.localize(`TYOA.saves.${save}`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.system,
      roll: {
        type: "above",
        target: this.system.saves[save].value,
        magic: this.type === "character" ? this.system.scores.wis.mod : 0,
      },
      details: game.i18n.format("TYOA.roll.details.save", { save: label }),
    };

    let skip = options.event && options.event.ctrlKey;

    const rollMethod =
      this.type == "character" ? TyoaDice.RollSave : TyoaDice.Roll;

    // Roll and return
    return rollMethod({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("TYOA.roll.save", { save: label }),
      title: game.i18n.format("TYOA.roll.save", {
        save: this.name + " - " + label,
      }),
    });
  }

  rollMorale(options = {}) {
    const rollParts = ["2d6"];

    const data = {
      actor: this.system,
      roll: {
        type: "below",
        target: this.system.details.morale,
      },
    };

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: false,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("TYOA.roll.morale"),
      title: game.i18n.localize("TYOA.roll.morale"),
    });
  }

  rollInstinct(options = {}) {
    const rollParts = ["1d10"];

    const data = {
      actor: this.system,
      roll: {
        type: "instinct",
        target: this.system.details.instinct,
      },
    };

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: false,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("TYOA.roll.instinct"),
      title: game.i18n.localize("TYOA.roll.instinct"),
    });
  }

  rollLoyalty(options = {}) {
    const label = game.i18n.localize(`TYOA.roll.loyalty`);
    const rollParts = ["2d6"];

    const data = {
      actor: this.system,
      roll: {
        type: "below",
        target: this.system.retainer.loyalty,
      },
    };

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  rollReaction(options = {}) {
    const rollParts = ["2d6"];

    const data = {
      actor: this.system,
      roll: {
        type: "table",
        table: {
          2: game.i18n.format("TYOA.reaction.Hostile", {
            name: this.name,
          }),
          3: game.i18n.format("TYOA.reaction.Unfriendly", {
            name: this.name,
          }),
          6: game.i18n.format("TYOA.reaction.Neutral", {
            name: this.name,
          }),
          9: game.i18n.format("TYOA.reaction.Indifferent", {
            name: this.name,
          }),
          12: game.i18n.format("TYOA.reaction.Friendly", {
            name: this.name,
          }),
        },
      },
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.localize("TYOA.reaction.check"),
      title: game.i18n.localize("TYOA.reaction.check"),
    });
  }

  rollCheck(score, options = {}) {
    const label = game.i18n.localize(`TYOA.scores.${score}.long`);
    const rollParts = ["1d20"];

    const data = {
      actor: this.system,
      roll: {
        type: "check",
        target: this.system.scores[score].value,
      },

      details: game.i18n.format("TYOA.roll.details.attribute", {
        score: label,
      }),
    };

    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("TYOA.roll.attribute", { attribute: label }),
      title: game.i18n.format("TYOA.roll.attribute", { attribute: label }),
    });
  }

  rollHitDice(options = {}) {
    const label = game.i18n.localize(`TYOA.roll.hd`);
    const rollParts = new Array(this.system.details.level || 1).fill(
      this.system.hp.hd
    );
    if (this.type == "character") {
      rollParts.push(
        `${this.system.scores.con.mod * this.system.details.level}[CON]`
      );
    }

    const data = {
      actor: this.system,
      roll: {
        type: "hitdice",
      },
    };

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
    });
  }

  rollAppearing(options = {}) {
    const rollParts = [];
    let label = "";
    if (options.check == "wilderness") {
      rollParts.push(this.system.details.appearing.w);
      label = "(wilderness)";
    } else {
      rollParts.push(this.system.details.appearing.d);
      label = "(dungeon)";
    }
    const data = {
      actor: this.system,
      roll: {
        type: {
          type: "appearing",
        },
      },
    };

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("TYOA.roll.appearing", { type: label }),
      title: game.i18n.format("TYOA.roll.appearing", { type: label }),
    });
  }

  rollHDMonsterSkill(options = {}) {
    const label = game.i18n.localize(`TYOA.hdSkills`);
    const rollParts = ["2d6"];

    const data = {
      actor: this.system,
      roll: {
        type: "skill",
        target: this.system.details.hdSkills,
      },

      details: game.i18n.format("TYOA.roll.details.attribute", {
        score: label,
      }),
    };

    rollParts.push(this.system.details.hdSkills);
    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("TYOA.roll.attribute", { attribute: label }),
      title: game.i18n.format("TYOA.roll.attribute", { attribute: label }),
    });
  }

  rollWDMonsterSkill(options = {}) {
    const label = game.i18n.localize(`TYOA.wdSkills`);
    const rollParts = ["2d6"];

    const data = {
      actor: this.system,
      roll: {
        type: "skill",
        target: this.system.details.wdSkills,
      },

      details: game.i18n.format("TYOA.roll.details.attribute", {
        score: label,
      }),
    };

    rollParts.push(this.system.details.wdSkills);
    let skip = options.event && options.event.ctrlKey;

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: data,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("TYOA.roll.attribute", { attribute: label }),
      title: game.i18n.format("TYOA.roll.attribute", { attribute: label }),
    });
  }

  rollDamage(attData, options = {}) {
    const data = this.system;

    const rollData = {
      actor: this.system,
      item: attData.item,
      roll: {
        type: "damage",
      },
    };

    let dmgParts = [];
    if (!attData.roll.dmg) {
      dmgParts.push("1d6");
    } else {
      dmgParts.push(attData.roll.dmg);
    }

    // Add Str to damage
    if (attData.roll.type == "melee") {
      dmgParts.push(data.scores.str.mod);
    }

    // Damage roll
    TyoaDice.Roll({
      event: options.event,
      parts: dmgParts,
      data: rollData,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${attData.label} - ${game.i18n.localize("TYOA.Damage")}`,
      title: `${attData.label} - ${game.i18n.localize("TYOA.Damage")}`,
    });
  }

  async targetAttack(data, type, options) {
    if (game.user.targets.size > 0) {
      for (let t of game.user.targets.values()) {
        data.roll.target = t;
        await this.rollAttack(data, {
          type: type,
          skipDialog: options.skipDialog,
        });
      }
    } else {
      this.rollAttack(data, { type: type, skipDialog: options.skipDialog });
    }
  }

  rollAttack(attData, options = {}) {
    const data = this.system;
    const rollParts = ["1d20"];
    const dmgParts = [];
    const rollLabels = [];
    const dmgLabels = [];
    const weaponShock = attData.item.system.shock.damage;
    let skillAttack, skillValue;
    if (data.character) {
      skillAttack = attData.item.system.skill;
      let skill = this.items.find(
        (item) =>
          item.type === "skill" && item.name.toLowerCase() === skillAttack
      )
      if (skill) skillValue = skill.system.ownedLevel;
      else skillValue = -1;
    }

    let readyState = "";
    let label = game.i18n.format("TYOA.roll.attacks", {
      name: this.name,
    });
    if (!attData.item) {
      dmgParts.push("1d6");
    } else {
      if (data.character) {
        if (attData.item.system.equipped) {
          readyState = game.i18n.format("TYOA.roll.readied");
        } else if (attData.item.system.stowed) {
          readyState = game.i18n.format("TYOA.roll.stowed");
        } else {
          readyState = game.i18n.format("TYOA.roll.notCarried");
        }
      }
      label = game.i18n.format("TYOA.roll.attacksWith", {
        name: attData.item.name,
        readyState: readyState,
      });
      dmgParts.push(attData.item.system.damage);
    }

    if (data.character) {
      attData.item.system.shockTotal = weaponShock;
      if (attData.item.system.skillDamage) {
        attData.item.system.shockTotal =
          attData.item.system.shockTotal + skillValue;
      }
    } else {
      attData.item.system.shockTotal =
        Number(this.system.damageBonus) +
        Number(attData.item.system.shock.damage);
    }

    // TODO: Add range selector in dialogue if missile attack.
    /* if (options.type == "missile") {
      rollParts.push(
        
      );
    } */
    if (data.character) {
      const unskilledAttack = attData.item.system.tags.find(
        (weapon) => weapon.title === "CB"
      )
        ? 0
        : -2;
      if (skillValue == -1) {
        rollParts.push(unskilledAttack);
        rollLabels.push(`${unskilledAttack} (unskilled penalty)`);
      } else {
        rollParts.push(skillValue);
        rollLabels.push(`+${skillValue} (${skillAttack})`);
      }
    }

    if (attData.item && attData.item.system.characterBonus) {
      rollParts.push(attData.item.system.characterBonus);
      rollLabels.push(`+${attData.item.system.characterBonus} (character bonus)`);
    }

    if (attData.item && attData.item.system.weaponBonus) {
      rollParts.push(attData.item.system.weaponBonus);
      rollLabels.push(`+${attData.item.system.weaponBonus} (weapon bonus)`);
    }

    if (data.character) {
      if (attData.item.system.skillDamage) {
        dmgParts.push(skillValue);
        dmgLabels.push(`+${skillValue} (${skillAttack})`);
      }
    } else {
      if(this.system.damageBonus){
        dmgParts.push(this.system.damageBonus);
        dmgLabels.push(`+${this.system.damageBonus.toString()} (damage bonus)`);
      }
    }

    const rollTitle = `1d20 ${rollLabels.join(" ")}`;
    const dmgTitle = `${dmgParts[0]} ${dmgLabels.join(" ")}`;

    const rollData = {
      actor: this,
      item: attData.item,
      roll: {
        type: options.type,
        dmg: dmgParts,
        save: attData.roll.save,
        target: attData.roll.target,
      },
    };

    // Roll and return
    return TyoaDice.Roll({
      event: options.event,
      parts: rollParts,
      data: rollData,
      skipDialog: options.skipDialog,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: label,
      title: label,
      rollTitle: rollTitle,
      dmgTitle: dmgTitle,
    });
  }

  async applyDamage(amount = 0, multiplier = 1) {
    amount = Math.floor(parseInt(amount) * multiplier);
    const hp = this.system.hp;

    // Remaining goes to health
    const dh = Math.clamped(hp.value - amount, 0, hp.max);

    // Update the Actor
    return this.update({
      "system.hp.value": dh,
    });
  }

  static _valueFromTable(table, val) {
    let output;
    for (let i = 0; i <= val; i++) {
      if (table[i] != undefined) {
        output = table[i];
      }
    }
    return output;
  }

  computeInit() {
    let initValue = 0;
    if (game.settings.get("tyoa", "initiative") != "group") {
      if (this.type == "character") {
        let observation = this.system.items.find((i) => i.name == "Observation");
        let obsLevel = -1;
        if (observation) obsLevel = observation.level;
        initValue = this.system.initiative.mod + obsLevel;
      } else {
        initValue = this.system.initiative.mod;
      }
    }
    this.system.initiative.value = initValue;
  }

  setXP() {
    if (this.type != "character") {
      return;
    }
    const data = this.system;
    let xpRate = [];
    let level = data.details.level - 1;

    // Retrieve XP Settings
    switch (game.settings.get("tyoa", "xpConfig")) {
      case "xpSlow":
        xpRate = [6, 15, 24, 36, 51, 69, 87, 105, 139];
        break;
      case "xpFast":
        xpRate = [3, 6, 12, 18, 27, 39, 54, 72, 93];
        break;
      case "xpCustom":
        xpRate = game.settings.get("tyoa", "xpCustomList").split(",");
        break;
    }
  }

  computeEncumbrance() {
    if (this.type !== "character") return;
    const data = this.system;

    // Compute encumbrance
    let totalReadied = 0;
    let totalStowed = 0;
    let athleticsSkill = this.items.find((s) => s.name == "Athletics");
    let athletics = -1;
    if (athleticsSkill) athletics = athleticsSkill.system.ownedLevel;
    let maxReadied = 5 + athletics;
    let maxStowed = maxReadied * 2;
    const weapons = this.items.filter((w) => w.type == "weapon");
    const armors = this.items.filter((a) => a.type == "armor");
    const items = this.items.filter((i) => i.type == "item");

    weapons.forEach((w) => {
      if (
        (w.system.weightless === "whenReadied" && w.system.equipped) ||
        (w.system.weightless === "whenStowed" && w.system.stowed)
      )
        return;
      if (w.system.equipped) {
        totalReadied += Math.ceil(w.system.weight * w.system.quantity);
      } else if (w.system.stowed) {
        totalStowed += Math.ceil(w.system.weight * w.system.quantity);
      }
    });
    armors.forEach((a) => {
      if (
        (a.system.weightless === "whenReadied" && a.system.equipped) ||
        (a.system.weightless === "whenStowed" && a.system.stowed)
      )
        return;
      if (a.system.equipped) {
        totalReadied += a.system.weight;
      } else if (a.system.stowed) {
        totalStowed += a.system.weight;
      }
    });
    items.forEach((i) => {
      if (
        (i.system.weightless === "whenReadied" && i.system.equipped) ||
        (i.system.weightless === "whenStowed" && i.system.stowed)
      )
        return;
      let itemWeight;
      if (i.system.charges.value || i.system.charges.max) {
        if (
          i.system.charges.value <= i.system.charges.max ||
          !i.system.charges.value
        ) {
          itemWeight = i.system.weight;
        } else if (!i.system.charges.max) {
          itemWeight = i.system.charges.value * i.system.weight;
        } else {
          itemWeight = i.system.charges.value / i.system.charges.max;
        }
      } else {
        itemWeight = i.system.weight * i.system.quantity;
      }
      if (i.system.equipped) {
        totalReadied += Math.ceil(itemWeight);
      } else if (i.system.stowed) {
        totalStowed += Math.ceil(itemWeight);
      }
    });

    if (game.settings.get("tyoa", "currencyTypes") == "currencybx") {
      const coinWeight =
        (data.currency.cp +
          data.currency.sp +
          data.currency.ep +
          data.currency.gp +
          data.currency.pp) /
        100;
      totalStowed += coinWeight;
    } else {
      const coinWeight =
        (data.currency.cp + data.currency.sp + data.currency.gp) / 100;
      totalStowed += coinWeight;
    }

    this.system.encumbrance = {
      readied: { max: maxReadied, value: totalReadied.toFixed(2) },
      stowed: { max: maxStowed, value: totalStowed.toFixed(2) },
    };
  }

  _calculateMovement() {
    if (this.type != "character") return;

    const data = this.system;

    let newBase = data.movement.base;
    const readiedValue = data.encumbrance.readied.value;
    const readiedMax = data.encumbrance.readied.max;
    const stowedValue = data.encumbrance.stowed.value;
    const stowedMax = data.encumbrance.stowed.max;
    const bonus = data.movement.bonus;

    let systemBase = [];
    game.settings.get("tyoa", "movementRate") == "movebx"
      ? (systemBase = [40, 30, 20])
      : (systemBase = [30, 20, 15]);

    if (readiedValue <= readiedMax && stowedValue <= stowedMax) {
      newBase = systemBase[0] + bonus;
    } else if (readiedValue <= readiedMax + 2 && stowedValue <= stowedMax) {
      newBase = systemBase[1] + bonus;
    } else if (readiedValue <= readiedMax && stowedValue <= stowedMax + 4) {
      newBase = systemBase[1] + bonus;
    } else if (
      readiedValue <= readiedMax + 2 &&
      stowedValue <= stowedMax + 4
    ) {
      newBase = systemBase[2] + bonus;
    } else if (readiedValue <= readiedMax + 4 && stowedValue <= stowedMax) {
      newBase = systemBase[2] + bonus;
    } else if (readiedValue <= readiedMax && stowedValue <= stowedMax + 8) {
      newBase = systemBase[2] + bonus;
    } else {
      newBase = 0;
    }
    this.system.movement = {
      base: newBase,
      exploration: newBase * 3,
      overland: newBase / 5,
    };
  }

  // Calculate Resources
  computeResources() {
    if (this.type != "character") return;
    let totalOil = 0;
    let totalTorches = 0;
    let totalRations = 0;

    // Collect resource arrays
    const oilArray = this.items.filter(
      (i) => i.name === "Oil, one pint" || i.name === "Oil"
    );
    const torchArray = this.items.filter((i) => i.name === "Torch");
    const rationsArray = this.items.filter(
      (i) => i.name === "Rations, one week" || i.name === "Rations"
    );

    // Calculate resource totals
    oilArray.forEach((i) => (totalOil += i.system.charges.value));
    torchArray.forEach((i) => (totalTorches += i.system.charges.value));
    rationsArray.forEach((i) => (totalRations += i.system.charges.value));

    // Update resources
    this.system.details.resources = {
      oil: totalOil,
      torches: totalTorches,
      rations: totalRations,
    };
  }

  // Compute Total Wealth
  computeTotalSP() {
    const data = this.system;
    if (this.type != "character") return;
    let newTotal =
      data.currency.cp * 0.1 +
      data.currency.sp +
      data.currency.gp * 10 +
      data.currency.pp * 100 +
      data.currency.ep * 5 +
      data.currency.bank +
      data.treasure;
    this.system.currency.total = newTotal;
  }

  // Compute Effort
  computeEffort() {
    if (this.type === "ship") return;

    let effort = 0;
    const techniques = this.items.filter((a) => a.type == "technique");
    techniques.forEach((t) => {
      effort += t.system.effort;
    });
    this.system.effort.value = effort;
  }

  computeTreasure() {
    if (this.type != "character") {
      return;
    }
    const data = this.system;
    // Compute treasure
    let total = 0;
    const treasures = this.items.filter(
      (i) => i.type == "item" && i.system.treasure
    );
    treasures.forEach((item) => {
      total += item.system.quantity * item.system.price;
    });
    this.system.treasure = total;
  }

  computeAC() {
    if (this.type != "character") {
      if(this.system.aacm === 0){
        this.system.aacm = {
          value: 10
        };
      }
      if(this.system.aacr === 0){
        this.system.aacr = {
          value: 10
        };
      }
      return;
    }

    const data = this.system;

    // Compute AC
    let shield = 0;
    let shieldBonus = 0;
    let baseAac = 10;
    let melee = data.aacm.mod;
    let ranged = data.aacr.mod;
    let exertPenalty = 0;
    let sneakPenalty = 0;

    let fightingSkill = this.items.find((s) => s.name == "Fighting");
    let fighting = -1;
    if (fightingSkill) fighting = fightingSkill.system.ownedLevel;

    let markSkill = this.items.find((s) => s.name == "Marksmanship");
    let mark = -1;
    if (markSkill) mark = markSkill.system.ownedLevel;

    if(fighting == -1 && mark == -1) baseAac = 8;

    const armors = this.items.filter((i) => i.type == "armor");
    armors.forEach((a) => {
      if (!a.system.equipped) {
        return;
      }
      if (a.system.type != "shield") {
        baseAac = a.system.aac.value + a.system.aac.mod;
        // Check if armor is medium or heavy and apply appropriate Sneak/Exert penalty
        if (a.system.type === "medium" && a.system.weight > sneakPenalty) {
          sneakPenalty = a.system.weight;
        }
        if (a.system.type === "heavy" && a.system.weight > sneakPenalty) {
          sneakPenalty = a.system.weight;
        }
        if (a.system.type === "heavy" && a.system.weight > exertPenalty) {
          exertPenalty = a.system.weight;
        }
      } else if (a.system.type == "shield") {
        shield = a.system.aac.value;
        shieldBonus = a.system.aac.mod;
      }
    });
    if (shield > 0) {
      let shieldOnly = shield;
      let shieldAndArmor = baseAac + shieldBonus;
      if (shieldOnly > shieldAndArmor) {
        this.system.aacm = { value: shieldOnly + melee };
        this.system.aacr = { value: shieldOnly + ranged };
      } else {
        this.system.aacm = { value: shieldAndArmor + melee };
        this.system.aacr = { value: shieldAndArmor + ranged };
      }
    } else {
      this.system.aacm = {
        value: baseAac + melee
      };
      this.system.aacr = {
        value: baseAac + ranged
      }
    }
    this.system.skills.sneakPenalty = sneakPenalty;
    this.system.skills.exertPenalty = exertPenalty;
  }

  // Creates a list of skills based on the following list. Was used to generate
  // the initial skills list to populate a compendium
  async createSkillsManually(data, options, user) {
    const actorData = this.system;
    const skillList = [
      "administer",
      "connect",
      "convince",
      "craft",
      "exert",
      "heal",
      "know",
      "lead",
      "magic",
      "notice",
      "perform",
      "pray",
      "punch",
      "ride",
      "sail",
      "shoot",
      "sneak",
      "stab",
      "survive",
      "trade",
      "work",
      "biopsionics",
      "metapsionics",
      "precognition",
      "telekinesis",
      "telepathy",
      "teleportation",
      "polymath",
    ];
    const skills = skillList.map((el) => {
      const skillKey = `TYOA.skills.${el}`;
      const skillDesc = `TYOA.skills.desc.${el}`;
      const imagePath = `/systems/tyoa/assets/skills/${el}.png`;
      return {
        type: "skill",
        name: game.i18n.localize(skillKey),
        data: {
          ownedLevel: -1,
          description: game.i18n.localize(skillDesc),
          skillDice: "2d6"
        },
        img: imagePath,
      };
    });

    if (data.type === "character") {
      await this.createEmbeddedDocuments("Item", skills);
    }
  }

  /** @override*/
  async _onCreate(data, options, user) {
    await super._onCreate(data, options, user);
    // Add primary skills from compendium
    if (data.type === "character" && game.userId == user) {
      // If there are no skills, add ones from compendium
      if (!data.items.filter((i) => i.type == "skill").length) {
        let skillPack = game.packs.get("tyoa.skills");
        let toAdd = await skillPack.getDocuments();
        let primarySkills = toAdd
          .map((item) => item.toObject());
        await this.createEmbeddedDocuments("Item", primarySkills);
      }
    }
  }
}
