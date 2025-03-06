const { Plugin, Notice, Modal } = require("obsidian");

class ThoughtQuest extends Plugin {
    async onload() {
        console.log("⚔️ ThoughtQuest Plugin Loaded! 🚀");

        // Load XP and level from saved data or set to defaults
        let savedData = await this.loadData();
        this.xp = savedData?.xp || 0;
        this.level = Math.floor(this.xp / 100); // Level up every 100 XP

        // Create and display the XP bar
        this.createXPBar();

        // Update XP when a note is modified
        this.registerEvent(
            this.app.vault.on("modify", this.gainXP.bind(this))
        );

        // Command to check XP
        this.addCommand({
            id: "check-xp",
            name: "Check XP",
            callback: () => {
                new Notice(`⚡ ThoughtQuest XP: ${this.xp}`);
                this.updateXPBar();
            },
        });

        // Command to open ThoughtQuest Dashboard
        this.addCommand({
            id: "open-thoughtquest-dashboard",
            name: "Open ThoughtQuest Dashboard",
            callback: () => {
                new ThoughtQuestDashboard(this.app, this.xp, this.level).open();
            },
        });
    }
    
    async gainXP() {
        this.xp += 10; // Gain XP per note edit
        await this.saveData({ xp: this.xp });

        let newLevel = Math.floor(this.xp / 100);
        if (newLevel > this.level) {
            this.level = newLevel;
            new Notice(`🎉 Level Up! You reached Level ${this.level} ⚡`);
        }

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

// 🎯 ThoughtQuest Dashboard Class 🎯
class ThoughtQuestDashboard extends Modal {
    constructor(app, xp, level) {
        super(app);
        this.xp = xp;
        this.level = level;
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "⚔️ ThoughtQuest Dashboard ⚡" });
        contentEl.createEl("p", { text: `XP: ${this.xp}` });
        contentEl.createEl("p", { text: `Level: ${this.level}` });

        let nextLevelXP = (this.level + 1) * 100;
        let xpRemaining = nextLevelXP - this.xp;
        contentEl.createEl("p", { text: `Next Level: ${xpRemaining} XP away!` });

        let closeButton = contentEl.createEl("button", { text: "Close" });
        closeButton.onclick = () => this.close();
    }
}

module.exports = ThoughtQuest;