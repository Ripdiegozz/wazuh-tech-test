import { IRouter, Logger, CoreSetup } from "src/core/server";
import { registerTodoRoutes } from "./todos.routes";

export function defineRoutes(
  router: IRouter, 
  core: CoreSetup,
  logger: Logger
) {
  try {
    // Register TODO routes
    registerTodoRoutes(router, core, logger);

    logger.info("Routes registered successfully");
  } catch (error) {
    logger.error("Error registering routes", error);
    throw error;
  }
}
