module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> v<%= pkg.version %>*/\n'
      },
      dist: {
        src: 'src/jquery.ajaxqueue.js',
        dest: 'build/<%= pkg.name %>.<%= pkg.version %>.min.js'
      }
    },

    jshint: {
      all: [
        'src/**/*.js',
      ],
      options: {
        jshintrc: '.jshintrc',
      }
    },

    mocha: {
      browser: ['test/**/*.html'],
      options: {
        reporter: 'Nyan',
        log: true,
        run: true,
        timeout: 5000,
        mocha: {
          ignoreLeaks: false
        }
      }
    },

    clean: ['reports/*'],

    plato: {
      default: {
        options: {
          jshint : grunt.file.readJSON('.jshintrc')
        },
        files: {
          'reports/plato': ['src/**/*.js']
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-plato');

  grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('test', ['mocha']);
  grunt.registerTask('analyze', ['plato']);
  grunt.registerTask('dist', ['analyze', 'uglify:dist']);
};
