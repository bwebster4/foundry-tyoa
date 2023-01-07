import { TyoaPartyXP } from "./party-xp.js";
import { TyoaPartyCurrency } from "./party-coin.js";

export class TyoaPartySheet extends FormApplication {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["tyoa", "dialog", "party-sheet"],
      template: "systems/tyoa/templates/apps/party-sheet.html",
      width: 350,
      height: 450,
      resizable: true,
    });
  }

  /* -------------------------------------------- */

  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return game.i18n.localize("TYOA.dialog.partysheet");
  }

  /* -------------------------------------------- */

  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  getData() {
    let data = {
      data: this.object,
      config: CONFIG.TYOA,
      user: game.user,
      settings: settings
    };
    return data;
  }

  _onDrop(event) {
    event.preventDefault();
    // WIP Drop Items
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
      if (data.type === "Actor") {
        const actor = fromUuidSync(data.uuid);
        actor.setFlag('tyoa', 'party', true);
      }
    } catch (err) {
      return false;
    }
  }
  /* -------------------------------------------- */

  async _dealXP(ev) {
    new TyoaPartyXP(this.object, {}).render(true);
  }

  async _dealCurrency(ev) {
    new TyoaPartyCurrency(this.object, {}).render(true);
  }

  async _selectActors(ev) {
    const template = "systems/tyoa/templates/apps/party-select.html";
    const templateData = {
      actors: this.object.documents
    }
    const content = await renderTemplate(template, templateData);
    new Dialog({
      title: "Select Party Characters",
      content: content,
      buttons: {
        set: {
          icon: '<i class="fas fa-save"></i>',
          label: game.i18n.localize("TYOA.Update"),
          callback: (html) => {
            let checks = html.find("input[data-action='select-actor']");
            checks.each(async (_, c) => {
              let key = c.getAttribute('name');
              await this.object.documents[key].setFlag('tyoa', 'party', c.checked);
            });
          },
        },
      },
    }, {height: "auto", width: 220})
    .render(true);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html
      .find(".item-controls .item-control .select-actors")
      .click(this._selectActors.bind(this));
    
      html.find(".item-controls .item-control .deal-xp").click(this._dealXP.bind(this));
      html.find(".item-controls .item-control .deal-currency").click(this._dealCurrency.bind(this));
    
    html.find("a.resync").click(() => this.render(true));

    html.find(".field-img button[data-action='open-sheet']").click((ev) => {
      let actorId = ev.currentTarget.parentElement.parentElement.parentElement.dataset.actorId;
      game.actors.get(actorId).sheet.render(true);
    });

    html.on('drop', (ev) => { this._onDrop(ev.originalEvent); });
  }
}
