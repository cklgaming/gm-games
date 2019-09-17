const React = require("react");
const ReactDOM = require("react-dom");
const alias = require("rollup-plugin-alias");
const babel = require("rollup-plugin-babel");
const blacklist = require("rollup-plugin-blacklist");
const commonjs = require("rollup-plugin-commonjs");
const globals = require("rollup-plugin-node-globals");
const json = require("rollup-plugin-json");
const builtins = require("rollup-plugin-node-builtins");
const resolve = require("rollup-plugin-node-resolve");
const replace = require("rollup-plugin-replace");
const terser = require("rollup-plugin-terser").terser;
const build = require("./buildFuncs");

const sport = build.getSport();

module.exports = (nodeEnv, blacklistOptions) => {
    const plugins = [
        alias({
            entries: [
                {
                    find: "league-schema",
                    replacement: `./../../../${sport}/ui/util/leagueSchema.js`,
                },
                // This is so Karma doesn't crash when using the big names file.
                {
                    find: "player-names",
                    replacement:
                        nodeEnv === "test"
                            ? "./util/namesTest.js"
                            : "./util/names.js",
                },
            ],
        }),
        replace({
            "process.env.NODE_ENV": JSON.stringify(nodeEnv),
            "process.env.SPORT": JSON.stringify(sport),
        }),
        babel({
            exclude: "node_modules/!(d3)**",
            runtimeHelpers: true,
        }),
        json({
            compact: true,
            namedExports: false,
        }),
        commonjs({
            namedExports: {
                react: Object.keys(React),
                "react-dom": Object.keys(ReactDOM),
            },
        }),
        resolve({
            preferBuiltins: true,
        }),
        globals(),
        builtins(),
    ];

    if (nodeEnv === "production") {
        plugins.push(
            terser({
                safari10: true,
            }),
        );
    }

    if (blacklistOptions) {
        plugins.splice(1, 0, blacklist(blacklistOptions));
    }

    return {
        plugins,
        onwarn(warning, rollupWarn) {
            // I don't like this, but there's too much damn baggage
            if (warning.code !== "CIRCULAR_DEPENDENCY") {
                rollupWarn(warning);
            }
        },
        watch: {
            chokidar: true,
        },
    };
};