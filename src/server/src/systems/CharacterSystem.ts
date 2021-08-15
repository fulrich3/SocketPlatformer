import { ExtendedSystem } from './ExtendedSystem';

import COMPONENT_NAMES from '../components/types';

import CharacterComponent from '../components/CharacterComponent';
import CollisionComponent from '../components/CollisionComponent';
import VelocityComponent from '../components/VelocityComponent';
import GravityComponent from '../components/GravityComponent';
import MapComponent from '../components/MapComponent';
import PositionComponent from '../components/PositionComponent';
import PlayerComponent from '../components/PlayerComponent';
import StairsComponent from '../components/StairsComponent';

import { STAIR_TYPE } from '../global';

class CharacterSystem extends ExtendedSystem {
  update(delta: number): void {
    // Get entities under this system
    const entities = this.world.getEntities([COMPONENT_NAMES.Character]);

    // Exit if no entities found
    if (entities.length === 0) {
      return;
    }

    // Get map entity
    const [mapEntity] = this.world.getEntities([COMPONENT_NAMES.Map]);

    if (!mapEntity) {
      return;
    }

    // Get map component
    const mapComponent = mapEntity.getComponent<MapComponent>(
      COMPONENT_NAMES.Map,
    );

    if (!mapComponent) {
      return;
    }

    // Loop through all entities
    entities.forEach((entity) => {
      const characterComponent = entity.getComponent<CharacterComponent>(
        COMPONENT_NAMES.Character,
      );

      const collisionComponent = entity.getComponent<CollisionComponent>(
        COMPONENT_NAMES.Collision,
      );

      const velocityComponent = entity.getComponent<VelocityComponent>(
        COMPONENT_NAMES.Velocity,
      );

      const positionComponent = entity.getComponent<PositionComponent>(
        COMPONENT_NAMES.Position,
      );

      const playerComponent = entity.getComponent<PlayerComponent>(
        COMPONENT_NAMES.Player,
      );

      const stairsComponent = entity.getComponent<StairsComponent>(
        COMPONENT_NAMES.Stairs,
      );

      if (stairsComponent) {
        return;
      }

      let walkDir = 0;

      // Get char position
      if (characterComponent) {
        const { maxXSpeed, onFloor, speedIncr } = characterComponent;
        // User input
        if (playerComponent) {
          characterComponent.input = playerComponent.input;
          characterComponent.inputPressed = playerComponent.inputPressed;
        }

        // Character input
        // Player movement
        if (velocityComponent && positionComponent && collisionComponent) {
          const { x } = positionComponent;
          const { bottom } = collisionComponent.getCollisionBox(
            positionComponent.x,
            positionComponent.y,
          );

          // Check for stair
          if (mapComponent) {
            if (characterComponent.input.up) {
              if (onFloor) {
                const nearestStairX = mapComponent.getNearestStairX(x, bottom - 1);

                if (nearestStairX) {
                  if (nearestStairX === x) {
                    // Go to stairs mode if nearest stair's X is equal to the player's
                  } else if (Math.abs(nearestStairX - x) <= maxXSpeed * delta) {
                    positionComponent.x = nearestStairX;

                    // Get stair value
                    const stairVal = mapComponent.getStairVal(x, bottom - 1);

                    // Add stairs component
                    const newStairsComponent = new StairsComponent();
                    newStairsComponent.stairType = stairVal === 2
                      ? STAIR_TYPE.Asc
                      : STAIR_TYPE.Desc;

                    entity.addComponent(newStairsComponent);
                    entity.removeComponent(COMPONENT_NAMES.Position);

                    return;
                  } else if (x < nearestStairX) {
                    walkDir = 1;
                  } else {
                    walkDir = -1;
                  }
                }
              }
            }
          }

          // Stops if pressing left and right / not pressing any of the two buttons
          // Set direction
          if (
            (characterComponent.dirChangeMidAir
          || velocityComponent.xSpeed === 0)
        && !(characterComponent.input.right && characterComponent.input.left)
          ) {
            // Moving right
            if (characterComponent.input.right) {
              characterComponent.direction = 1;
            }
            // Moving left
            if (characterComponent.input.left) {
              characterComponent.direction = -1;
            }
          }

          // Jump
          if (characterComponent.input.jump && onFloor) {
            velocityComponent.ySpeed = -characterComponent.jumpForce;

            // Add gravity component
            entity.addComponent(new GravityComponent());
            characterComponent.onFloor = false;
          }

          if (onFloor) {
            if (
              (!characterComponent.input.right && !characterComponent.input.left)
          || (characterComponent.input.right && characterComponent.input.left)
            ) {
              if (velocityComponent.xSpeed > 0) {
                velocityComponent.xSpeed -= speedIncr;
              }

              if (velocityComponent.xSpeed < 0) {
                velocityComponent.xSpeed += speedIncr;
              }

              if (Math.abs(velocityComponent.xSpeed) < speedIncr) {
                velocityComponent.xSpeed = 0;
              }
            } else {
              // Moving right
              if (characterComponent.input.right) {
                // velocityComponent.xSpeed += speedIncr;
                walkDir = 1;
              }
              // Moving left
              if (characterComponent.input.left) {
                // velocityComponent.xSpeed -= speedIncr;
                walkDir = -1;
              }
            }
          } else if (
            characterComponent.input.right
        || characterComponent.input.left
          ) {
            velocityComponent.xSpeed += speedIncr * characterComponent.direction;
          }

          velocityComponent.xSpeed += walkDir * speedIncr;
        }
      }

      if (characterComponent) {
        if (velocityComponent) {
          const { xSpeed } = velocityComponent;
          const { maxXSpeed } = characterComponent;

          // Limit xSpeed
          if (Math.abs(xSpeed) > maxXSpeed) {
            velocityComponent.xSpeed = maxXSpeed * Math.sign(xSpeed);
          }
        }

        // Fall if no floor under entity
        if (
          mapComponent
      && velocityComponent
      && collisionComponent
      && positionComponent
        ) {
          const { bottom, left } = collisionComponent.getCollisionBox(
            positionComponent.x,
            positionComponent.y,
          );

          const { width } = collisionComponent;

          const { ySpeed } = velocityComponent;

          const xStart: number = left;
          const yStart: number = bottom;
          const length: number = width;
          const horizontal: boolean = true;

          const floorColl = ySpeed >= 0
        && mapComponent.getMapCollisionLine(xStart, yStart, length, horizontal);

          const gravityComponent = entity.getComponent<GravityComponent>(
            COMPONENT_NAMES.Gravity,
          );

          // If not on floor, make the entity fall
          if (!floorColl && !gravityComponent) {
            entity.addComponent(new GravityComponent());
            characterComponent.onFloor = false;
          }
        }
      }
    });
  }
}

export default CharacterSystem;
