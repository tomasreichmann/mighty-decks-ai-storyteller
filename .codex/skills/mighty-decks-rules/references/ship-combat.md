# Ship Combat

Ship combat uses normal Mighty Decks pacing, but the table represents ships through cards and tokens.

## Components

- Location cards are ship rooms.
- Device Asset cards sit on rooms and represent systems.
- Circular Power tokens sit on Device cards and show assigned Power.
- Actor/minis tokens stand in the Location the Actor is manning.
- Effect cards mark Device damage, Location statuses, and crew pressure.

## Round Shape

- Each Actor may move to any Location on the same small ship and take one action.
- Most ship actions activate the Device in the Actor's current Location.
- End of Round cleanup clears Device Used markers and flips spent Power tokens back active.

## Power And Devices

- Reactor or Generator level defines the ship's total Power pool.
- Players assign active Power tokens to Devices.
- A Device may spend up to the lower of assigned active Power and effective level.
- Effective level is `level - damage`.
- A Device with damage equal to its level is destroyed and cannot be used.
- Default prototype rule: flip spent tokens to a used side and lock them on the Device until cleanup.
- Most Devices receive a Device Used marker after activation unless the Device text says otherwise.

## Attacks

- An Actor at a powered weapon Device may attack another ship.
- The Actor may spend less Power than the Device maximum.
- If Sensors Detection is higher than target Cloaking, choose a specific Device or hull target.
- Otherwise choose the target Device randomly by dice.
- Target pilot may defend with an Outcome card.
- Damage is `attacker Outcome Effect + weapon damage - defender Outcome Effect - Shields`.
- Positive damage applies to the targeted Device first.
- Overflow after Device destruction applies to hull and gives the hit Location a status.
- At hull points, the ship enters Rupture Cascade; it cannot be stopped and the ship breaks up at the end of the next turn.

## Flight Controls

Flight Controls do not require Power and cannot be targeted from outside, but powered Engines are needed to change range or dodge effectively.

Pilot options include:

- Change range closer or farther.
- Dodge incoming ship attacks with an Outcome card.
- Line up a shot to grant Boost to a turret.
- Use terrain for cover or positional Boost.
- Break target lock or cover a boarding approach.
- Brace the ship to reduce the next Location status severity.

## Device Examples

- Weapon Turret: powered attacks or missile defense.
- Sensors: scanners, weakpoints, Complication on target Device, electronic warfare, Detection/Cloaking split.
- Shields: damage reduction and type-specific tuning.
- Engines: range pressure and overdrive.
- Spin Drive: travel system requiring Power and spin-up rounds.
- Life Support: gravity, atmosphere, depressurization, temperature, doors, airlocks.
- Workbench: crafting, Device repair, missile prep, tool-heavy fabrication.
- Missile Bay: craft, load, and target missiles; no Power requirement; missiles pass through shields but cost resources.
- Reactor: provides Power, can boost output, cut systems, or trigger Rupture Cascade.

## Special Locations

- Docking Bay: shuttle/fighter launch, recovery, boarding, small-craft defense.
- Cargo Bay: cargo, cover, hazards, resources, mission objectives.
- Crew Quarters: comfort, morale, fatigue, complications.
- Med Bay: minor healing or medic boosts.
- Ritual Hall: rituals and spiritual/occult actions.
- Missile Bay: missile preparation and salvo size.
- Reactor: power source and dangerous escalation point.

## UI/Prototype Notes

- `/rules/ship-combat` is a text-first rules reference.
- `/spaceship` is a hidden visual board lab, not a persisted combat runtime.
- Prefer `LocationCard`, custom `AssetCard` Devices, `Token`, and full-size Effect card stacks when visualizing ship combat.
