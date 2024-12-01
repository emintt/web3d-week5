// import basicSsl from "@vitejs/plugin-basic-ssl";

export default {
  base: "./",
  // plugins: [
  //   staticCopy({
  //       targets: [
  //           {
  //               src: '3d-assets/hdr/*.hdr',
  //               dest: '3d-assets/hdr'
  //           }
  //       ]
  //   })
  // ],
  root: "three-dev",
  publicDir: "../3d-assets",
  build: {
    outDir: "../dist"
  },
  // plugins: [basicSsl()],
 };