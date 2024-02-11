"use strict";
// entity component system framework

class World {
	constructor() {
		this.entities = [];
		this.systems = [];
	}
	addEntity(entity) {
		this.entities.push(entity);
	}
	removeEntity(entity) {
		this.entities = this.entities.filter(e => e !== entity);
	}
	addSystem(system) {
		this.systems.push(system);
	}
	update(timestamp) {
		for (let system of this.systems) {
			system.update(this.entities, timestamp);
		}
	}
}

class Entity {
	constructor() {
		this.components = [];
	}
	addComponent(component) {
		this.components.push(component);
	}
	getComponent(type) {
		return this.components.find(component => component instanceof type);
	}
}

class PokemonEntity extends Entity {
	constructor() {
		super();
		this.addComponent(new PositionComponent());
		this.addComponent(new RectangleComponent(64, 64));
		this.addComponent(new VelocityComponent());
		this.addComponent(new RenderableComponent());
		this.addComponent(new SpriteSheetSpriteComponent())
		this.addComponent(new SelectableComponent());
		this.addComponent(new DeleteableComponent());
		this.addComponent(new RepositionableComponent());
	}
}

class Component {}

class PositionComponent extends Component {
	constructor(x, y) {
		super();
		this.x = x;
		this.y = y;
	}
}

class RectangleComponent extends Component {
	constructor(width, height) {
		super();
		this.width = width;
		this.height = height;
	}
}

class VelocityComponent extends Component {
	constructor(x, y) {
		super();
		this.x = x;
		this.y = y;
	}
}

class RenderableComponent extends Component {
	constructor() {
		super();
	}
}

class SelectableComponent extends Component {
	constructor() {
		super();
		this.selected = false;
	}
}

class DeleteableComponent extends Component {
	constructor() {
		super();
		this.deleted = false;
	}
}

class RepositionableComponent extends Component {
	constructor() {
		super();
	}
}

class SpriteSheetSpriteComponent extends Component {
	constructor(image, x, y, width, height) {
		super();
		this.image = image;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}

class System {
	update(entities) {
		throw new Error("Abstract 'method' update not implemented for System subclass:" + this.constructor.name);
	}
}

class RenderSystem extends System {
	constructor() {
		super();
	}

	update(entities) {
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			// dark mode
			canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height);
		} else {
			// light mode
			canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
		}
		for (let entity of entities) {
			const renderable = entity.getComponent(RenderableComponent);
			if (!renderable) {
				continue;
			}
			const position = entity.getComponent(PositionComponent);
			const rectangle = entity.getComponent(RectangleComponent);
			const spriteSheetSprite = entity.getComponent(SpriteSheetSpriteComponent);
			if (spriteSheetSprite && position && rectangle) {
				canvas.getContext('2d').drawImage(
					spriteSheetSprite.image,
					spriteSheetSprite.x,
					spriteSheetSprite.y,
					spriteSheetSprite.width,
					spriteSheetSprite.height,
					position.x, position.y,
					rectangle.width,
					rectangle.height
				);
			} else if (position && rectangle) {
				canvas.getContext('2d').fillRect(position.x, position.y, rectangle.width, rectangle.height);
			}
			const selectable = entity.getComponent(SelectableComponent);
			const deleteable = entity.getComponent(DeleteableComponent);
			if ((selectable && selectable.selected) || (deleteable && deleteable.deleted)) {
				spriteSheetSprite.image.style.opacity = '1';
				spriteSheetSprite.image.style.background = 'white';
			}
		}
	}
}

class VelocitySystem extends System {
	constructor() {
		super();
	}

	update(entities) {
		for (let entity of entities) {
			const velocity = entity.getComponent(VelocityComponent);
			const position = entity.getComponent(PositionComponent);
			if (velocity && position) {
				position.x += velocity.x;
				position.y += velocity.y;
			}
		}
	}
}

class BounceSystem extends System {
	constructor() {
		super();
	}

	update(entities) {
		for (let entity of entities) {
			const velocity = entity.getComponent(VelocityComponent);
			const position = entity.getComponent(PositionComponent);
			const rectangle = entity.getComponent(RectangleComponent);
			if (position && rectangle) {
				if (position.x < 0 || position.x + rectangle.width > canvas.width) {
					velocity.x *= -1;
				}
				if (position.y < 0 || position.y + rectangle.height > canvas.height) {
					velocity.y *= -1;
				}
			}
		}
	}
}

class SelectedSystem extends System {
	constructor() {
		super();
	}

	update(entities) {
		for (let entity of entities) {
			const selectable = entity.getComponent(SelectableComponent);
			const deleteable = entity.getComponent(DeleteableComponent);
			if (selectable && selectable.selected && deleteable) {
				console.log('clicked');
				selectable.selected = false;
				deleteable.deleted = true;
			}
		}
	}
}

class DeleteSystem extends System {
	constructor(world) {
		super();
		this.world = world;
	}

	update(entities) {
		for (let entity of entities) {
			const deleteable = entity.getComponent(DeleteableComponent);
			if (deleteable && deleteable.deleted) {
				this.world.removeEntity(entity);
			}
		}
	}
}

class RepositionSystem extends System {
	constructor() {
		super();
	}

	update(entities) {
		for (let entity of entities) {
			const repositionable = entity.getComponent(RepositionableComponent);
			const position = entity.getComponent(PositionComponent);
			const rectangle = entity.getComponent(RectangleComponent);
			// if the entity is out of bounds of the canavs, reposition it
			if (!repositionable || !position || !rectangle) {
				continue;
			}
			if (
				// position.x < -rectangle.width || // you actually don't need to check for the left side of the canvas
				position.x + rectangle.width - 4 > window.innerWidth ||
				// position.y < -rectangle.height || // you actually don't need to check for the top side of the canvas
				position.y + rectangle.height - 4 > window.innerHeight
			) {
				position.x = Math.random() * (canvas.width - 64);
				position.y = Math.random() * (canvas.height - 64);
			}
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('canvas');
	canvas.fillStyle = 'black';

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	canvas.style.border = '1px solid black';
	const world = new World();

	world.addSystem(new VelocitySystem());
	world.addSystem(new BounceSystem());
	world.addSystem(new SelectedSystem());
	world.addSystem(new DeleteSystem(world));
	world.addSystem(new RepositionSystem());
	const renderSystem = new RenderSystem();
	// world.addSystem(new RenderSystem()); // we will treat the render system differently in that it should be called in the loop and not in the update method
	canvas.addEventListener('click', function(event) {
		const x = event.clientX;
		const y = event.clientY;
		for (let entity of world.entities) {
			const position = entity.getComponent(PositionComponent);
			const rectangle = entity.getComponent(RectangleComponent);
			if (position && rectangle) {
				if (x > position.x && x < position.x + rectangle.width && y > position.y && y < position.y + rectangle.height) {
					const selectable = entity.getComponent(SelectableComponent);
					if (selectable && !selectable.selected) {
						selectable.selected = true;
					}
				}
			}
		}
	});

	window.addEventListener('resize', function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	});

	function addPokemon(no, world) {
		const row = no % 16;
		const col = Math.floor(no / 16);
		const img = document.getElementById('spritesheet');
		const pokemon = new PokemonEntity();
		const position = pokemon.getComponent(PositionComponent);
		const rectangle = pokemon.getComponent(RectangleComponent);
		const spriteSheetSprite = pokemon.getComponent(SpriteSheetSpriteComponent);
		spriteSheetSprite.image = img;
		spriteSheetSprite.x = row * 64;
		spriteSheetSprite.y = col * 64;
		spriteSheetSprite.width = 64;
		spriteSheetSprite.height = 64;

		position.x = Math.random() * (canvas.width - rectangle.width);
		position.y = Math.random() * (canvas.height - rectangle.height);
		const velocity = pokemon.getComponent(VelocityComponent);
		const rate = Math.random() * 1.5 + 0.5;

		velocity.x = Math.random() > 0.5 ? rate : -rate;
		velocity.y = Math.random() > 0.5 ? rate : -rate;
		world.addEntity(pokemon);
	}
	let i = 0;
	let delay = 800;
	function addPokemonLoop() {
		addPokemon(i, world);
		i++;
		if (delay > 200) {
			delay *= 0.90;
		}

		if (i < 151) {
			setTimeout(addPokemonLoop, delay);
		}
	}
	addPokemonLoop();

	let lastRender = 0;
	let acculumatedTime = 0;
	let won = false;
	let id;
	function loop(timestamp) {
		if (won) {
			cancelAnimationFrame(id);
			return;
		}
		const delta = timestamp - lastRender;
		lastRender = timestamp;
		acculumatedTime += delta;
		while (acculumatedTime >= 1000 / 60) {
			world.update(timestamp);
			acculumatedTime -= 1000 / 60;
		}
		renderSystem.update(world.entities); // render system should be called in the loop
		id = requestAnimationFrame(loop);
	}
	loop(0);
});

