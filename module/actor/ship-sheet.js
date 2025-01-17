import { TyoaActor } from "./entity.js";
import { TyoaActorSheet } from "./actor-sheet.js";
import insertionSort from "../insertionSort.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class TyoaActorSheetShip extends TyoaActorSheet {
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
      classes: ["tyoa", "sheet", "ship", "actor"],
      template: "systems/tyoa/templates/actors/ship-sheet.html",
      width: 730,
      height: 625,
      resizable: false,
      tabs: [
        {
          navSelector: ".tabs",
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
  data.attackPatterns = [];
  let [weapons, armors, items, techniques, abilities] = this.actor.items.reduce(
    (arr, item) => {
      // Grab attack groups
      if (["weapon"].includes(item.type)) {
        data.attackPatterns.push(item);
        return arr;
      }
      // Classify items into types
      if (item.type === "weapon") arr[0].push(item);
      else if (item.type === "armor") arr[1].push(item);
      else if (item.type === "item") arr[2].push(item);
      else if (item.type === "technique") arr[3].push(item);
      else if (item.type === "ability") arr [4].push(item);
      return arr;
    },
    [[], [], [], [], [], []]
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

  data.attackPatterns.sort((a, b) => {
    const aName = a.name.toLowerCase(), bName = b.name.toLowerCase();
    return aName > bName ? 1 : bName > aName ? -1 : 0;
  });

  // Assign and return
  data.owned = {
    items: insertionSort(items, "name"),
    armors: insertionSort(armors, "name"),
    abilities: insertionSort(abilities, "name"),
    weapons: insertionSort(weapons, "name"),
    techniques: sortedTechniques
  };
}

  /**
   * Monster creation helpers
   */

  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData() {
    const data = super.getData();
    // Prepare owned items
    this._prepareItems(data);

    data.enrichedBiography = await TextEditor.enrichHTML(
      this.object.system.details.biography,
      { async: true }
    );
    
    return data;
  }


  async _onDrop(event) {
    super._onDrop(event);
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (data.type !== "RollTable") return;
    } catch (err) {
      return false;
    }
    let link = `@UUID[${data.uuid}]`;
    this.actor.update({ "system.details.instinctTable.table": link });
  }

  /* -------------------------------------------- */

  async _chooseItemType(choices = ["weapon", "armor", "shield", "item", "ability"]) {
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

  async _resetCounters(event) {
    const weapons = this.actor.items.filter(i => i.type === 'weapon');
    for (let wp of weapons) {
      const item = this.actor.items.get(wp.id);
      await item.update({
        system: {
          counter: {
            value: parseInt(wp.system.counter.max),
          },
        },
      });
    }
  }

  async _onCountChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (event.target.dataset.field == "value") {
      return item.update({
        "system.counter.value": parseInt(event.target.value),
      });
    } else if (event.target.dataset.field == "max") {
      return item.update({
        "system.counter.max": parseInt(event.target.value),
      });
    }
  }

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".monster-hd-skill-check a").click((ev) => {
      let actorObject = this.actor;
      let check = $(ev.currentTarget).closest('.check-field').data('check');
      actorObject.rollHDMonsterSkill({ event: event, check: check });
    });

    html.find(".monster-wd-skill-check a").click((ev) => {
      let actorObject = this.actor;
      let check = $(ev.currentTarget).closest('.check-field').data('check');
      actorObject.rollWDMonsterSkill({ event: event, check: check });
    });

    html.find(".item-prep").click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      await item.update({
        system: {
          prepared: !item.system.prepared,
        },
      });
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

    html.find(".item-reset").click((ev) => {
      this._resetCounters(ev);
    });

    html
      .find(".counter input")
      .click((ev) => ev.target.select())
      .change(this._onCountChange.bind(this));

    html.find(".hp-roll").click((ev) => {
      let actorObject = this.actor;
      actorObject.rollHP({ event: event });
    });

    html.find(".dp-roll").click((ev) => {
      let actorObject = this.actor;
      actorObject.rollDP({ event: event });
    });

    html.find(".item-pattern").click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      let currentColor = item.system.pattern;
      let colors = Object.keys(CONFIG.TYOA.colors);
      let index = colors.indexOf(currentColor);
      if (index + 1 == colors.length) {
        index = 0;
      } else {
        index++;
      }
      item.update({
        "system.pattern": colors[index]
      })
    });
  }
}
