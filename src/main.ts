import './style.css';
import { App } from "./app";

const app = new App();

function mainloop(){
  app.update();

  requestAnimationFrame(mainloop);
}

// starting the mainloop right away
mainloop();