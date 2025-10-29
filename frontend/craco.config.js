module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        function ignoreSourceMapsLoaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes('@mediapipe') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ],
    },
  },
};
