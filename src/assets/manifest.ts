import type { AssetRef } from './loader';

export const PIECE_ASSETS: AssetRef[] = [
  { key: 'piece_hat',    url: '/assets/free/terrycaster/Hats_55x41px.png',   frameW: 55, frameH: 41 },
  { key: 'piece_boot',   url: '/assets/free/terrycaster/Boots_40x53px.png',  frameW: 40, frameH: 53 },
  { key: 'piece_bottle', url: '/assets/free/terrycaster/Botles_29x62px.png', frameW: 29, frameH: 62 },
  { key: 'piece_gold',   url: '/assets/free/terrycaster/Gold_35x39px.png',   frameW: 35, frameH: 39 },
  { key: 'piece_star',   url: '/assets/free/terrycaster/Stars_46x42px.png',  frameW: 46, frameH: 42 },
];

export const BACKGROUND_ASSETS: AssetRef[] = [
  { key: 'bg_layerA', url: '/assets/free/tilesets/yeehaw/Yeehaw/yeehaw_parallax_layerA_standard.png', frameW: 128, frameH: 48 },
  { key: 'bg_layerB', url: '/assets/free/tilesets/yeehaw/Yeehaw/yeehaw_parallax_layerB_standard.png', frameW: 128, frameH: 16 },
  { key: 'bg_layerC', url: '/assets/free/tilesets/yeehaw/Yeehaw/yeehaw_parallax_layerC_standard.png', frameW: 128, frameH: 96 },
];

export const SHOOTOUT_ASSETS: AssetRef[] = [
  { key: 'cowboy_idle',    url: '/assets/free/characters/SamuelLee/extracted/Cowboy (Animated Pixel Art)/Animation Sprite Sheets (PNG)/CowBoyIdle.png', frameW: 48, frameH: 48 },
  { key: 'cowboy_shoot',   url: '/assets/free/characters/SamuelLee/extracted/Cowboy (Animated Pixel Art)/Animation Sprite Sheets (PNG)/CowBoyShoot.png', frameW: 48, frameH: 48 },
  { key: 'cowboy_draw',    url: '/assets/free/characters/SamuelLee/extracted/Cowboy (Animated Pixel Art)/Animation Sprite Sheets (PNG)/CowBoyDrawWeapon.png', frameW: 48, frameH: 48 },
  { key: 'enemy_largehat', url: '/assets/free/characters/FagelTomten/extracted/Enemy/EnemyLargeHatAnimated.png', frameW: 64, frameH: 32 },
  { key: 'enemy_regular',  url: '/assets/free/characters/FagelTomten/extracted/Enemy/EnemyRegularAnimated.png',  frameW: 64, frameH: 32 },
  { key: 'enemy_spiked',   url: '/assets/free/characters/FagelTomten/extracted/Enemy/EnemySpikedAnimated.png',   frameW: 64, frameH: 32 },
  { key: 'explosion',      url: '/assets/free/characters/FagelTomten/extracted/Enemy/ExplosionAnimated.png',      frameW: 32, frameH: 32 },
  { key: 'wanted_poster',  url: '/assets/free/tilesets/yeehaw/Yeehaw/yeehaw_obj_wantedposter_sprite.png',        frameW: 8,  frameH: 16 },
  { key: 'bottle_prop',    url: '/assets/free/tilesets/yeehaw/Yeehaw/yeehaw_obj_bottle_sprite.png',              frameW: 8,  frameH: 16 },
  { key: 'tincan',         url: '/assets/free/tilesets/yeehaw/Yeehaw/yeehaw_obj_tincan_sprite.png',              frameW: 8,  frameH: 16 },
];

export const PUZZLE_ASSETS: AssetRef[] = [
  { key: 'house_1', url: '/assets/free/odistudio_extracted/WesternAllPack/Western house/House/FirstHouseAddShadown.png', frameW: 486, frameH: 383 },
  { key: 'house_2', url: '/assets/free/odistudio_extracted/WesternAllPack/Western house/House/WesterneHouse2.png', frameW: 469, frameH: 369 },
  { key: 'house_3', url: '/assets/free/odistudio_extracted/WesternAllPack/Western house/House/WesterneHouse3.png', frameW: 891, frameH: 572 },
  { key: 'signs',   url: '/assets/free/odistudio_extracted/WesternAllPack/Signalisation/Signe_Sheet.png',           frameW: 32,  frameH: 32 },
  { key: 'veg_16',  url: '/assets/free/odistudio_extracted/Vegetation/Vegetation 16x16sheet.png',                   frameW: 16,  frameH: 16 },
  { key: 'bones',   url: '/assets/free/odistudio_extracted/WesternAllPack/Bones/Bone_sheet.png',                    frameW: 16,  frameH: 16 },
];

export const UI_ASSETS: AssetRef[] = [
  { key: 'health_ui',  url: '/assets/free/characters/BlasterKnuckle/extracted/health_ui.png',   frameW: 48, frameH: 96 },
  { key: 'menu_tiles', url: '/assets/free/characters/BlasterKnuckle/extracted/menu_tiles.png',  frameW: 16, frameH: 16 },
  { key: 'item_icons', url: '/assets/free/characters/BlasterKnuckle/extracted/item_sprites.png', frameW: 16, frameH: 16 },
  { key: 'terry_dynamite', url: '/assets/free/terrycaster/Dynamite_44x47px.png', frameW: 44, frameH: 47 },
  { key: 'terry_revolver', url: '/assets/free/terrycaster/Revolver_64x44px.png', frameW: 64, frameH: 44 },
  { key: 'terry_belt',     url: '/assets/free/terrycaster/Belts_56x38px.png',    frameW: 56, frameH: 38 },
  { key: 'terry_wanted',   url: '/assets/free/terrycaster/Wanted_50x53px.png',   frameW: 50, frameH: 53 },
];

export const CHARACTER_ASSETS: AssetRef[] = [
  { key: 'grayger_idle', url: '/assets/free/characters/Grayger/extracted/Wild West Pixel Cowboy - Pixel Art Asset Pack/idle/cowboy_idle_right_spritesheet.png', frameW: 48, frameH: 48 },
  { key: 'oga_cowboy',   url: '/assets/free/characters/OGA/OGA_Cowboy32_Revolver.png', frameW: 32, frameH: 32 },
];

export const ALL_ASSETS: AssetRef[] = [
  ...PIECE_ASSETS,
  ...BACKGROUND_ASSETS,
  ...SHOOTOUT_ASSETS,
  ...PUZZLE_ASSETS,
  ...UI_ASSETS,
  ...CHARACTER_ASSETS,
];
