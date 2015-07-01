var inquirer = require( 'inquirer' ),
    chalk = require( 'chalk' );

exports.q = [
  {
    type : "list",
    name : "task",
    message : "What task would you like to perform?",
    choices : [
      { name : "Import a replacement layer", value : 'replace' },
      { name : "Import a new layer", value : 'new' },
      { name : "Delete a layer", value : 'delete' },
      new inquirer.Separator(),
      { name : "Push development database to live", value : 'push' },
      { name : "Reset development database from live", value : 'pull' }
    ]
  },
  {
    type : 'input',
    name : 'layer',
    message : 'Enter layer name:',
    when : function( ans ){ 
      return ans.task != 'push' && ans.task != 'pull';
    }
  },
  {
    type : 'list',
    name : 'geom',
    message : 'Select geometry type:',
    choices : [
      { name : 'point', value : 'basepoint' },
      { name : 'line', value : 'baseline' },
      { name : 'polygon', value : 'basepoly' }
    ],
    when : function( ans ){ 
      return ans.task != 'push' && ans.task != 'pull';
    }
  },
  {
    type : 'input',
    name : 'file',
    message : 'Enter shapefile name (without extension):',
    default : function( ans ){
      return ans.layer;
    },
    when : function( ans ){
      return ans.task == 'replace' || ans.task == 'new';
    }
  },
  {
    type : 'confirm',
    name : 'confirm',
    message : function( ans ) {
      switch( ans.task ) {
        case 'replace':
          var str = 'Replace the layer ' + chalk.red.underline( ans.layer ) + ' in ' + chalk.underline.red( ans.geom ) + ' with the file ' + chalk.red.underline( ans.file ) + '?';
          break;
        case 'new':
          var str = 'Create a new layer called ' + chalk.red.underline( ans.layer ) + ' in ' + chalk.underline.red( ans.geom ) + ' from the file ' + chalk.red.underline( ans.file ) + '?';
          break;
        case 'delete':
          var str = 'Delete the layer ' + chalk.red.underline( ans.layer ) + ' from ' + chalk.underline.red( ans.geom ) + '?';
          break;
        case 'push':
          var str = chalk.red.underline( 'Overwrite the live database' ) + ' with data from the development database?';
          break;
        case 'pull':
          var str = chalk.red.underline( 'Reset the development database' ) + ' with data from the live database?';
        default:
          break;
      }
      return str;
    }
  }
];
