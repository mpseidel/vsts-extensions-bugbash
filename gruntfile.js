﻿module.exports = function (grunt) {
    grunt.initConfig({
        copy: {            
            root: {
                files: [
                    {
                        expand: true,
                        flatten: true, 
                        src: ["vss-extension.json", "README.md", "index.html"], 
                        dest: "dist/",
                        filter: "isFile" 
                    }
                ]
            },
            img: {
                files: [
                    {
                        expand: true,
                        flatten: true, 
                        src: "img/*",
                        dest: "dist/img",
                        filter: "isFile" 
                    }
                ]
            },
            js: {
                files: [
                    {
                        expand: true,
                        flatten: false,
                        cwd: 'temp/scripts',
                        src: '**/*.js',
                        dest: "dist/scripts",
                        filter: "isFile" 
                    }
                ]
            },
            libs: {
                files: [
                    {
                        expand: true, 
                        flatten: true, 
                        src: [
                            "node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", 
                            "node_modules/es6-promise/dist/promise-0.1.2.min.js"
                        ], 
                        dest: "dist/scripts/lib",
                        filter: "isFile" 
                    },
                    {
                        expand: true, 
                        flatten: true, 
                        src: [
                            "node_modules/office-ui-fabric-react/dist/css/fabric.min.css"
                        ], 
                        dest: "dist/css/lib",
                        filter: "isFile" 
                    }
                ]
            },
            OfficeFabric: {
                files: [
                    {
                        expand: true, 
                        src: [
                            "node_modules/office-ui-fabric-react/lib-amd/**/*"
                        ], 
                        dest: "scripts/OfficeFabric/",
                        filter: "isFile",
                        rename: function (dest, src) {
                            return dest + src.substring(44);
                        }
                    },
                    {
                        expand: true, 
                        src: [
                            "node_modules/@microsoft/load-themed-styles/lib-amd/**/*"
                        ], 
                        dest: "scripts/microsoft/",
                        filter: "isFile",
                        rename: function (dest, src) {
                            return dest + src.substring(51);
                        }
                    },
                    {
                        expand: true, 
                        src: [
                            "node_modules/@uifabric/utilities/lib-amd/**/*"
                        ], 
                        dest: "scripts/uifabric/",
                        filter: "isFile",
                        rename: function (dest, src) {
                            return dest + src.substring(23);
                        }
                    }
                ]
            },
            OfficeFabric_dist: {
                files: [
                    {
                        expand: true, 
                        src: [
                            "node_modules/office-ui-fabric-react/lib-amd/**/*"
                        ], 
                        dest: "dist/scripts/OfficeFabric/",
                        filter: "isFile",
                        rename: function (dest, src) {
                            return dest + src.substring(44);
                        }
                    },
                    {
                        expand: true, 
                        src: [
                            "node_modules/@microsoft/load-themed-styles/lib-amd/**/*"
                        ], 
                        dest: "dist/scripts/microsoft/",
                        filter: "isFile",
                        rename: function (dest, src) {
                            return dest + src.substring(51);
                        }
                    },
                    {
                        expand: true, 
                        src: [
                            "node_modules/@uifabric/utilities/lib-amd/**/*"
                        ], 
                        dest: "dist/scripts/uifabric/",
                        filter: "isFile",
                        rename: function (dest, src) {
                            return dest + src.substring(23);
                        }
                    }
                ]
            }
        },
        uglify: {
            scripts: {
                files: [{
                    expand: true,
                    cwd: 'temp/scripts',
                    src: '**/*.js',
                    dest: 'dist/scripts'
                }]
            }
        },
        sass: {
            dist: {
                options: {
                    style: "expanded"
                },
                files: {
                    "css/index.css": "css/index.scss"
                }
            }
        },
        cssmin: {
            target: {
                files: {
                    'dist/css/app.min.css': 'css/index.css'
                }
            }
        },
        typings: {
            install: {}
        },
        ts: {
            build: {
                tsconfig: true,
                outDir: "temp/scripts"
            },
            options: {
                fast: "never"
            }
        },
        exec: {
            package: {
                cwd: "dist/",
                command: "tfx extension create --manifest-globs vss-extension.json",
                stdout: true,
                stderr: true
            },
            publish: {
                cwd: "dist/",
                command: "tfx extension publish --service-url https://marketplace.visualstudio.com --manifest-globs vss-extension.json --rev-version",
                stdout: true,
                stderr: true
            }
        },
        clean: {
            build: ["dist", "temp", "*.vsix"],
            temp: ["temp"],
            all: ["dist", "typings", "node_modules", "temp", "*.vsix", "scripts/OfficeFabric", "scripts/@microsoft", "scripts/@uifabric", ".sass-cache"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-typings");

    grunt.registerTask("install", ["typings:install", "copy:OfficeFabric"]);
    grunt.registerTask("copy_files", ["copy:root", "copy:img", "copy:libs"]);

    grunt.registerTask("build", ["clean:build", "copy_files", "sass:dist", "cssmin:target", "ts:build", "uglify:scripts", "clean:temp", "copy:OfficeFabric_dist"]);
    grunt.registerTask("build_dev", ["clean:build", "copy_files", "sass:dist", "cssmin:target", "ts:build", "copy:js", "clean:temp", "copy:OfficeFabric_dist"]);

    grunt.registerTask("package", ["build", "exec:package"]);
    grunt.registerTask("package_dev", ["build_dev", "exec:package"]);

    grunt.registerTask("publish", ["package", "exec:publish"]);

    grunt.registerTask("cc", ["clean:all"]);
};