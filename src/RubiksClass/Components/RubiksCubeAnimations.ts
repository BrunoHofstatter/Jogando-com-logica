export interface CubeRotation {
  x: number;
  y: number;
}

export const CUBE_FACE_ROTATIONS: CubeRotation[] = [
  { x: -20, y: -25 }, // front
  { x: -20, y: 155 }, // back
  { x: -20, y: -115 }, // right
  { x: -20, y: 65 }, // left
  { x: -105, y: -25 }, // top
  { x: 65, y: -25 }, // bottom
];
