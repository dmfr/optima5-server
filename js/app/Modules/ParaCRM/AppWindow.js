

Ext.define('Optima5.Modules.ParaCRM.AppWindow', {
    extend: 'Ext.ux.desktop.Module',

    requires: [
        'Ext.layout.container.Card' ,
        'Ext.form.field.HtmlEditor' ,
        'Optima5.Modules.ParaCRM.BiblePanel',
        'Optima5.Modules.ParaCRM.FilePanel',
        'Optima5.Modules.ParaCRM.QueryPanel',
        'Optima5.Modules.ParaCRM.MainToolbar'
        //'Ext.form.field.TextArea'
    ],

    id:'paracrm',

    init : function(){
        this.launcher = {
            text: 'ParaCRM',
            iconCls:'paracrm',
            handler : this.createWindow,
            scope: this
        }
    },

    createWindow : function(){
        var desktop = this.app.getDesktop();
        var win = desktop.getWindow('paracrm');
        if(!win){
			  
			//Ext.util.CSS.updateRule('.parapouet','background-image','url("../images/op5img/ico_dataadd_16.gif")') ;
			Ext.util.CSS.createStyleSheet(".parapouet {background-image: url(images/op5img/ico_dataadd_16.gif); \n } ", "GoodParts");
			  
			win = desktop.createWindow({
				id: 'paracrm',
				title:'ParaCRM',
				width:800,
				height:600,
				iconCls: 'parapouet',
				animCollapse:false,
				border: false,
				hideMode: 'offsets',
				layout: {
					type: 'card',
					align: 'stretch'
				},
				activeItem : 0,
				items: [{
					xtype:'panel',
					frame:true
				},{
					xtype: 'htmleditor',
					//xtype: 'textarea',
					mid: 'notepad-editor',
					value: [
						'Some <b>rich</b> <font color="red">text</font> goes <u>here</u><br>',
						'Give it a try!'
					].join('')
				},
					this.createBiblePanel()
				,
					this.createFilePanel()
				,
					this.createQueryPanel()
				],
				tbar : this.createMainToolbar()
			});
		}
		
		win.show();
		  
		this.maintoolbar.on('switchToBible',function(){
			if( arguments[0].forceReconfigure == true ) {
				this.biblepanel.reconfigure(arguments[0].bibleId) ;
			}
			else {
				if( this.biblepanel.bibleId != arguments[0].bibleId )
					this.biblepanel.reconfigure(arguments[0].bibleId) ;
				else
					this.biblepanel.reload() ;
			}
			this.switchToPanel('biblepanel') ;
		},this) ;
		
		this.maintoolbar.on('switchToFile',function(){
			if( arguments[0].forceReconfigure == true ) {
				this.filepanel.reconfigure(arguments[0].fileId) ;
			}
			else {
				if( this.filepanel.fileId != arguments[0].fileId )
					this.filepanel.reconfigure(arguments[0].fileId) ;
				else
					this.filepanel.reload() ;
			}
			this.switchToPanel('filepanel') ;
		},this) ;
		
		this.maintoolbar.on('switchToQuery',function( queryId, targetFileId ){
			this.switchToPanel('querypanel') ;
			if( queryId == 0 && typeof targetFileId !== 'undefined' ) {
				this.querypanel.queryNew( targetFileId ) ;
				return ;
			}
			else {
				this.querypanel.queryOpen( queryId ) ;
				return ;
			}
		},this) ;
		
		
		
		this.maintoolbar.on('switchToNotepad',function(){
			this.switchToPanel('notepad-editor') ;
		},this) ;
		
		this.maintoolbar.on('switchtopanelview',function(storetype,viewmode){
			switch( storetype ){
				case 'bible' :
					this.biblepanel.switchToPanel(viewmode) ;
					break ;
				case 'file' :
					this.filepanel.switchToPanel(viewmode) ;
					break ;
				default :
					break ;
			}
		},this) ;
		this.maintoolbar.on('exportexcel',function(storetype){
			switch( storetype ){
				case 'bible' :
					//this.biblepanel.exportExcel() ;
					break ;
				case 'file' :
					this.filepanel.exportExcel() ;
					break ;
				default :
					break ;
			}
		},this) ;
		this.maintoolbar.on('exportgallery',function(storetype){
			switch( storetype ){
				case 'bible' :
					//this.filepanel.exportGallery() ;
					break ;
				case 'file' :
					this.filepanel.exportGallery() ;
					break ;
				default :
					break ;
			}
		},this) ;
		this.maintoolbar.on('queryAction',function(action,str){
			switch( action ){
				case 'run' :
					this.querypanel.remoteAction('run') ;
					break ;
				case 'save' :
					this.querypanel.remoteAction('save') ;
					break ;
				case 'saveas' :
					this.querypanel.on('querysaved',function(success,queryId){
						if( success == true ) {
							this.maintoolbar.on('toolbarloaded',function(){
								this.maintoolbar.switchToQueryOpen( queryId ) ;
							},this,{
								single:true
							});
							this.maintoolbar.loadQueriesMenu() ;
						}
					},this,{
						single: true
					});
					
					this.querypanel.remoteAction('saveas',str) ;
					break ;
					
				case 'delete' :
					this.querypanel.on('querysaved',function(success,queryId){
						if( success == true ) {
							this.mainwindow.getLayout().setActiveItem(0) ;
							this.maintoolbar.loadQueriesMenu() ;
							this.maintoolbar.showHelper(null) ;
						}
					},this,{
						single: true
					});
					this.querypanel.remoteAction('delete') ;
					break ;
					
				default :
					break ;
			}
		},this) ;
		
		
		this.maintoolbar.on('testcss',function(){
			console.log( Ext.util.CSS.getRule('.parapouet') ) ;
		},this) ;
		
		return this.mainwindow = win;
	},
			  
	createBiblePanel : function(){
		this.biblepanel = Ext.create('Optima5.Modules.ParaCRM.BiblePanel');
		Ext.apply( this.biblepanel, {
			mid: 'biblepanel'
		});
		return this.biblepanel;
	},
	
	createFilePanel : function(){
		this.filepanel = Ext.create('Optima5.Modules.ParaCRM.FilePanel');
		Ext.apply( this.filepanel, {
			mid: 'filepanel'
		});
		return this.filepanel;
	},
	
	createQueryPanel : function(){
		this.querypanel = Ext.create('Optima5.Modules.ParaCRM.QueryPanel');
		Ext.apply( this.querypanel, {
			mid: 'querypanel'
		});
		return this.querypanel;
	},
	
	createMainToolbar : function(){
		this.maintoolbar = Ext.create('Optima5.Modules.ParaCRM.MainToolbar') ;
		return this.maintoolbar ;
	},
			  
	switchToPanel: function( id ){
		var newPanelIdx = this.mainwindow.items.findIndexBy( function(o,k){
			if( o.mid == id )
				return true ;
			else
				return false ;
		}) ;
		if( newPanelIdx == -1 )
			return ;
		var layout = this.mainwindow.getLayout(), activePanel = layout.activeItem, activePanelIdx = this.mainwindow.items.indexOf(activePanel) ;
		if(activePanelIdx !== newPanelIdx) {
				var newPanel = this.mainwindow.items.getAt(newPanelIdx) ;
				// console.dir(newPanel) ;

				layout.setActiveItem(newPanelIdx);
		}
	}
});
