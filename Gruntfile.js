'use strict'

const timeGrunt = require('time-grunt')
const ngrok = require('ngrok')
const mozjpeg = require('imagemin-mozjpeg')

module.exports = function (grunt) {
  timeGrunt(grunt)

  grunt.initConfig({
    clean: {
      all: 'dist',
      html: [ 'dist/index.html', 'dist/**/*.html' ],
      css: [ 'dist/**/css' ],
      js: [ 'dist/**/js' ],
      images: [ 'dist/**/images' ]
    },

    copy: {
      everything: {
        files: [
          { src: 'index.html', dest: 'dist', expand: true },
          { cwd: 'src', src: '**', dest: 'dist', expand: true }
        ]
      },
      html: {
        files: [
          { src: 'index.html', dest: 'dist', expand: true },
          { cwd: 'src', src: '**/*.html', dest: 'dist', expand: true }
        ]
      },
      css: {
        files: [
          { cwd: 'src', src: '**/css/**', dest: 'dist', expand: true }
        ]
      },
      js: {
        files: [
          { cwd: 'src', src: '**/js/**', dest: 'dist', expand: true }
        ]
      },
      images: {
        files: [
          { cwd: 'src', src: '**/images/**', dest: 'dist', expand: true }
        ]
      }
    },

    concat: {
      options: {
        removeComments: true,
        stripBanners: {
          block: true,
          line: true
        }
      },
      css: {
        files: {
          'dist/index/css/main.css': ['dist/index/css/main/*.css'],
          'dist/index/css/print.css': ['dist/index/css/print/*.css'],
          'dist/pizza/css/main.css': ['dist/pizza/css/main/*.css'],
        }
      },
      js: {
        files: {
          'dist/pizza/js/bundle.js': ['dist/pizza/js/bundle/*.js'],
          'dist/index/js/vendor.js': ['dist/index/js/vendor/*.js']
        }
      }
    },

    cssmin: {
      options: {
        report: 'gzip'
      },
      allComponents: {
        files: [
          { cwd: 'dist', src: '**/css/*.css', dest: 'dist', ext: '.min.css', expand: true }
        ]
      }
    },

    uglify: {
      options: {
        preserveComments: false,
        sourceMap: true
      },
      target: {
        files: [
          { cwd: 'dist', src: '**/vendor.js', dest: 'dist', expand: true },
          { cwd: 'dist', src: '**/bundle.js', dest: 'dist', expand: true }
        ]
      }
    },

    imagemin: {
      all: {
        options: {
          use: [
            mozjpeg({ quality: 60 })
          ]
        },
        files: [
          { cwd: 'dist/', src: '**/images/*.{png,jpg}', dest: 'dist', expand: true }
        ]
      }
    },

    'imagemagick-resize': {
      pizzeria: {
        from: 'dist/pizza/images/',
        to: 'dist/pizza/images/',
        files: 'pizzeria.jpg',
        props: {
          width: 360,
          height: 270
        }
      },
      pizzeriaPreview: {
        from: 'dist/pizza/images/',
        to: 'dist/pizza/images/',
        files: 'pizzeria-preview.jpg',
        props: {
          width: 100
        }
      }
    },

    'string-replace': {
      rootIndexHTMLRelativeResourceLocation: {
        files: {
          'dist/index.html': 'dist/index.html'
        },
        options: {
          replacements: [
            {
              pattern: /<img .*?\s?src="src\/(.*)/igm,
              replacement: (matched) => matched.replace('src="src/', 'src="')
            }, {
              pattern: /<a .*?\s?href="src\/(.*)/igm,
              replacement: (matched) => matched.replace('href="src/', 'href="')
            }
          ]
        }
      }
    },

    usemin: {
      html: [
        'dist/index.html',
        'dist/**/*.html'
      ],
      options: {
        dest: 'dist'
      }
    },

    critical: {
      options: {
        base: './',
        minify: true
      },
      index: {
        css: [ 'dist/index/css/main.min.css' ],
        src: [ 'dist/index.html', 'dist/index/*.html' ],
        dest: '' // which indicates to override origin files
      },
      pizza: {
        css: [ 'dist/pizza/css/main.min.css' ],
        src: 'dist/pizza/*.html',
        dest: ''
      }
    },

    htmlmin: {
      target: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          minifyJS: true
        },
        files: [
          { cwd: 'dist', src: [ 'index.html', '**/*.html' ], dest: 'dist', expand: true }
        ]
      }
    },

    pagespeed: {
      options: {
        nokey: true,
        locale: 'en_GB',
        threshold: 90
      },
      local: {
        options: {
          strategy: 'desktop'
        }
      },
      mobile: {
        options: {
          strategy: 'mobile'
        }
      }
    },

    watch: {
      html: {
        files: [ 'index.html', 'src/**/*.html' ],
        tasks: [ 'build:html' ]
      },
      css: {
        files: 'src/**/css/**/*.css',
        tasks: [ 'build:css' ]
      },
      js: {
        files: 'src/**/js/**/*.js',
        tasks: [ 'build:js' ]
      },
      images: {
        files: 'src/**/images/*.{jpg.png}',
        tasks: [ 'build:images' ]
      }
    }
  })

  function psiNgrok() {
    const done = this.async()
    const port = 45096

    ngrok.connect(port, (err, url) => {
      if (err !== null) {
        grunt.fail.fatal(err)
        return done()
      }

      grunt.config.set('pagespeed.options.url', url)
      grunt.task.run('pagespeed')
      done()
    })
  }

  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-critical');
  grunt.loadNpmTasks('grunt-imagemagick');

  grunt.registerTask('default', [ 'build' ])
  grunt.registerTask('build:html', [ 'clean:html', 'copy:html', 'string-replace', 'usemin', 'critical', 'htmlmin' ])
  grunt.registerTask('build:css', [ 'clean:css', 'copy:css', 'concat:css', 'cssmin' ])
  grunt.registerTask('build:js', [ 'clean:js', 'copy:js', 'concat:js', 'uglify' ])
  grunt.registerTask('build:images', [ 'clean:images', 'copy:images', 'imagemin', 'imagemagick-resize' ])
  grunt.registerTask('build', [ 'build:html', 'build:css', 'build:js', 'build:images' ])
  grunt.registerTask('build:watch', [ 'build', 'watch' ])

  grunt.registerTask('psi-ngrok', '', psiNgrok)
  grunt.registerTask('psi', [ 'build', 'psi-ngrok' ])
}