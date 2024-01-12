import { App, LocalAppContext, WebAppContext } from "redgeometry/src/ecs/app";
import { ECS_TEST_MAIN_WORLD, ECS_TEST_REMOTE_WORLD } from "./parts/ecs-test.js";
import { WEBGPU_TEST_MAIN_WORLD, WEBGPU_TEST_REMOTE_WORLD } from "./parts/webgpu-test.js";

const webAppContext = new WebAppContext("index.js");
const localAppContext = new LocalAppContext();

const app = new App(webAppContext);
app.addWorldGroup({
    id: "main",
    parent: undefined,
    worlds: [ECS_TEST_MAIN_WORLD, WEBGPU_TEST_MAIN_WORLD],
});
app.addWorldGroup({
    id: "remote",
    parent: "main",
    worlds: [ECS_TEST_REMOTE_WORLD, WEBGPU_TEST_REMOTE_WORLD],
});

app.run(ECS_TEST_MAIN_WORLD.id, "start");
