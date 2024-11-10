import * as PIXI from "pixi.js";

import { Game } from "../game/Game";
import config from "../config/config";

const app = new PIXI.Application({
    width: config.gameWidth,
    height: config.gameHeight,
    backgroundColor: config.gameFont,
});
document.body.appendChild(app.view);

const loader = PIXI.Loader.shared;

loader
    .add("assets/arrow.png")
    .add("assets/btnStart.png")
    .add("assets/wheel.png")
    .load((loader, resources) => {
        const game = new Game(app, resources, config);
        game.setup();
    });