const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix
.js('resources/js/admin-app.js', 'public/js').react()
.js('resources/js/employee-app.js', 'public/js').react()
.styles([
    'resources/css/content.css',
    'resources/css/components.css',
    'resources/css/layouts.css',
    'resources/css/utilities.css',
    'resources/css/custom.css',
    'resources/css/media-queries.css'
], 'public/css/app.css').disableSuccessNotifications();
