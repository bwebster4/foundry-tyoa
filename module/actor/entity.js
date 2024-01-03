import { TyoaDice } from "../dice.js";
import { TyoaItem } from "../item/entity.js";

export class TyoaActor extends Actor {
  /**
   * Extends data from base Actor class
   */

  prepareData() {
    super.prepareData();

    // Compute modifiers from actor scores
    this.computeArmor();
    this.computeEncumbrance();
    this._calculateMovement();
    this.computeResources();
    this.computeTreasure();
    this.computeEffort();
    this.computeTotalSP();
    this.computeInit();
  }

  // async createEmbeddedDocuments(embeddedName, data = [], context = {}) {
  //   if (!game.user.isGM && !this.isOwner) return;
  //   data.map((item) => {
  //     if (item.img === undefined) {
  //       item.img = TyoaItem.defaultIcons[item.type];
  //     }
  //   });
  //   super.createEmbeddedDocuments(embeddedName, data, context);
  // }

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
    const rollParts = [];
    const rollLabels = [];
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
      rollParts.push("1d4");
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
      rollParts.push(attData.item.system.damage);
    }

    // TODO: Add range selector in dialogue if missile attack.
    /* if (options.type == "missile") {
      rollParts.push(
        
      );
    } */
    if (data.character && attData.item.system.skillDamage) {
      const unskilledAttack = attData.item.system.tags.find(
        (tag) => tag.title === "E"
      )
        ? 0
        : -1;
      if (skillValue == -1) {
        rollParts.push(unskilledAttack);
        rollLabels.push(`${unskilledAttack} (unskilled penalty)`);
      } else {
        rollParts.push(skillValue);
        rollLabels.push(`+${skillValue} (${skillAttack})`);
      }
    }

    if(this.system.damageBonus){
      rollParts.push(this.system.damageBonus);
      rollLabels.push(`+${this.system.damageBonus.toString()} (damage bonus)`);
    }

    const rollTitle = `${rollParts[0]} ${rollLabels.join(" ")}`;

    const rollData = {
      actor: this,
      item: attData.item,
      roll: {
        type: options.type,
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
    if (this.type == "character") {
      let fighting = this.items.find((i) => i.name == "Fighting");
      let marksmanship = this.items.find((i) => i.name == "Marksmanship");
      let skillMod = -1;
      if (fighting) skillMod = fighting.level;
      if (marksmanship && marksmanship.level > skillMod) skillMod = marksmanship.level;
      initValue = this.system.initiative.mod + skillMod;
    } else {
      initValue = this.system.initiative.mod;
    }
    this.system.initiative.value = initValue;
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
      bonus: bonus
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

  computeArmor() {
    if (this.type != "character") {
      return;
    }

    const data = this.system;
    const armors = this.items.filter((i) => i.type == "armor");

    // Migrations
    if(!data.armor){
      let oldArmorMod = data.aacm || data.aac || 0;
      let armorObj = {
        value: 0,
        mod: oldArmorMod
      }
      data.armor = armorObj
    }
    armors.forEach((a) => {
      if(!a.system.armor){
        a.system.armor = {
          value: 0,
          mod: 0,
        };
      }
    });

    // Compute AC
    let armor = 0;
    let naturalArmor = data.armor.mod;
    let exertPenalty = 0;
    let sneakPenalty = 0;

    armors.forEach((a) => {
      if (!a.system.equipped) {
        return;
      }
      armor += a.system.armor.value;
      // Check if armor is medium or heavy and apply appropriate Sneak/Exert penalty
      if (a.system.type === "medium" || a.system.type === "heavy") {
        sneakPenalty += a.system.weight;
      }
      if (a.system.type === "heavy") {
        exertPenalty += a.system.weight;
      }
    });

    this.system.armor.value = armor + naturalArmor;
    
    this.system.skills.sneakPenalty = sneakPenalty;
    this.system.skills.exertPenalty = exertPenalty;
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
