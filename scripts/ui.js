import GUI from 'lil-gui';

export function createUI(world) {
  const gui = new GUI();

  const worldFolder = gui.addFolder('World');
  worldFolder.add(world.size, 'width', 8, 128, 1).name('Width');
  worldFolder.add(world.size, 'height', 8, 64, 1).name('Height');

  const terrain = gui.addFolder('Terrain');
  terrain.add(world.params, 'seed', 0, 10000).name('Seed');
  terrain.add(world.params.terrain, 'scale', 10, 100, 1).name('Scale');
  terrain.add(world.params.terrain, 'magnitude', 0, 1, 0.1).name('Magnitude');
  terrain.add(world.params.terrain, 'offset', 0, 1, 0.1).name('Offset');

  gui.onChange(() => {
    world.generate();
  });
}
