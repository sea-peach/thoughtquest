const { Plugin, Notice, Modal, Setting, PluginSettingTab } = require("obsidian");

class ThoughtQuest extends Plugin {
    async onload() {
        console.log("⚔️ ThoughtQuest Plugin Loaded! 🚀");

        // Load settings or set defaults
        this.settings = Object.assign({
            xpPerEdit: 10,
            xpPerLevel: 100,
            showXPBar: true,
            showXPPanel: true, // NEW: Toggle for floating XP panel
        }, await this.loadData());

        // Load XP & Level
        let savedData = await this.loadData();
        this.xp = savedData?.xp || 0;
        this.level = Math.floor(this.xp / this.settings.xpPerLevel);

        // Create XP Bar if enabled
        if (this.settings.showXPBar) {
            this.createXPBar();
        }

        // NEW: Create the floating XP panel
        if (this.settings.showXPPanel) {
            this.createXPPanel();
        }

        // Update XP when modifying a note
        this.registerEvent(
            this.app.vault.on("modify", this.gainXP.bind(this))
        );

        // Add commands
        this.addCommand({
            id: "check-xp",
            name: "Check XP",
            callback: () => {
                new Notice(`⚡ ThoughtQuest XP: ${this.xp}`);
                this.updateXPBar();
                this.updateXPPanel();
            },
        });

        this.addCommand({
            id: "open-thoughtquest-dashboard",
            name: "Open ThoughtQuest Dashboard",
            callback: () => {
                new ThoughtQuestDashboard(this.app, this.xp, this.level, this.settings).open();
            },
        });

        // Add settings tab
        this.addSettingTab(new ThoughtQuestSettingTab(this.app, this));
    }
    
    async gainXP() {
        this.xp += this.settings.xpPerEdit;
        await this.saveData({ xp: this.xp });

        let newLevel = Math.floor(this.xp / this.settings.xpPerLevel);
        if (newLevel > this.level) {
            this.level = newLevel;
            new Notice(`🎉 Level Up! You reached Level ${this.level} ⚡`);
        }

        console.log(`Gained XP! Current XP: ${this.xp}`);
        this.updateXPBar();
        this.updateXPPanel();
    }

    createXPBar() {
        this.xpBarContainer = document.createElement("div");
        this.xpBarContainer.id = "thoughtquest-xp-bar";

        this.xpFill = document.createElement("div");
        this.xpFill.id = "thoughtquest-xp-fill";

        this.xpBarContainer.appendChild(this.xpFill);
        document.body.appendChild(this.xpBarContainer);

        this.updateXPBar();
    }

    updateXPBar() {
        if (!this.xpFill) return;
        let progress = (this.xp % this.settings.xpPerLevel) / this.settings.xpPerLevel * 100;
        this.xpFill.style.width = `${progress}%`;
    }

    // NEW: Create a Floating XP Panel
    createXPPanel() {
        this.xpPanel = document.createElement("div");
        this.xpPanel.id = "thoughtquest-xp-panel";

        this.xpPanel.innerHTML = `
            <div id="xp-panel-content">
                <span id="xp-level">⚔️ Level ${this.level}</span>
                <span id="xp-count">${this.xp} XP</span>
            </div>
        `;

        document.body.appendChild(this.xpPanel);
        this.updateXPPanel();
    }

    updateXPPanel() {
        if (!this.xpPanel) return;
        document.getElementById("xp-count").innerText = `${this.xp} XP`;
        document.getElementById("xp-level").innerText = `⚔️ Level ${this.level}`;
    }

    async onunload() {
        console.log("⚔️ ThoughtQuest Plugin Unloaded.");
        if (this.xpBarContainer) {
            this.xpBarContainer.remove();
        }
        if (this.xpPanel) {
            this.xpPanel.remove();
        }
    }
}

// 🛠 Settings Tab
class ThoughtQuestSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        let { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "⚔️ ThoughtQuest Settings ⚡" });

        new Setting(containerEl)
            .setName("XP per Note Edit")
            .setDesc("How much XP you gain each time you modify a note.")
            .addText(text => text
                .setValue(this.plugin.settings.xpPerEdit.toString())
                .onChange(async (value) => {
                    this.plugin.settings.xpPerEdit = parseInt(value) || 10;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(containerEl)
            .setName("Show Floating XP Panel")
            .setDesc("Enable or disable the floating XP tracker.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showXPPanel)
                .onChange(async (value) => {
                    this.plugin.settings.showXPPanel = value;
                    await this.plugin.saveData(this.plugin.settings);
                    if (value) {
                        this.plugin.createXPPanel();
                    } else {
                        this.plugin.xpPanel?.remove();
                    }
                }));
    }
}

module.exports = ThoughtQuest;