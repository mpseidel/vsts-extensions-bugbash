module.exports = function (grunt) {
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
            all: ["dist", "typings", "node_modules", "temp", "*.vsix"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-typings");

    grunt.registerTask("install", ["typings:install"]);
    grunt.registerTask("copy_files", ["copy:root", "copy:img", "copy:libs"]);

    grunt.registerTask("build", ["clean:build", "copy_files", "cssmin:target", "ts:build", "uglify:scripts", "clean:temp"]);
    grunt.registerTask("build_dev", ["clean:build", "copy_files", "cssmin:target", "ts:build", "copy:js", "clean:temp"]);

    grunt.registerTask("package", ["build", "exec:package"]);
    grunt.registerTask("package_dev", ["build_dev", "exec:package"]);

    grunt.registerTask("publish", ["package", "exec:publish"]);

    grunt.registerTask("cc", ["clean:all"]);
};