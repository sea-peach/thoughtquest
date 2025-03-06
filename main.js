
const { Plugin, Notice } = require("obsidian");

class ThoughtQuest extends Plugin {
    async onload() {
        console.log("⚔️ ThoughtQuest Plugin Loaded! 🚀");

        // Load XP from saved data or set to 0
        this.xp = (await this.loadData())?.xp || 0;

        // Command to check XP
        this.addCommand({
            id: "check-xp",
            name: "Check XP",
            callback: () => {
                new Notice(`⚡ ThoughtQuest XP: ${this.xp}`);
            },
        });

        // Gain XP when modifying a note
        this.registerEvent(
            this.app.vault.on("modify", this.gainXP.bind(this))
        );
    }

    async gainXP() {
        this.xp += 10; // Gain 10 XP per note edit
        await this.saveData({ xp: this.xp });
        console.log(`Gained XP! Current XP: ${this.xp}`);
    }

    async onunload() {
        console.log("⚔️ ThoughtQuest Plugin Unloaded.");
    }
}

module.exports = ThoughtQuest;