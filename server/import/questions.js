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
      { name : "Import a visual layer", value : 'visual' },
      new inquirer.Separator(),
      { name : "Push development database to live", value : 'push' },
      { name : "Reset development database from live", value : 'pull' }
    ]
  },
  {
    type : 'list',
    name : 'geom',
    message : 'Select feature type:',
    choices : function( ans ){
      if( ans.task == 'visual' ) {
        return [
          { name : 'viewsheds', value : 'viewsheds' },
          { name : 'maps', value : 'maps' },
          { name : 'plans', value : 'plans' }
        ]
      }
      else{
        return [
          { name : 'point', value : 'basepoint' },
          { name : 'line', value : 'baseline' },
          { name : 'polygon', value : 'basepoly' }
        ]
      }
    },
    when : function( ans ){ 
      return ans.task != 'push' && ans.task != 'pull';
    }
  },
  {
    type : 'input',
    name : 'layer',
    message : 'Enter layer name:',
    when : function( ans ){ 
      return ans.task != 'push' && ans.task != 'pull' && ans.task != 'visual';
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
      return ans.task == 'replace' || ans.task == 'new' || ans.task == 'visual';
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
        case 'visual':
          var str = 'Replace the visual layer ' + chalk.red.underline( ans.geom ) + ' from the file ' + chalk.red.underline( ans.file ) + '?'
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
