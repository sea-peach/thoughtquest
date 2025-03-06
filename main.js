
const { Plugin, Notice } = require("obsidian");

class ThoughtQuest extends Plugin {
    async onload() {
        console.log("⚔️ ThoughtQuest Plugin Loaded! 🚀");

        // Load XP from saved data or set to 0
        this.xp = (await this.loadData())?.xp || 0;

        // Create and display the XP bar
        this.createXPBar();

        // Update XP when a note is modified
        this.registerEvent(
            this.app.vault.on("modify", this.gainXP.bind(this))
        );

        // Add a command to check XP
        this.addCommand({
            id: "check-xp",
            name: "Check XP",
            callback: () => {
                new Notice(`⚡ ThoughtQuest XP: ${this.xp}`);
                this.updateXPBar();
            },
        });
    }
    
    async gainXP() {
        this.xp += 10; // Gain XP per note edit
        await this.saveData({ xp: this.xp });
        console.log(`Gained XP! Current XP: ${this.xp}`);
        this.updateXPBar();
    }

    createXPBar() {
        // Create the XP bar UI
        this.xpBarContainer = document.createElement("div");
        this.xpBarContainer.id = "thoughtquest-xp-bar";

        this.xpFill = document.createElement("div");
        this.xpFill.id = "thoughtquest-xp-fill";

        this.xpBarContainer.appendChild(this.xpFill);
        document.body.appendChild(this.xpBarContainer);

        this.updateXPBar();
    }

    updateXPBar() {
        // Adjust the progress bar width based on XP
        const maxXP = 100; // Adjust this to change leveling speed
        let progress = (this.xp % maxXP) / maxXP * 100;
        this.xpFill.style.width = `${progress}%`;
    }

    async onunload() {
        console.log("⚔️ ThoughtQuest Plugin Unloaded.");
        if (this.xpBarContainer) {
            this.xpBarContainer.remove();
        }
    }
}

module.exports = ThoughtQuest;