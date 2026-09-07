export const SHAPE_CONFIG = {
  loadComponent: () =>
    import('./shape.component').then((mod) => mod.ShapeComponent),
};
