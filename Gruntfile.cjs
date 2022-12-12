// SPDX-FileCopyrightText: 2022 sirinsidiator <insidiator@cmos.at>
//
// SPDX-License-Identifier: GPL-3.0-or-later

module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            js: ['src/*', '!src/.gitkeep']
        },
        copy: {
            debug: {
                files: [
                    {
                        expand: true,
                        cwd: 'src-perfetto/target',
                        src: ['**/*', '!**/rec*.png', '!**/catapult*'],
                        filter: 'isFile',
                        dest: "src/",
                    }, {
                        expand: true,
                        cwd: 'src-perfetto/resources',
                        src: ['**/*'],
                        filter: 'isFile',
                        dest: "src/",
                    }
                ]
            },
            release: {
                files: [
                    {
                        expand: true,
                        cwd: 'src-perfetto/target',
                        src: ['**/*', '!**/*.map', '!**/rec*.png', '!**/catapult*'],
                        filter: 'isFile',
                        dest: "src/",
                    }, {
                        expand: true,
                        cwd: 'src-perfetto/resources',
                        src: ['**/*'],
                        filter: 'isFile',
                        dest: "src/",
                    }
                ]
            },
        },
        replace: {
            main: {
                src: ['src/**/frontend_bundle.js'],
                overwrite: true,
                replacements: [{
                    // we are never a Googler, so no need for it to phone home
                    from: 'https://storage.cloud.google.com/perfetto-ui-internal/is_internal_user.js',
                    to: ''
                }]
            }
        },
        uglify: {
            main: {
                files: {
                    'src/v31.0-b8da07095/frontend_bundle.js': ['src/v31.0-b8da07095/frontend_bundle.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.registerTask('default', ['clean', 'copy:debug', 'replace']);
    grunt.registerTask('release', ['clean', 'copy:release', 'replace', 'uglify']);
};