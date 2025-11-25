# Mine Quest - Comprehensive Architecture Documentation (Updated)

## 1. Game Overview

Mine Quest is a 2D grid-based exploration and mining game with no predefined quests. Players explore procedurally generated underground worlds, mine resources, battle enemies, and create their own goals in a sandbox environment. The game features a side-view perspective with a 13x13 visible grid that shifts as the player moves, creating an illusion of a larger world. The game includes multiple game modes, a fog of war system, and is optimized for various platforms including Steam Deck.

## 2. Core Game Mechanics

### 2.1 World Generation
- **Procedural Generation**: Areas (40x40 to 200x200 cells) are generated using algorithms that ensure each area has at least one exit, one merchant, and one boss enemy
- **Area Types**: Mines, Caves, Crystal Caverns, Ancient Ruins, and Cosmic Regions with varying difficulty and resource distribution
- **Connectivity System**: Areas are connected through doors that transport players between different regions
- **Persistence**: Visited areas are stored in memory to maintain their state
- **Custom Area Mode**: Players can create and share their own custom areas with specific layouts and challenges
- **Fog of War**: Undiscovered cells beyond an 11x11 border around the player are hidden, creating exploration mystery

### 2.2 Player Mechanics
- **Movement**: Grid-based movement with WASD keys, touch controls, or on-screen D-Pad
- **Mining**: Players can mine various materials (dirt, rock, crystal, gem, gold) with their pickaxe
- **Combat**: Turn-based combat system with damage calculations based on equipment and enemy stats
- **Progression**: Experience-based leveling system that increases health and provides stat improvements
- **Vision System**: Player reveals the map as they explore, with a visibility range of 11x11 cells

### 2.3 Game Modes
- **Standard Mode**: Traditional exploration with no time limits and procedurally generated areas
- **Custom Mode**: Play in player-created or community-shared custom areas with specific challenges
- **Gauntlet Mode**: Time-based challenge where players must find the exit within 10 minutes across increasingly difficult areas

### 2.4 Resource Management
- **Inventory System**: 40-slot inventory with stacking for resources and equipment
- **Equipment System**: Six equipment slots (helmet, armor, boots, pickaxe, gloves, amulet) that provide stat bonuses
- **Durability System**: Equipment degrades with use and requires repair or replacement
- **Economy**: Players can trade resources with merchants for coins and better equipment

### 2.5 Entity System
- **Enemies**: Various enemy types with different behaviors (passive/aggressive), health, damage, and experience rewards
- **Merchants**: NPCs that buy and sell items, with inventories that restock periodically
- **Chests**: Containers with random loot that can be opened once per area

## 3. Technical Architecture

### 3.1 Technology Stack
- **Frontend**: HTML5 Canvas for rendering, vanilla JavaScript for game logic
- **Module System**: ES6 modules for code organization and maintainability
- **Storage**: LocalStorage for save game persistence and custom area storage
- **Styling**: CSS3 with responsive design for cross-platform compatibility
- **Platform Support**: Optimized for desktop, mobile, and Steam Deck with appropriate control schemes

### 3.2 File Structure
```
underground-explorer/
├── index.html              # Main HTML file
├── css/
│   ├── styles.css          # Main styling rules
│   └── startpage.css       # Start page specific styles
├── js/
│   ├── main.js             # Entry point
│   ├── constants/
│   │   └── GameConstants.js # Game constants and definitions
│   ├── core/
│   │   ├── Game.js         # Main game loop and rendering
│   │   ├── Player.js       # Player class and mechanics
│   │   ├── Enemy.js        # Enemy class and AI
│   │   ├── Area.js         # Area generation and management
│   │   └── FogOfWar.js     # Fog of war system
│   ├── systems/
│   │   ├── Inventory.js    # Inventory management
│   │   ├── Equipment.js    # Equipment system
│   │   ├── Merchant.js     # Merchant logic
│   │   ├── Timer.js        # Timer system for gauntlet mode
│   │   ├── CustomArea.js   # Custom area creation and sharing
│   │   ├── SaveSystem.js   # Save/load functionality
│   │   └── AudioSystem.js  # Audio management
│   ├── ui/
│   │   ├── UI.js           # User interface management
│   │   ├── StartPage.js    # Start page implementation
│   │   ├── ResponsiveDesign.js # Responsive layout handling
│   │   ├── TouchControls.js # Touch controls for mobile
│   │   └── SaveLoadUI.js   # Save/load UI components
│   ├── modes/
│   │   ├── StandardMode.js # Standard game mode
│   │   ├── CustomMode.js   # Custom area game mode
│   │   └── GauntletMode.js # Time-based challenge mode
│   └── utils/
│       └── Utils.js        # Utility functions
└── assets/
    ├── images/             # Image assets
    ├── sounds/             # Sound assets
    └── customareas/        # Custom area data
```

### 3.3 Module Dependencies
```
main.js
├── StartPage.js
│   ├── UI.js
│   └── GameConstants.js
└── Game.js
    ├── Player.js
    ├── Enemy.js
    ├── Area.js
    ├── FogOfWar.js
    ├── Inventory.js
    ├── Equipment.js
    ├── Merchant.js
    ├── Timer.js
    ├── CustomArea.js
    ├── StandardMode.js
    ├── CustomMode.js
    ├── GauntletMode.js
    ├── AudioSystem.js
    └── UI.js
```

## 4. Data Structures

### 4.1 Game State
```javascript
{
  currentArea: Area,
  player: Player,
  inventory: Inventory,
  equipment: Equipment,
  merchants: Map<string, Merchant>,
  visitedAreas: Map<string, Area>,
  enemies: Map<string, Enemy>,
  fogOfWar: FogOfWar,
  gameMode: 'standard' | 'custom' | 'gauntlet',
  animationFrame: number,
  isMoving: boolean,
  isMining: boolean,
  miningTarget: {x, y} | null,
  timeRemaining: number // Only for gauntlet mode
}
```

### 4.2 Area Structure
```javascript
{
  id: string,
  name: string,
  width: number,
  height: number,
  difficulty: number,
  grid: number[], // 2D array flattened to 1D
  connections: Connection[],
  isCustom: boolean, // True for custom areas
  creatorName: string, // For custom areas
  timeLimit: number // For gauntlet mode areas
}
```

### 4.3 Fog of War Structure
```javascript
{
  visibilityRadius: number, // 11 cells
  discoveredCells: Set<string>, // Coordinates of discovered cells
  currentlyVisible: Set<string> // Coordinates currently visible to player
}
```

## 5. UI/UX Design

### 5.1 Interface Architecture
- **Start Page**: Main menu with animated background and navigation buttons
- **Game Info Bar**: Displays area name, exit count, player level, health, experience, and coins
- **Game Canvas**: Main game rendering area with 13x13 visible grid
- **Fog of War Overlay**: Visual representation of undiscovered areas
- **Timer Display**: Countdown timer for gauntlet mode
- **Overlay Panels**: Modal-style panels for inventory and equipment that appear over the game
- **Context Menus**: Right-click/long-press menus for item interactions
- **Dialog System**: Modal dialogs for merchants, save/load, and other interactions

### 5.2 Start Page Design
- **Animated Background**: Parallax scrolling underground environment with animated elements
- **Navigation Buttons**: 
  - Start Quest: Begin standard mode
  - Challenges: Access custom and gauntlet modes
  - Options: Configure game settings
  - How to Play: Display instructions and controls
  - Exit Game: Close the application
- **Responsive Layout**: Adapts to different screen sizes and orientations

### 5.3 Input Handling
- **Keyboard**: WASD for movement, I/E for inventory/equipment, ESC to close menus
- **Mouse**: Click for movement, right-click for context menus, drag-and-drop for inventory
- **Touch**: On-screen D-pad for movement, long-press for context menus
- **Steam Deck**: Optimized controls with proper button mapping and touch screen support
- **Responsive Design**: Adapts to different screen sizes with appropriate controls

## 6. Rendering System

### 6.1 Rendering Pipeline
1. **Clear Canvas**: Reset the drawing surface
2. **Calculate Viewport**: Determine visible area based on player position
3. **Render Terrain**: Draw all visible cells with appropriate textures
4. **Apply Fog of War**: Render fog overlay for undiscovered cells
5. **Render Entities**: Draw enemies, merchants, and other entities
6. **Render Player**: Draw player character with equipment and animations
7. **Render Effects**: Draw damage numbers, mining highlights, and other effects
8. **Render UI Elements**: Draw timer, health bars, and other UI elements

### 6.2 Animation System
- **Frame-based Animation**: Uses requestAnimationFrame for smooth 60fps rendering
- **Entity Animations**: Idle animations for breathing/movement, attack animations for combat
- **Environmental Effects**: Sparkles for crystals, shimmer for gold, wing flaps for bats
- **Start Page Animations**: Parallax scrolling, particle effects, and animated UI elements

### 6.3 Fog of War Rendering
- **Visibility Calculation**: Determine which cells are within the 11x11 visibility radius
- **Discovery Tracking**: Track which cells have been discovered by the player
- **Rendering Layers**: Apply fog effect to undiscovered cells while maintaining visibility of discovered areas
- **Transition Effects**: Smooth transitions when revealing new areas

## 7. Input Handling

### 7.1 Input Processing
- **Event Listeners**: Capture keyboard, mouse, and touch events
- **Input Mapping**: Translate raw inputs to game actions
- **Input Validation**: Prevent invalid actions (moving into walls, mining empty air)
- **Platform Adaptation**: Special handling for different input methods and platforms

### 7.2 Steam Deck Optimization
- **Control Mapping**: Map Steam Deck buttons to appropriate game actions
- **Touch Integration**: Utilize Steam Deck's touch screen for inventory management
- **Performance Tuning**: Optimize rendering and performance for Steam Deck hardware
- **UI Scaling**: Ensure UI elements are appropriately sized for the Steam Deck screen

### 7.3 Context Menu System
- **Position Calculation**: Determine appropriate position for context menus
- **Option Generation**: Create context-specific options based on item type
- **Event Handling**: Process menu selections and execute appropriate actions

## 8. Game Modes Implementation

### 8.1 Standard Mode
- **Unlimited Exploration**: No time constraints or special rules
- **Procedural Generation**: Randomly generated areas with standard difficulty progression
- **Full Feature Set**: Access to all game mechanics and systems

### 8.2 Custom Mode
- **Area Selection**: Choose from pre-made custom areas or community creations
- **Area Creation**: Tools for players to design and share their own areas
- **Challenge Rating**: Community-voted difficulty ratings for custom areas
- **Sharing System**: Export/import custom areas for community sharing

### 8.3 Gauntlet Mode
- **Time Challenge**: 10-minute timer to find the exit
- **Progressive Difficulty**: Areas become increasingly challenging
- **Score System**: Points based on completion time, resources collected, and enemies defeated
- **Leaderboard**: Track best times and scores for competitive play

## 9. Save/Load System

### 9.1 Data Serialization
- **JSON Format**: Convert game state to JSON for storage
- **Selective Serialization**: Only save necessary data to minimize storage requirements
- **Version Compatibility**: Structure data to allow for future updates without breaking saves
- **Mode-specific Data**: Handle different save requirements for each game mode

### 9.2 Storage Management
- **Multiple Save Slots**: Support for multiple save games
- **Auto-save**: Periodic automatic saving to prevent data loss
- **Save Validation**: Verify save data integrity before loading
- **Custom Area Storage**: Separate storage system for custom areas

## 10. Performance Considerations

### 10.1 Rendering Optimization
- **Viewport Culling**: Only render visible portions of the game world
- **Fog of War Optimization**: Efficient visibility calculations and rendering
- **Canvas Optimization**: Use efficient drawing operations and minimize state changes
- **Animation Throttling**: Limit animation updates to maintain consistent frame rate

### 10.2 Memory Management
- **Area Caching**: Keep recently visited areas in memory for quick access
- **Entity Pooling**: Reuse enemy objects to minimize garbage collection
- **Resource Management**: Efficient loading and unloading of game assets
- **Steam Deck Memory**: Optimize memory usage for Steam Deck's constraints

## 11. Platform Compatibility

### 11.1 Cross-Platform Support
- **Responsive Design**: Adapts to different screen sizes and aspect ratios
- **Input Flexibility**: Supports multiple input methods for different platforms
- **Performance Scaling**: Adjusts quality settings based on device capabilities
- **Steam Deck Integration**: Special optimizations for Steam Deck hardware and controls

### 11.2 Steam Deck Specific Features
- **Control Profiles**: Custom control schemes optimized for Steam Deck
- **Performance Modes**: Settings to balance quality and performance
- **Cloud Save Integration**: Utilize Steam's cloud save system
- **Achievement Support**: Framework for Steam achievements

## 12. Future Extensibility

### 12.1 Modular Design
- **Loose Coupling**: Minimize dependencies between modules
- **Plugin Architecture**: Design systems to allow for easy addition of new features
- **Configuration-driven**: Use data files for game balance and content

### 12.2 Expansion Points
- **New Game Modes**: Framework for adding additional game modes
- **Custom Area Tools**: Enhanced area creation tools with more options
- **Multiplayer Support**: Architecture designed to potentially support multiplayer features
- **Steam Workshop Integration**: Support for sharing custom areas through Steam Workshop

## 13. Security Considerations

### 13.1 Client-side Validation
- **Input Sanitization**: Validate all user inputs to prevent exploits
- **Save Data Integrity**: Verify save data to prevent tampering
- **Custom Area Validation**: Ensure custom areas don't contain malicious content
- **State Consistency**: Ensure game state remains consistent across operations

### 13.2 Code Organization
- **Module Scope**: Use module scope to prevent global namespace pollution
- **Data Encapsulation**: Hide implementation details behind well-defined interfaces
- **Error Handling**: Robust error handling to prevent crashes and exploits

This updated architecture provides a comprehensive foundation for Mine Quest with support for multiple game modes, fog of war mechanics, Steam Deck compatibility, and a polished start page experience. The modular design ensures maintainability while allowing for future expansion and cross-platform compatibility.

plan the generation of the code base in steps. i will initiate execution step by step. check your work after final step.