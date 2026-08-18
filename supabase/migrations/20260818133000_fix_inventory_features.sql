-- Corrective migration to fix incorrect, conflicting, and missing product features

-- 1. Fix incorrect assignments
-- Chime (244) - should be ringer/receiver features, not camera features
UPDATE "inventory list" SET features = ARRAY[
  'Wireless indoor doorbell receiver',
  'Adjustable volume & ringtone options',
  'Simple pairing with smart video doorbells'
] WHERE id = 244;

-- Adapter Charger (373) - should be charger features, not battery features
UPDATE "inventory list" SET features = ARRAY[
  'DC power adapter for smart devices',
  'Plug-and-play, compact design',
  'Provides stable power supply'
] WHERE id = 373;

-- Access Control (336) - should be access reader features, not electric lock features
UPDATE "inventory list" SET features = ARRAY[
  'Standalone access control reader',
  'Supports RFID cards & numeric codes',
  'Controls electric lock release',
  'Weatherproof installation'
] WHERE id = 336;

-- Hotel lock Engine (276) - should be lock motor features, not curtain engine features
UPDATE "inventory list" SET features = ARRAY[
  'Replacement motor for hotel locks',
  'Direct-fit design for compatible models',
  'Low power consumption',
  'Highly durable build'
] WHERE id = 276;

-- Intercom - 02 (342) - should be intercom features, not hotel lock features
UPDATE "inventory list" SET features = ARRAY[
  'Video intercom indoor station',
  'Two-way audio & video call support',
  'Pairs with outdoor door station',
  'Wall-mounted touchscreen display'
] WHERE id = 342;

-- Hotel lock Battery case (369) - should be battery case features, not hotel lock features
UPDATE "inventory list" SET features = ARRAY[
  'Replacement battery case for hotel locks',
  'Easy snap-in installation',
  'Standard size for common hotel lock models'
] WHERE id = 369;


-- 2. Resolve conflicting/overwritten assignments
-- Charger For Door Bell (303) - should be charger features, not camera features
UPDATE "inventory list" SET features = ARRAY[
  'Charger for video doorbells',
  'Durable charging cable included',
  'Standard power outlet compatibility'
] WHERE id = 303;

-- Doorbell charger (242) - should be charger features, not battery or cable features
UPDATE "inventory list" SET features = ARRAY[
  'Charger for video doorbells',
  'Durable charging cable included',
  'Standard power outlet compatibility'
] WHERE id = 242;

-- Okam indoor & outdoor Camera with panel (374) - ensure correct camera + panel features
UPDATE "inventory list" SET features = ARRAY[
  'HD indoor & outdoor camera',
  'Comes with separate solar/power panel',
  'Motion alerts & remote viewing via app',
  'Two-way audio support'
] WHERE id = 374;

-- Video door phone Big & Small (262, 261) - ensure intercom features
UPDATE "inventory list" SET features = ARRAY[
  'Video intercom with indoor monitor',
  'Two-way audio communication',
  'Remote door unlock option',
  'Night vision camera'
] WHERE id IN (261, 262);


-- 3. Fix wrong assignments from the previous grouping (e.g. trackers getting RFID card features)
-- Trackers (339, 340) - should be Bluetooth tracker features, not RFID cards
UPDATE "inventory list" SET features = ARRAY[
  'Bluetooth item tracker',
  'Locate lost keys/wallets via mobile app',
  'Compact & lightweight key fob design',
  'Replaceable long-life battery'
] WHERE id IN (339, 340);

-- Tags (278, 279) - should be RFID fob/tag features, not cards
UPDATE "inventory list" SET features = ARRAY[
  'RFID key fob/tag for access control',
  'Compact, keychain-ready design',
  'Compatible with RFID readers & smart locks'
] WHERE id IN (278, 279);

-- Non Encrypted card (256) - clarify as non-encrypted card
UPDATE "inventory list" SET features = ARRAY[
  'Standard proximity card for access',
  'Non-encrypted, compatible with RFID readers',
  'Durable, wallet-friendly design'
] WHERE id = 256;
