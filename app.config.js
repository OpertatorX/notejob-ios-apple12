// OPERATORX_FORCE_EAS_PROJECT_ID
const imported = require("./app.config.base.js");
const baseConfig =
  imported && imported.default
    ? imported.default
    : imported;
const PROJECT_ID = "a8ec463b-a530-41c9-af1f-c5499359f881";
module.exports = (ctx) => {
  const raw =
    typeof baseConfig === "function"
      ? baseConfig(ctx)
      : baseConfig;
  if (raw && raw.expo) {
    return {
      ...raw,
      expo: {
        ...raw.expo,
        extra: {
          ...(raw.expo.extra || {}),
          eas: {
            ...((raw.expo.extra && raw.expo.extra.eas) || {}),
            projectId: PROJECT_ID,
          },
        },
      },
    };
  }
  return {
    ...raw,
    extra: {
      ...((raw && raw.extra) || {}),
      eas: {
        ...((raw && raw.extra && raw.extra.eas) || {}),
        projectId: PROJECT_ID,
      },
    },
  };
};