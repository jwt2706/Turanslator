8
const Applet = imports.ui.applet;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Gtk = imports.gi.Gtk;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Soup = imports.gi.Soup;
const GLib = imports.gi.GLib;

let session = new Soup.Session();
Soup.Session.prototype.add_feature.call(session, new Soup.CookieJar());

function _(str) {
    return str;
}

class TranslateApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);

        this.set_applet_icon_name("accessories-dictionary");
        this.set_applet_label("TR <-> EN");
        this.set_applet_tooltip("Quick Translator");

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.entry = new St.Entry({ hint_text: "Type text to translate...", track_hover: true });
        this.menu.box.add(this.entry);

        this.translateButton = new St.Button({ label: "Translate", style_class: "popup-menu-item" });
        this.translateButton.connect("clicked", () => this.translateText());
        this.menu.box.add(this.translateButton);

        this.resultLabel = new St.Label({ text: "" });
        this.menu.box.add(this.resultLabel);

        this.entry.clutter_text.connect("activate", () => this.translateText());

        this.direction = "tr2en"; // Default direction

        let switchLang = new PopupMenu.PopupSubMenuMenuItem("Switch Language");
        let tr2en = new PopupMenu.PopupMenuItem("Turkish to English");
        let en2tr = new PopupMenu.PopupMenuItem("English to Turkish");

        tr2en.connect("activate", () => this.direction = "tr2en");
        en2tr.connect("activate", () => this.direction = "en2tr");

        switchLang.menu.addMenuItem(tr2en);
        switchLang.menu.addMenuItem(en2tr);
        this.menu.addMenuItem(switchLang);
    }

    translateText() {
        let text = this.entry.get_text();
        if (!text) return;

        let sourceLang = this.direction === "tr2en" ? "tr" : "en";
        let targetLang = this.direction === "tr2en" ? "en" : "tr";

        let url = "https://libretranslate.de/translate";
        let message = Soup.Message.new("POST", url);
        let payload = JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
            format: "text"
        });

        message.set_request("application/json", Soup.MemoryUse.COPY, payload);

        session.queue_message(message, (session, message) => {
            if (message.status_code !== 200) {
                this.resultLabel.set_text("Translation error");
                return;
            }

            let json = JSON.parse(message.response_body.data);
            this.resultLabel.set_text(json.translatedText);
        });
    }

    on_applet_clicked(event) {
        this.menu.toggle();
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new TranslateApplet(metadata, orientation, panelHeight, instanceId);
}

