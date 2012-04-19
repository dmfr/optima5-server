Ext.define('Optima5.Modules.ParaCRM.MainToolbar' ,{
    extend: 'Ext.toolbar.Toolbar',
    requires: [
        'Optima5.CoreDesktop.Ajax',
		  'Optima5.Modules.ParaCRM.DefineStorePanel',
		  'Ext.container.ButtonGroup',
		  'Ext.layout.container.Table'
    ],
			  
			  
			  
	bibleMenu : null ,
			  
	filesMenu : null ,
			  
			  
	initComponent : function() {
		
		Ext.apply( this , {
				items : [ {
					id: 'biblemenu',
					text: 'Bible',
					icon: 'images/op5img/ico_dataadd_16.gif',
					menu: this.createBibleMenu()
					//handler: this.switchToBible
			},'-', {
					id: 'filesmenu',
					text: 'Files',
					icon: 'images/op5img/ico_showref_listall.gif',
					menu: this.createFilesMenu()
					//handler: this.switchToBible
			},'-', {
					id: 'usermanager',
					icon: 'images/op5img/ico_kuser_small.gif',
					text: 'Manage Users/Scenarios',
					menu: {
						xtype: 'menu',
						plain: true,
						items: {
									text: 'User<br/>manager',
									iconCls: 'edit',
									width: 90,
									handler : function(){
										//console.dir(op5session) ;
										//console.log('Session ID is ' + op5session.get('sessionID')) ;
									}
						}
					}
			},'-', {
					text:'Queries',
					handler: this.switchToNotepad,
					scope : this ,
					icon: 'images/op5img/ico_blocs_small.gif'
			},'->', {
				helperId: 'store',
				hidden: true,
				text: '',
				icon: 'images/op5img/ico_storeview_16.png',
				viewConfig: {forceFit: true},
				menu: {
					xtype: 'menu',
					plain: true,
					items: []
				}
			} ]
		} );
		// console.dir(this.bibleMenu.items) ;
		this.addEvents('switchToBible','switchToFile','switchToNotepad','testcss','openDefineBibleEdit','switchtopanelview');
		this.callParent() ;
	},
	createBibleMenu : function() {
		this.bibleMenu = Ext.create('Ext.menu.Menu') ;
		this.loadBibleMenu() ;
		return this.bibleMenu ;
	},
	
	createFilesMenu : function() {
		this.filesMenu = Ext.create('Ext.menu.Menu') ;
		this.loadFilesMenu() ;
		return this.filesMenu ;
	},
			  
	showHelper: function( helpername ) {
		this.items.each(function(item){
			if( item.helperId ) {
				switch( item.helperId ) {
					case 'store' :
						this.showHelperCfgStore( item ) ;
						break ;
					default :
						break ;
				}
				item.setVisible(item.helperId == helpername) ;
			}
		},this) ;
	},
	showHelperCfgStore: function( item ) {
		item.menu.removeAll() ;
		// item.setText('') ;
		
		var is_grid , is_gmap , is_gallery ;
		var newTxt = '' ;
		switch( this.activeDataType ) {
			case 'bible' :
				this.bibleMenu.items.each(function(item){
					if( item.bibleId == this.activeBibleId ) {
						newTxt = '(Bible)'+'&nbsp;'+'<b>'+item.text+'</b>' ;
						
						
						if( item.viewmode_grid )
							is_grid = true ;
						if( item.viewmode_gmap )
							is_gmap = true ;
						if( item.viewmode_gallery )
							is_gallery = true ;
					}
				},this);
				break ;
			
			case 'file' :
				this.filesMenu.items.each(function(item){
					if( item.fileId == this.activeFileId ) {
						newTxt = '(File)'+'&nbsp;'+'<b>'+item.text+'</b>' ;
						
						if( item.viewmode_grid )
							is_grid = true ;
						if( item.viewmode_gmap )
							is_gmap = true ;
						if( item.viewmode_gallery )
							is_gallery = true ;
					}
				},this);
				break ;
		}
		
		var me = this ;
		menuItems = new Array() ;
		if( is_grid ) {
			menuItems.push({
				text: 'View Grid data',
				icon: 'images/op5img/ico_showref_listall.gif',
				handler : function() {
					this.setPanelViewMode('grid');
				},
				scope: me
			});
		}
		if( is_gmap ) {
			menuItems.push({
				text: 'View GMap/locations',
				icon: 'images/op5img/ico_planet_small.gif',
				handler : function() {
					this.setPanelViewMode('gmap');
				},
				scope: me
			});
		}
		if( is_gallery ) {
			menuItems.push({
				text: 'View Gallery',
				icon: 'images/op5img/ico_camera_16.png',
				handler : function() {
					this.setPanelViewMode('gallery');
				},
				scope: me
			});
		}
		if( menuItems.length > 0 ) {
			menuItems.push('-') ;
		}
		if( true ){
			menuItems.push({
				text: 'Store Cfg',
				icon: 'images/op5img/ico_config_small.gif',
				handler : me.openDefineBibleWindow,
				scope: me
			}) ;
		}
		item.menu.add(menuItems) ;
		item.setText(newTxt) ;
	},
	showTestCss : function() {
		this.fireEvent('testcss') ;
	},
			  
	setPanelViewMode: function( viewmode ) {
		// grid / gmap / gallery
		switch( this.activeDataType ) {
			case 'bible' :
			case 'file' :
				this.fireEvent('switchtopanelview',this.activeDataType,viewmode) ;
				break ;
				
			default :
				console.log('nothing') ;
				break ;
		}
	},
			  
			  
			  
	switchToBible : function() {
		this.activeDataType = 'bible' ;
		this.activeBibleId = arguments[0].bibleId ;
		this.showHelper('store') ;
		this.fireEvent('switchToBible',arguments[0]);
	},
	switchToFile : function() {
		this.activeDataType = 'file' ;
		this.activeFileId = arguments[0].fileId ;
		this.showHelper('store') ;
		this.fireEvent('switchToFile',arguments[0]);
	},
	switchToNotepad : function() {
		this.fireEvent('switchToNotepad');
	},
			  
	openDefineBibleWindow : function(isNew,newDataType) {
		var desktop = op5desktop.getDesktop() ;
		
		// console.log( this.activeBibleId ) ;
		
		var params = new Object() ;
		if( isNew == true ){
			Ext.apply( params, {
				defineDataType: newDataType ,
				defineIsNew: true
			}) ;
		}
		else
		{
			switch( this.activeDataType )
			{
				case 'bible' :
					Ext.apply( params, {
						defineIsNew: false,
						defineDataType: this.activeDataType ,
						defineBibleId : this.activeBibleId
					}) ;
				break ;
				
				case 'file' :
					Ext.apply( params, {
						defineIsNew: false,
						defineDataType: this.activeDataType ,
						defineFileId : this.activeFileId
					}) ;
				break ;
				
				default:
					Ext.Msg.alert('Status', 'Shouldnt happen !!!');
					return ;
				break ;
			}
		}
		
		var definestorepanel = Ext.create('Optima5.Modules.ParaCRM.DefineStorePanel',params) ;
		
		this.win = desktop.createWindow({
			id: 'pouet6',
			title:'pouet6',
			width:500,
			height:600,
			iconCls: 'parapouet',
			animCollapse:false,
			border: false,

			layout: {
				type: 'card',
				align: 'stretch'
			},
			items: [ definestorepanel ]
		}) ;
		this.win.show() ;
		
		definestorepanel.on('definechanged',function() {
			this.loadBibleMenu() ;
			this.loadFilesMenu() ;
			if( arguments[0].dataType == 'bible' )
				this.switchToBible({bibleId: arguments[0].bibleId , forceReconfigure:true}) ;
			if( arguments[0].dataType == 'file' )
				this.switchToFile({fileId: arguments[0].fileId , forceReconfigure:true}) ;
		},this) ;
		definestorepanel.on('destroy',function(){
			if( this.win ) {
				this.win.close() ;
			}
		},this);
	},
		

	
	loadBibleMenu : function() {
		//console.dir(this.bibleMenu) ;
		var me = this ;
		//console.log('Pouet') ;
		  Optima5.CoreDesktop.Ajax.request({
				url: 'server/backend.php',
				params: {
					_moduleName: 'paracrm',
					_action : 'define_getMainToolbar',
					data_type : 'bible'
				},
				succCallback: function(response) {
					// RaZ du menu
					this.bibleMenu.removeAll() ;
					
					// ajout des éléments de la bible
					me.bibleMenu.add(Ext.decode(response.responseText)) ;
					
					// ajout de l'handler pour zapper sur la bible
					Ext.each( this.bibleMenu.items.items , function(i,j) {
						i.setHandler(this.switchToBible,this) ;
					},this) ;
					
					// ajout de la page de config
				},
				scope: this
			});
	},
	loadFilesMenu : function() {
		var me = this ;
		//console.log('Pouet') ;
		  Optima5.CoreDesktop.Ajax.request({
				url: 'server/backend.php',
				params: {
					//_sessionName: op5session.get('session_id'),
					_moduleName: 'paracrm',
					_action : 'define_getMainToolbar',
					data_type : 'file'
				},
				succCallback: function(response) {
					// RaZ du menu
					this.filesMenu.removeAll() ;
					
					// ajout des éléments de la bible
					me.filesMenu.add(Ext.decode(response.responseText)) ;
					
					// ajout de l'handler pour zapper sur la bible
					Ext.each( this.filesMenu.items.items , function(i,j) {
						i.setHandler(this.switchToFile,this) ;
					},this) ;
					
					// ajout de la page de config
				},
				scope: this
			});
	}
	
});