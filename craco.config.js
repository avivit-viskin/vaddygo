/*
  craco.config.js — הרחבת ה-webpack של Create React App בלי eject.

  מטרה יחידה: לאפשר פענוח קבצי Excel נעולים בסיסמה בצד הלקוח (officecrypto-tool),
  שמסתמך על מודולי Node (crypto/stream/buffer). ב-webpack 5 אין להם polyfill
  אוטומטי, ולכן מספקים אותם כאן. שאר ההגדרות של CRA נשארות כמו שהן.

  הערה: הבדיקות (jest) עדיין רצות דרך react-scripts test — הן רצות ב-Node שבו
  המודולים האלה קיימים במקורי, אז אין להן צורך ב-craco.
*/
const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        vm: require.resolve("vm-browserify"),
        timers: require.resolve("timers-browserify"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser"),
      };
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser.js",
        })
      );
      // webpack 5 דורש סיומת מפורשת ("fully specified") — משביתים זאת עבור מודולי
      // ה-polyfill כדי ש-require('process/browser') וכד' ייפתרו כרגיל.
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      });
      return webpackConfig;
    },
  },
};
