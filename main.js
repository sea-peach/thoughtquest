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
    
        this.achievements = {
            "first-edit": { title: "📜 The First Step", desc: "Modify a note for the first time.", unlocked: false },
            "deep-thinker": { title: "🧠 Deep Thinker", desc: "Reach 500 XP.", unlocked: false },
            "cosmic-cartographer": { title: "🌌 Cosmic Cartographer", desc: "Reach 1000 XP.", unlocked: false },
            "philosopher-king": { title: "👑 Philosopher King", desc: "Reach 5000 XP.", unlocked: false }
        };
        
        // Load achievements from saved data
        let savedData = await this.loadData();
        this.xp = savedData?.xp || 0;
        this.level = Math.floor(this.xp / this.settings.xpPerLevel);
        this.achievements = Object.assign(this.achievements, savedData?.achievements || {});
        
        // Check if we need to unlock any achievements
        this.checkAchievements();
    
    }
    
    async checkAchievements() {
        let unlocked = false;
    
        if (!this.achievements["first-edit"].unlocked && this.xp > 0) {
            this.unlockAchievement("first-edit");
            unlocked = true;
        }
    
        if (!this.achievements["deep-thinker"].unlocked && this.xp >= 500) {
            this.unlockAchievement("deep-thinker");
            unlocked = true;
        }
    
        if (!this.achievements["cosmic-cartographer"].unlocked && this.xp >= 1000) {
            this.unlockAchievement("cosmic-cartographer");
            unlocked = true;
        }
    
        if (!this.achievements["philosopher-king"].unlocked && this.xp >= 5000) {
            this.unlockAchievement("philosopher-king");
            unlocked = true;
        }
    
        if (unlocked) {
            await this.saveData({ xp: this.xp, achievements: this.achievements });
        }
    }
    
    async gainXP() {
        this.xp += this.settings.xpPerEdit;
        await this.saveData({ xp: this.xp, achievements: this.achievements });
    
        let newLevel = Math.floor(this.xp / this.settings.xpPerLevel);
        if (newLevel > this.level) {
            this.level = newLevel;
            new Notice(`🎉 Level Up! You reached Level ${this.level} ⚡`);
        }
    
        console.log(`Gained XP! Current XP: ${this.xp}`);
        this.updateXPBar();
        this.updateXPPanel();
    
        // Check if a new achievement should be unlocked
        this.checkAchievements();
    }

    unlockAchievement(key) {
        this.achievements[key].unlocked = true;
        new Notice(`🏆 Achievement Unlocked: ${this.achievements[key].title}\n${this.achievements[key].desc}`);
        console.log(`🏆 Unlocked: ${this.achievements[key].title}`);
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
            <div id="xp-panel-header">⚔️ ThoughtQuest</div>
            <div id="xp-panel-content">
                <span id="xp-level">⚔️ Level ${this.level}</span>
                <span id="xp-count">${this.xp} XP</span>
            </div>
        `;
    
        document.body.appendChild(this.xpPanel);
    
        // Load saved position (default to top-right)
        let savedPosition = this.settings.xpPanelPosition || { top: "20px", left: "auto", right: "20px" };
        Object.assign(this.xpPanel.style, savedPosition);
    
        this.updateXPPanel();
    
        // Make panel draggable
        this.makePanelDraggable(this.xpPanel);
    }
    
    makePanelDraggable(panel) {
        let offsetX, offsetY, isDragging = false;
    
        const header = panel.querySelector("#xp-panel-header");
    
        header.addEventListener("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            panel.style.transition = "none"; // Disable animation while dragging
        });
    
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
    
            panel.style.left = `${x}px`;
            panel.style.top = `${y}px`;
            panel.style.right = "auto"; // Reset right to allow free positioning
        });
    
        document.addEventListener("mouseup", async () => {
            if (isDragging) {
                isDragging = false;
                panel.style.transition = "0.3s ease-in-out"; // Re-enable animation
    
                // Save new position to settings
                this.settings.xpPanelPosition = {
                    top: panel.style.top,
                    left: panel.style.left,
                    right: panel.style.right
                };
                await this.saveData(this.settings);
            }
        });
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
            .setName("XP per Level")
            .setDesc("XP required to level up.")
            .addText(text => text
                .setValue(this.plugin.settings.xpPerLevel.toString())
                .onChange(async (value) => {
                    this.plugin.settings.xpPerLevel = parseInt(value) || 100;
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

        new Setting(containerEl)
            .setName("Show XP Progress Bar")
            .setDesc("Enable or disable the XP progress bar at the bottom.")
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

        new Setting(containerEl)
            .setName("Show Achievements in Dashboard")
            .setDesc("Enable or disable achievement tracking in the ThoughtQuest dashboard.")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showAchievements)
                .onChange(async (value) => {
                    this.plugin.settings.showAchievements = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));
    }
}

module.exports = ThoughtQuest;