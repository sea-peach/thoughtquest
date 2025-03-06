const { Plugin, Notice, Modal, Setting } = require("obsidian");

class ThoughtQuest extends Plugin {
    async onload() {
        console.log("⚔️ ThoughtQuest Plugin Loaded! 🚀");

        // Load settings or set defaults
        this.settings = Object.assign({
            xpPerEdit: 10,
            xpPerLevel: 100,
            showXPBar: true,
        }, await this.loadData());

        // Load XP & Level
        let savedData = await this.loadData();
        this.xp = savedData?.xp || 0;
        this.level = Math.floor(this.xp / this.settings.xpPerLevel);

        // Create XP Bar if enabled
        if (this.settings.showXPBar) {
            this.createXPBar();
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

    async onunload() {
        console.log("⚔️ ThoughtQuest Plugin Unloaded.");
        if (this.xpBarContainer) {
            this.xpBarContainer.remove();
        }
    }
}

// 🎯 ThoughtQuest Dashboard 🎯
class ThoughtQuestDashboard extends Modal {
    constructor(app, xp, level, settings) {
        super(app);
        this.xp = xp;
        this.level = level;
        this.settings = settings;
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "⚔️ ThoughtQuest Dashboard ⚡" });
        contentEl.createEl("p", { text: `XP: ${this.xp}` });
        contentEl.createEl("p", { text: `Level: ${this.level}` });

        let nextLevelXP = (this.level + 1) * this.settings.xpPerLevel;
        let xpRemaining = nextLevelXP - this.xp;
        contentEl.createEl("p", { text: `Next Level: ${xpRemaining} XP away!` });

        let closeButton = contentEl.createEl("button", { text: "Close" });
        closeButton.onclick = () => this.close();
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

        // XP Per Edit
        new Setting(containerEl)
            .setName("XP per Note Edit")
            .setDesc("How much XP you gain each time you modify a note.")
            .addText(text => text
                .setValue(this.plugin.settings.xpPerEdit.toString())
                .onChange(async (value) => {
                    this.plugin.settings.xpPerEdit = parseInt(value) || 10;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        // XP Per Level
        new Setting(containerEl)
            .setName("XP per Level")
            .setDesc("XP required to level up.")
            .addText(text => text
                .setValue(this.plugin.settings.xpPerLevel.toString())
                .onChange(async (value) => {
                    this.plugin.settings.xpPerLevel = parseInt(value) || 100;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        // Toggle XP Bar
        new Setting(containerEl)
            .setName("Show XP Bar")
            .setDesc("Enable or disable the XP progress bar.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showXPBar)
                .onChange(async (value) => {
                    this.plugin.settings.showXPBar = value;
                    await this.plugin.saveData(this.plugin.settings);
                    if (value) {
                        this.plugin.createXPBar();
                    } else {
                        this.plugin.xpBarContainer?.remove();
                    }
                }));
    }
}

module.exports = ThoughtQuest;