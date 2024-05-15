import { config } from "dotenv";
config()

function checkEnv(name) {
  let env = process.env;
  if (env[name]) {
    return env[name];
  }
  console.error(`Error! ${name} not found. Exiting now.`);
  process.exit(9);
}

const env = {
  r2Key: checkEnv('R2_KEY'),
  r2Id: checkEnv('R2_ID'),
  r2endPoint: checkEnv('R2_ENDPOINT'),
  origins: checkEnv('ORIGINS'),
};

export { env };