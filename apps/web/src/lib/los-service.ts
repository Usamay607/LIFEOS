import { LosService, loadLosEnv } from "@los/notion";

const env = loadLosEnv();

export const losService = new LosService(env);
