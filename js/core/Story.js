// js/core/Story.js

import { EQUIPMENT_DEFINITIONS } from '../constants/GameConstants.js';

export class StoryManager {
    constructor(game) {
        this.game = game;
        this.currentStoryId = null;
        this.storyProgress = {}; // Save story choices and progress
        this.isStoryActive = false;

        // Define the story content
        this.stories = {
            'intro': {
                id: 'intro',
                title: 'The Underground Explorer',
                events: {
                    'start': {
                        id: 'start',
                        text: 'You awaken in a dark cave, surrounded by strange glowing crystals. Your head throbs, and you remember nothing of how you got here. But you feel a strange pull, an urge to explore deeper into the earth.',
                        choices: [
                            {
                                text: 'Look around for clues',
                                nextEvent: 'explore_cave'
                            },
                            {
                                text: 'Follow the glowing crystals',
                                nextEvent: 'follow_crystals'
                            }
                        ]
                    },
                    'explore_cave': {
                        id: 'explore_cave',
                        text: 'You find an old pickaxe lying nearby, and some basic mining tools. There are strange symbols carved into the walls - ancient runes that speak of a legendary treasure hidden deep within the mines.',
                        choices: [
                            {
                                text: 'Take the pickaxe and start mining',
                                nextEvent: 'learn_mining',
                                reward: { item: 'WOODEN_PICKAXE', type: 'equipment' }
                            },
                            {
                                text: 'Ignore the tools and explore further',
                                nextEvent: 'meet_merchant'
                            }
                        ]
                    },
                    'follow_crystals': {
                        id: 'follow_crystals',
                        text: 'The crystals lead you to a small underground village. The inhabitants are friendly dwarves who explain that you\'ve been chosen by the earth spirits to become a great miner.',
                        choices: [
                            {
                                text: 'Accept their training',
                                nextEvent: 'learn_mining',
                                reward: { item: 'STONE_PICKAXE', type: 'equipment' }
                            },
                            {
                                text: 'Decline and explore alone',
                                nextEvent: 'lone_explorer'
                            }
                        ]
                    },
                    'learn_mining': {
                        id: 'learn_mining',
                        text: 'The dwarves teach you the basics of mining. "Remember," they say, "different materials require different tools. Start with the soft earth and work your way up to the precious gems."',
                        choices: [
                            {
                                text: 'Thank them and continue',
                                nextEvent: 'end_intro'
                            }
                        ]
                    },
                    'meet_merchant': {
                        id: 'meet_merchant',
                        text: 'You encounter a wandering merchant who offers to sell you basic equipment. "New to these mines, eh? Here, take this starter gear - it\'ll help you survive down here."',
                        choices: [
                            {
                                text: 'Accept the gift',
                                nextEvent: 'merchant_gift',
                                reward: { coins: 50 }
                            },
                            {
                                text: 'Politely decline',
                                nextEvent: 'end_intro'
                            }
                        ]
                    },
                    'lone_explorer': {
                        id: 'lone_explorer',
                        text: 'You venture alone into the unknown depths. The caves are treacherous, but you feel empowered by your independence. "I\'ll find my own way," you think.',
                        choices: [
                            {
                                text: 'Continue exploring',
                                nextEvent: 'end_intro'
                            }
                        ]
                    },
                    'merchant_gift': {
                        id: 'merchant_gift',
                        text: 'The merchant gives you 50 coins and some advice: "Spend wisely on equipment. Better tools mean better loot, and better loot means more money to buy even better tools!"',
                        choices: [
                            {
                                text: 'Thank him and leave',
                                nextEvent: 'end_intro'
                            }
                        ]
                    },
                    'end_intro': {
                        id: 'end_intro',
                        text: 'Your adventure begins now. Explore the mines, gather resources, defeat enemies, and uncover the secrets of the underground world. Remember, every choice shapes your destiny.',
                        choices: [
                            {
                                text: 'Begin the adventure!',
                                nextEvent: null // End story
                            }
                        ]
                    }
                }
            }
        };
    }

    // Start a story
    startStory(storyId) {
        if (!this.stories[storyId]) {
            console.error(`Story ${storyId} not found`);
            return false;
        }

        if (!this.game.ui || typeof this.game.ui.showStoryDialog !== 'function') {
            console.warn('UI not ready for story display');
            return false;
        }

        this.currentStoryId = storyId;
        this.isStoryActive = true;

        // Start with the first event
        const story = this.stories[storyId];
        const firstEventId = Object.keys(story.events)[0];
        this.showEvent(firstEventId);

        return true;
    }

    // Show a story event
    showEvent(eventId) {
        const story = this.stories[this.currentStoryId];
        if (!story || !story.events[eventId]) {
            console.error(`Event ${eventId} not found in story ${this.currentStoryId}`);
            this.endStory();
            return;
        }

        const event = story.events[eventId];
        this.currentEventId = eventId;

        // Show dialog
        this.game.ui.showStoryDialog(event.title || story.title, event.text, event.choices, (choiceIndex) => {
            this.handleChoice(choiceIndex);
        });
    }

    // Handle player choice
    handleChoice(choiceIndex) {
        const story = this.stories[this.currentStoryId];
        if (!story || !story.events) {
            console.error('Story not found or invalid');
            this.endStory();
            return;
        }
        const event = story.events[this.currentEventId];
        if (!event) {
            console.error('Event not found');
            this.endStory();
            return;
        }
        const choice = event.choices[choiceIndex];

        if (!choice) {
            console.error('Invalid choice');
            return;
        }

        // Record progress
        this.storyProgress[this.currentStoryId] = this.storyProgress[this.currentStoryId] || {};
        this.storyProgress[this.currentStoryId][this.currentEventId] = choiceIndex;

        // Give reward if any
        if (choice.reward) {
            this.giveReward(choice.reward);
        }

        // Move to next event or end
        if (choice.nextEvent) {
            this.showEvent(choice.nextEvent);
        } else {
            this.endStory();
        }
    }

    // Give reward to player
    giveReward(reward) {
        if (!this.game || !this.game.player) {
            console.warn('Story: Cannot give reward - player not available');
            return;
        }

        if (reward.item && reward.type === 'equipment') {
            // Get equipment definition
            const equipDef = EQUIPMENT_DEFINITIONS[reward.item];
            if (equipDef) {
                const item = {
                    ...equipDef,
                    durability: equipDef.durability,
                    maxDurability: equipDef.durability,
                    equipmentType: reward.item, // Add equipmentType for sprite lookup
                    id: reward.item.toLowerCase()
                };
                this.game.player.inventory.addItem(item);
                this.game.ui.showNotification(`Received ${item.name}!`, 'success');
            }
        } else if (reward.coins) {
            this.game.player.coins += reward.coins;
            this.game.ui.showNotification(`Received ${reward.coins} coins!`, 'success');
        }
    }

    // End the current story
    endStory() {
        this.isStoryActive = false;
        this.currentStoryId = null;
        this.currentEventId = null;

        // Hide dialog if UI method is available
        if (this.game.ui && typeof this.game.ui.hideStoryDialog === 'function') {
            this.game.ui.hideStoryDialog();
        }
    }

    // Check if story is completed
    isStoryCompleted(storyId) {
        return this.storyProgress[storyId] && Object.keys(this.storyProgress[storyId]).length > 0;
    }

    // Serialize for saving
    serialize() {
        return {
            currentStoryId: this.currentStoryId,
            storyProgress: this.storyProgress,
            isStoryActive: this.isStoryActive,
            currentEventId: this.currentEventId
        };
    }

    // Deserialize from save
    deserialize(data) {
        this.currentStoryId = data.currentStoryId || null;
        this.storyProgress = data.storyProgress || {};
        this.isStoryActive = data.isStoryActive || false;
        this.currentEventId = data.currentEventId || null;

        // If story was active, resume it
        if (this.isStoryActive && this.currentStoryId && this.currentEventId) {
            this.showEvent(this.currentEventId);
        }
    }
}
