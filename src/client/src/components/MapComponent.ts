import { Component } from 'super-ecs';
import COMPONENT_NAMES from './types';
import MapMetadata from '../types/mapMetadata';

import { TILE_SIZE } from '../global';

import { PositionMetadata, OptionalPositionMetadata } from '../types/positionMetadata';

type MapComponentMetadata = {
  collision: MapMetadata,
}

class MapComponent implements Component {
  name = COMPONENT_NAMES.Map;

  public collision: MapMetadata;

  constructor({ collision }: MapComponentMetadata) {
    this.collision = collision;
  }

  getWidth(): number {
    return this.collision[0].length;
  }

  getHeight(): number {
    return this.collision.length;
  }

  getCollision({ x, y }: PositionMetadata): number {
    // TODO: Mettre pas d'objet pour les arguments
    const collPosition = MapComponent.getTilePosition({ x, y });

    const { x: collX, y: collY } = collPosition;

    if (
      collX < 0
      || collY < 0
      || collX > this.getWidth() - 1
      || collY > this.getHeight() - 1
    ) {
      return 0;
    }

    return this.collision[collPosition.y][collPosition.x];
  }

  static getTilePosition({
    x = 0,
    y = 0,
  }: OptionalPositionMetadata): PositionMetadata {
    return {
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE),
    };
  }

  // TODO: Plutot faire une pethode séparée pour X ou Y
  static getTilePositionInWorld({
    x = 0,
    y = 0,
  }: OptionalPositionMetadata): PositionMetadata {
    const result: PositionMetadata = MapComponent.getTilePosition({ x, y });

    if (result.x != null) {
      result.x *= TILE_SIZE;
    }

    if (result.y != null) {
      result.y *= TILE_SIZE;
    }

    return result;
  }
}

export default MapComponent;
