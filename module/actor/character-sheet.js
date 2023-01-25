import { TyoaActorSheet } from "./actor-sheet.js";
import { TyoaCharacterModifiers } from "../dialog/character-modifiers.js";
import { TyoaAdjustCurrency } from "../dialog/adjust-currency.js";
import { TyoaCharacterCreator } from "../dialog/character-creation.js";
import insertionSort from "../insertionSort.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class TyoaActorSheetCharacter extends TyoaActorSheet {
  constructor(...args) {
    super(...args);
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["tyoa", "sheet", "actor", "character"],
      template: "systems/tyoa/templates/actors/character-sheet.html",
      width: 755,
      height: 625,
      resizable: false,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
    });
  }

  /**
   * Organize and classify Owned Items for Character sheets
   * @private
   */
  _prepareItems(data) {
    // Partition items by category
    let [items, weapons, armors, abilities, techniques, foci, skills] =
      this.actor.items.reduce(
        (arr, item) => {
          // Classify items into types
          if (item.type === "item") arr[0].push(item);
          else if (item.type === "weapon") arr[1].push(item);
          else if (item.type === "armor") arr[2].push(item);
          else if (item.type === "ability") arr[3].push(item);
          else if (item.type === "technique") arr[4].push(item);
          else if (item.type === "focus") arr[5].push(item);
          else if (item.type === "skill") arr[6].push(item);
          return arr;
        },
        [[], [], [], [], [], [], [], []]
      );

    // Sort techniques by skill
    var unsortedTechniques = {};
    var techSkills = [];
    for (var i = 0; i < techniques.length; i++) {
      const skill = techniques[i].system.skill;
      if (!unsortedTechniques[skill]) {
        unsortedTechniques[skill] = [];
        techSkills.push(skill);
      }
      unsortedTechniques[skill].push(techniques[i]);
    }

    techSkills.sort();
    var sortedTechniques = [];
    for (var i = 0; i < techSkills.length; i++) {
      const skill = techSkills[i];
      var levelSorted = insertionSort(unsortedTechniques[skill], "system.lvl");
      sortedTechniques.push(...levelSorted);
    }

    // Sort each skill
    // Object.keys(sortedTechniques).forEach((skill) => {
    //   let list = insertionSort(sortedTechniques[skill], "system.lvl");
    //   list = insertionSort(list, "name");
    //   sortedTechniques[skill] = list;
    // });


    // // Sort techniques by skill and then by level
    // let skillSortedTechniques = insertionSort(techniques, "system.skill");
    // let levelSortedTechniques = insertionSort(skillSortedTechniques, "system.lvl");
    // let nameSortedTechniques = insertionSort(levelSortedTechniques, "name");

    // Divide skills into primary and secondary
    const primarySkills = insertionSort(
      skills.filter((skill) => !skill.system.secondary),
      "name"
    );
    const secondarySkills = insertionSort(
      skills.filter((skill) => skill.system.secondary),
      "name"
    );

    // Assign and return
    data.owned = {
      items: insertionSort(items, "name"),
      armors: insertionSort(armors, "name"),
      abilities: insertionSort(abilities, "name"),
      weapons: insertionSort(weapons, "name"),
      techniques: sortedTechniques,
      foci: insertionSort(foci, "name"),
      skills: [...primarySkills, ...secondarySkills],
    };
  }

  adjustCurrency() {
    new TyoaAdjustCurrency(this.actor, {
      top: this.position.top + 300,
      left: this.position.left + (this.position.width - 200) / 2,
    }).render(true);
  }

  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData() {
    const data = super.getData();

    data.config.initiative = game.settings.get("tyoa", "initiative") != "group";
    data.config.showMovement = game.settings.get("tyoa", "showMovement");
    data.config.currencyTypes = game.settings.get("tyoa", "currencyTypes");

    this._prepareItems(data);
    data.enrichedBiography = await TextEditor.enrichHTML(
      this.object.system.details.biography,
      { async: true }
    );
    data.enrichedNotes = await TextEditor.enrichHTML(
      this.object.system.details.notes,
      { async: true }
    );
    return data;
  }

  async _chooseLang() {
    const languages = game.settings.get("tyoa", "languageList");
    const choices = languages.split(",");

    let templateData = { choices: choices },
      dlg = await renderTemplate(
        "systems/tyoa/templates/actors/dialogs/lang-create.html",
        templateData
      );
    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: "",
        content: dlg,
        buttons: {
          ok: {
            label: game.i18n.localize("TYOA.Ok"),
            icon: '<i class="fas fa-check"></i>',
            callback: (html) => {
              resolve({
                choice: html.find('input[name="choice"]').val(),
              });
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("TYOA.Cancel"),
          },
        },
        default: "ok",
      }).render(true);
    });
  }

  async _chooseItemType(choices = ["focus", "ability"]) {
    let templateData = { types: choices },
      dlg = await renderTemplate(
        "systems/tyoa/templates/items/entity-create.html",
        templateData
      );
    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TYOA.dialog.createItem"),
        content: dlg,
        buttons: {
          ok: {
            label: game.i18n.localize("TYOA.Ok"),
            icon: '<i class="fas fa-check"></i>',
            callback: (html) => {
              resolve({
                type: html.find('select[name="type"]').val(),
                name: html.find('input[name="name"]').val(),
              });
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("TYOA.Cancel"),
          },
        },
        default: "ok",
      }).render(true);
    });
  }

  _pushLang(table) {
    const data = this.actor.system;
    let update = duplicate(data[table]);
    this._chooseLang().then((dialogInput) => {
      const name = dialogInput.choice;
      if (update.value) {
        update.value.push(name);
      } else {
        update = { value: [name] };
      }
      let newData = {};
      newData[table] = update;
      return this.actor.update({ system: newData });
    });
  }

  _popLang(table, lang) {
    const data = this.actor.system;
    let update = data[table].value.filter((el) => el != lang);
    let newData = {};
    newData[table] = { value: update };
    return this.actor.update({ system: newData });
  }

  /* -------------------------------------------- */

  async _updateSpentSkillPoints(event) {
    event.preventDefault();

    const newValue = parseInt(event.currentTarget.value);
    const unspent = this.actor.system.details.points.value - newValue;
    return this.actor.update({ "system.details.points.unspent": unspent });
  }

  async _updateSkillPoints(event) {
    event.preventDefault();

    const newValue = parseInt(event.currentTarget.value);
    const unspent = newValue - this.actor.system.details.points.spent;
    return this.actor.update({ "system.details.points.unspent": unspent });
  }
  
  async _onQtChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    return item.update({ "system.quantity": parseInt(event.target.value) });
  }

  async _onChargeChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    return item.update({ "system.charges.value": parseInt(event.target.value) });
  }

  _onShowModifiers(event) {
    event.preventDefault();
    new TyoaCharacterModifiers(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".ability-score .attribute-name a").click((ev) => {
      let actorObject = this.actor;
      let element = ev.currentTarget;
      let score = element.parentElement.parentElement.dataset.score;
      if (!score) {
        actorObject.rollCheck(score, { event: event });
      }
    });

    html.find(".skills .attribute-name a").click((ev) => {
      let actorObject = this.actor;
      let element = ev.currentTarget;
      let expl = element.parentElement.parentElement.dataset.skills;
      actorObject.rollSkills(expl, { event: event });
    });

    html.find(".inventory .item-titles .item-caret").click((ev) => {
      let items = $(ev.currentTarget.parentElement.parentElement).children(
        ".item-list"
      );
      if (items.css("display") == "none") {
        let el = $(ev.currentTarget).find(".fas.fa-caret-right");
        el.removeClass("fa-caret-right");
        el.addClass("fa-caret-down");
        items.slideDown(200);
      } else {
        let el = $(ev.currentTarget).find(".fas.fa-caret-down");
        el.removeClass("fa-caret-down");
        el.addClass("fa-caret-right");
        items.slideUp(200);
      }
    });

    html.find("a[data-action='modifiers']").click((ev) => {
      this._onShowModifiers(ev);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
      li.slideUp(200, () => this.render(false));
    });

    html.find(".item-push").click((ev) => {
      ev.preventDefault();
      const header = ev.currentTarget;
      const table = header.dataset.array;
      this._pushLang(table);
    });

    html.find(".item-pop").click((ev) => {
      ev.preventDefault();
      const header = ev.currentTarget;
      const table = header.dataset.array;
      this._popLang(table, $(ev.currentTarget).closest(".item").data("lang"));
    });

    //Toggle Equipment
    html.find(".item-toggle").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      await item.update({
        data: {
          equipped: !item.system.equipped,
        },
      });
    });

    html.find(".item-prep").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      await item.update({
        data: {
          prepared: !item.system.prepared,
        },
      });
    });

    html.find(".stow-toggle").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      await item.update({
        data: {
          stowed: !item.system.stowed,
        },
      });
    });

    html
      .find(".quantity input")
      .click((ev) => ev.target.select())
      .change(this._onQtChange.bind(this));

    html
      .find(".charges input")
      .click((ev) => ev.target.select())
      .change(this._onChargeChange.bind(this));

    html.find("a[data-action='currency-adjust']").click((ev) => {
      this.adjustCurrency(ev);
    });

    // html.find(".skillPoints input")
    //   .click((ev) => ev.target.select())
    //   .change(this._updateSkillPoints.bind(this));

    // html.find(".spentSkillPoints input")
    //   .click((ev) => ev.target.select())
    //   .change(this._updateSpentSkillPoints.bind(this));


    // Use unspent skill points to improve the skill
    html.find(".skill-up").click(async (ev) => {
      ev.preventDefault();
      const li = $(ev.currentTarget).parents(".item");
      const skill = this.actor.items.get(li.data("itemId"));
      if (skill.type == "skill") {
        const rank = skill.system.ownedLevel;
        // check costs and update if points available
        const skillCost = rank + 2;
        const unspent = this.actor.system.details.points.value - this.actor.system.details.points.spent;
        const skillPointsAvail = this.actor.system.details.points.unspent;
        if (skillCost > skillPointsAvail) {
          await this.actor.update({ "system.details.points.unspent": unspent });
          ui.notifications.error(
            `Not enough skill points. Have: ${skillPointsAvail}, need: ${skillCost}`
          );
          return;
        } else if (isNaN(skillPointsAvail)) {
          ui.notifications.error(`Unspent skill points not set`);
          return;
        }
        await skill.update({ "system.ownedLevel": rank + 1 });
        const newSpentPoints = this.actor.system.details.points.spent + skillCost;
        const newUnspentPoints = unspent - skillCost;
        await this.actor.update({ "system.details.points.spent": newSpentPoints });
        await this.actor.update({ "system.details.points.unspent": newUnspentPoints });
        ui.notifications.info(`Added ${skillCost} spent skill points`);
      }
    });

    // Show / hide skill buttons
    html.find(".lock-skills").click((ev) => {
      ev.preventDefault();
      const lock = $(ev.currentTarget).data("type") == "lock" ? true : false;
      if (lock) {
        html.find(".lock-skills.unlock").css("display", "inline-block");
        html.find(".lock-skills.lock").hide();
      } else {
        html.find(".lock-skills.unlock").hide();
        html.find(".lock-skills.lock").css("display", "inline-block");
      }
      html.find(".skill-lock").each(function () {
        if (lock) {
          $(this).hide();
        } else {
          $(this).show();
        }
      });
      html.find(".reverse-lock").each(function () {
        if (!lock) {
          $(this).hide();
        } else {
          $(this).show();
        }
      });
    });
  }
}
