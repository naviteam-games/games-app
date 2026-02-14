import { IGamePlugin } from "@/domain/game-engine/types";

class GameRegistry {
  private plugins: Map<string, IGamePlugin> = new Map();

  register(plugin: IGamePlugin) {
    this.plugins.set(plugin.slug, plugin);
  }

  getPlugin(slug: string): IGamePlugin | undefined {
    return this.plugins.get(slug);
  }

  getAllPlugins(): IGamePlugin[] {
    return Array.from(this.plugins.values());
  }

  getSlugs(): string[] {
    return Array.from(this.plugins.keys());
  }
}

export const gameRegistry = new GameRegistry();

// Register all games here
import { numberGuesserPlugin } from "./number-guesser/plugin";
import { threeCrumbsPlugin } from "./three-crumbs/plugin";
gameRegistry.register(numberGuesserPlugin);
gameRegistry.register(threeCrumbsPlugin);
