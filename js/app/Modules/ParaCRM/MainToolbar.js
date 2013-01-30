Ext.define('Optima5.Modules.ParaCRM.MainToolbar' ,{
    extend: 'Ext.toolbar.Toolbar',
    requires: [
        'Optima5.CoreDesktop.Ajax',
		  'Optima5.Modules.ParaCRM.DefineStorePanel',
		  'Ext.container.ButtonGroup',
		  'Ext.layout.container.Table'
    ],
			  
	clsForPublished: 'op5-datanode-published',
	
	bibleMenu : null ,
	filesMenu : null ,
			  
			  
	initComponent : function() {
		
		Ext.apply( this , {
				items : [ {
					text: 'Bible',
					icon: 'images/op5img/ico_dataadd_16.gif',
					menu: this.createBibleMenu()
			},'-',{
					text: 'Files',
					icon: 'images/op5img/ico_showref_listall.gif',
					menu: this.createFilesMenu()
			},'-',{
					text: 'Scenarios',
					icon: 'images/op5img/ico_engins_16.gif',
					//menu: this.createScenariosMenu()
					menu: {
						xtype:'menu',
						plain:true,
						items:[]
					}
			},'-',{
					text: 'Queries',
					icon: 'images/op5img/ico_blocs_small.gif',
					menu: this.createQueriesMenu()
			},'-',{
					// id: 'usermanager',
					icon: 'images/op5img/ico_kuser_small.gif',
					text: 'Manage Users',
					menu: {
						xtype: 'menu',
						plain: true,
						items: [{
							text: 'ParaCRM accounts',
							icon: 'images/op5img/ico_kuser_small.gif',
							handler : function(){
								//console.dir(op5session) ;
								//console.log('Session ID is ' + op5session.get('sessionID')) ;
							}
						},{
							text: 'Android devices',
							icon: 'images/op5img/ico_android_16.png',
							handler : function(){
								this.switchToAuth('AuthAndroid') ;
							},
							scope:this
						}]
					}
			},'->',{
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
			},'-',{
				helperId: 'queries',
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
		this.addEvents('switchToBible',
							'switchToFile',
							'switchToQuery',
							'switchToQueryTemplate',
							'switchToAuth',
							'switchToNotepad',
							'switchtopanelview',
							'queryAction');
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
	createQueriesMenu : function() {
		this.queriesMenu = Ext.create('Ext.menu.Menu') ;
		this.loadQueriesMenu() ;
		return this.queriesMenu ;
	},
			  
	showHelper: function( helpername ) {
		this.items.each(function(item){
			if( item.helperId ) {
				switch( item.helperId ) {
					case 'store' :
						this.showHelperCfgStore( item ) ;
						break ;
					case 'queries' :
						this.showHelperCfgQueries( item ) ;
						break ;
					default :
						break ;
				}
				item.setVisible(item.helperId == helpername) ;
			}
		},this) ;
	},
	showHelperCfgStore: function( item ) {
		item.menu.hide() ;
		item.menu.removeAll() ;
		// item.setText('') ;
		
		var hasParent, is_grid , is_gmap , is_gallery , show_export ,
			isPublished = false ;
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
						
						if( item.isPublished ) {
							isPublished = true;
						}
					}
				},this);
				break ;
			
			case 'file' :
				this.filesMenu.items.each(function(item){
					if( item.fileId == this.activeFileId ) {
						newTxt = '(File)'+'&nbsp;'+'<b>'+item.text+'</b>' ;
						
						if( typeof item.file_parent_code !== 'undefined' && item.file_parent_code != '' ) {
							hasParent = true ;
						} else {
							hasParent = false ;
						}
						
						if( item.viewmode_grid )
							is_grid = true ;
						if( item.viewmode_gmap )
							is_gmap = true ;
						if( item.viewmode_gallery )
							is_gallery = true ;
						
						show_export = true ;
						
						if( item.isPublished ) {
							isPublished = true;
						}
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
		if( show_export == true ) {
			menuItems.push({
				text: 'Excel export',
				icon: 'images/op5img/ico_save_16.gif',
				handler : function() {
					this.exportToExcel();
				},
				scope: me
			});
		}
		if( show_export == true && is_gallery ) {
			menuItems.push({
				text: 'DL gallery as zip',
				icon: 'images/op5img/ico_saveas_16.gif',
				handler : function() {
					this.exportGallery();
				},
				scope: me
			});
		}
		if( show_export ) {
			menuItems.push('-') ;
		}
		if( !hasParent ){
			menuItems.push({
				text: 'Publish to Android',
				checked: isPublished,
				checkHandler : function(checkbox,isTicked) {
					me.storeTogglePublish(isTicked) ;
				},
				scope: me
			});
		}
		if( true ) {
			menuItems.push({
				text: 'Store Cfg',
				icon: 'images/op5img/ico_config_small.gif',
				handler : me.openDefineBibleWindow,
				scope: me
			}) ;
		}
		item.menu.add(menuItems) ;
		item.setText(newTxt) ;
		if( isPublished ) {
			item.addCls(me.clsForPublished) ;
		} else {
			item.removeCls(me.clsForPublished) ;
		}
	},
	
	showHelperCfgQueries: function( item ) {
		item.menu.hide() ;
		item.menu.removeAll() ;
		// item.setText('') ;
		var newTxt = '' ,
			isNew = false ,
			isPublished = false ,
			disableSave = false ;
			
		// Set isPublished + Disable save IF "current query or qmerge" is published
		this.queriesMenu.items.each( function( item ) {
			if( typeof item.queryId !== 'undefined' && this.activeQueryId != null && item.queryId == this.activeQueryId ) {
				if( item.isPublished ) {
					disableSave = true ;
					isPublished = true ;
				}
				return false ;
			}
			if( typeof item.qmergeId !== 'undefined' && this.activeQmergeId != null && item.qmergeId == this.activeQmergeId ) {
				if( item.isPublished ) {
					disableSave = true ;
					isPublished = true ;
				}
				return false ;
			}
			
		},this) ;
			
			
		if( this.activeQueryId != null ) {
			if( this.activeQueryId == 0 ) {
				newTxt = '(Query) <b>New</b>' ;
				isNew = true ;
			}
			else {
				// Set text for "current query" + Disable save IF "current query" is in any qmerge
				this.queriesMenu.items.each( function( item ) {
					if( typeof item.qmergeId !== 'undefined' && typeof item.menu !== 'undefined' ) {
						item.menu.items.each( function( subItem ) {
							if( typeof subItem.queryId !== 'undefined' && subItem.queryId == this.activeQueryId ) {
								newTxt = '(Query) <b>'+subItem.text+'</b>' ;
								disableSave = true ;
								return false ;
							}
						},this) ;
					}
					if( typeof item.queryId !== 'undefined' && item.queryId == this.activeQueryId ) {
						newTxt = '(Query) <b>'+item.text+'</b>' ;
						
						return false ;
					}
					
				},this) ;
				
			}
		}
		if( this.activeQmergeId != null ) {
			if( this.activeQmergeId == 0 ) {
				newTxt = '(Qmerge) <b>New</b>' ;
				isNew = true ;
			}
			else {
				// Set text for "current qmerge"
				this.queriesMenu.items.each( function( item ) {
					if( typeof item.qmergeId !== 'undefined' && item.qmergeId == this.activeQmergeId ) {
						newTxt = '(Qmerge) <b>'+item.text+'</b>' ;
						
						return false ;
					}
					
				},this) ;
			}
		}
		
		var me = this ;
		menuItems = new Array() ;
		if( true ) {
			menuItems.push({
				text: 'Run Query',
				icon: 'images/op5img/ico_process_16.gif',
				handler : function() {
					me.queryRun() ;
				},
				scope: me
			});
		}
		if( menuItems.length > 0 ) {
			menuItems.push('-') ;
		}
		if( !isNew ) {
			if( true ) {
				menuItems.push({
					text: 'Publish to Android',
					checked: isPublished,
					checkHandler : function(checkbox,isTicked) {
						me.queryTogglePublish(isTicked) ;
					},
					scope: me
				});
			}
			
			if( disableSave ) {
				menuItems.push({
					text: 'Save',
					icon: 'images/op5img/ico_save_16.gif',
					disabled:true
				});
			} else {
				menuItems.push({
					text: 'Save',
					icon: 'images/op5img/ico_save_16.gif',
					handler : function() {
						me.querySave() ;
					},
					scope: me
				});
			}
		}
		if( true ) {
			menuItems.push({
				text: 'Save as',
				icon: 'images/op5img/ico_saveas_16.gif',
				menu: {
					xtype:'menu' ,
					title: 'User options',
					items:[{
						xtype:'textfield' ,
						width:150
					},{
						xtype:'button',
						text:'Save Query',
						handler: function(){
							var textfield = this.up().query('textfield')[0] ;
							me.querySaveas( textfield.getValue() ) ;
							Ext.menu.Manager.hideAll();
						}
					}]
				},
				scope: me
			});
		}
		if( !isNew ) {
			if( disableSave ) {
				menuItems.push({
					text: 'Delete',
					icon: 'images/op5img/ico_delete_16.gif',
					disabled:true
				});
			} else {
				menuItems.push({
					text: 'Delete',
					icon: 'images/op5img/ico_delete_16.gif',
					handler : function() {
						me.queryDelete() ;
					},
					scope: me
				});
			}
		}
		item.menu.add(menuItems) ;
		item.setText(newTxt) ;
		if( isPublished ) {
			item.addCls(me.clsForPublished) ;
		} else {
			item.removeCls(me.clsForPublished) ;
		}
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
	exportToExcel: function() {
		switch( this.activeDataType ) {
			case 'bible' :
			case 'file' :
				this.fireEvent('exportexcel',this.activeDataType) ;
				break ;
				
			default :
				console.log('nothing') ;
				break ;
		}
	},
	exportGallery: function() {
		switch( this.activeDataType ) {
			case 'file' :
				this.fireEvent('exportgallery',this.activeDataType) ;
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
			  
			  
	switchToQueryNew: function(targetFileId) {
		this.activeDataType = '' ;
		this.activeQueryId = 0 ;
		this.activeQmergeId = null ;
		this.showHelper('queries') ;
		this.fireEvent('switchToQuery',0,targetFileId);
	},
	switchToQueryOpen: function(queryId) {
		this.activeDataType = '' ;
		this.activeQueryId = queryId ;
		this.activeQmergeId = null ;
		this.showHelper('queries') ;
		this.fireEvent('switchToQuery',queryId);
	},
	switchToQmergeNew: function() {
		this.activeDataType = '' ;
		this.activeQueryId = null ;
		this.activeQmergeId = 0 ;
		this.showHelper('queries') ;
		this.fireEvent('switchToQmerge',0);
	},
	switchToQmergeOpen: function(qmergeId) {
		this.activeDataType = '' ;
		this.activeQueryId = null ;
		this.activeQmergeId = qmergeId ;
		this.showHelper('queries') ;
		this.fireEvent('switchToQmerge',qmergeId);
	},
			  
	switchToQueryTemplate: function() {
		this.activeDataType = '' ;
		this.activeQueryId = 0 ;
		this.showHelper('') ;
		this.fireEvent('switchToQueryTemplate');
	},
			  
	switchToAuth: function(authClass) {
		this.activeDataType = '' ;
		this.showHelper('') ;
		this.fireEvent('switchToAuth',authClass);
	},
			  
			  
	queryRun: function() {
		this.fireEvent('queryAction','run');
	},
	querySave: function() {
		this.fireEvent('queryAction','save');
	},
	querySaveas: function(queryName) {
		this.fireEvent('queryAction','saveas',queryName) ;
	},
	queryDelete: function(queryName) {
		this.fireEvent('queryAction','delete') ;
	},
	queryTogglePublish: function( publishIsOn ) {
		this.fireEvent('queryAction','toggle_publish',publishIsOn) ;
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
		
	storeTogglePublish: function( isPublished ) {
		var me = this ;
		
		var ajaxParams = {
			_moduleName: 'paracrm',
			_action : 'define_togglePublish',
			// store specifics inserted here
			isPublished: isPublished
		};
		switch( this.activeDataType )
		{
			case 'bible' :
				Ext.apply( ajaxParams, {
					data_type: 'bible',
					bible_code : this.activeBibleId
				}) ;
			break ;
			
			case 'file' :
				Ext.apply( ajaxParams, {
					data_type: 'file',
					file_code : this.activeFileId
				}) ;
			break ;
			
			default:
				Ext.Msg.alert('Status', 'Shouldnt happen !!!');
				return ;
			break ;
		}
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams,
			succCallback: function(response) {
				// Rebuild helper on event "toolbarloaded"
				me.on('toolbarloaded',function(){
					me.showHelper('store') ;  // rebuild the helper
				},me,{
					single:true
				});
				switch( ajaxParams.data_type ) {
					case 'bible' :
						me.loadBibleMenu() ;
						break ;
						
					case 'file' :
						me.loadFilesMenu() ;
						break ;
						
					default:
						Ext.Msg.alert('Status', 'Shouldnt happen !!!');
						return ;
				}
			},
			scope: me
		});
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
						i.setHandler(function() {
							this.switchToBible({bibleId: i.bibleId , forceReconfigure:true}) ;
						},this) ;
						if( i.isPublished ) {
							i.addCls(me.clsForPublished) ;
						}
					},this) ;
					
					// ajout de la page de config
					
					// Fire an event
					me.fireEvent('toolbarloaded','bible') ;
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
						i.setHandler(function() {
							this.switchToFile({fileId: i.fileId , forceReconfigure:true}) ;
						},this) ;
						if( i.isPublished ) {
							i.addCls(me.clsForPublished) ;
						}
					},this) ;
					
					// ajout de la page de config
					
					// Fire an event
					me.fireEvent('toolbarloaded','file') ;
				},
				scope: this
			});
	},
	loadQueriesMenu: function() {
		var me = this ;
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: {
				//_sessionName: op5session.get('session_id'),
				_moduleName: 'paracrm',
				_action : 'queries_getToolbarData'
			},
			succCallback: function(response) {
				// RaZ du menu
				me.queriesMenu.removeAll() ;
				
				var respObj = Ext.decode(response.responseText) ;
				
				/* ********* Liste des queries / qmerges *********
				- AssocArray(Obj) QueryId => QueryName
				- Array de toutes les queries déja incluses dans 1 qmerge
				- Constitution des menu items
				************************************************* */
				var qObjIdName = {} ,
					qObjIdIspub = {} ;
				Ext.Array.each( respObj.data_queries , function(v) {
					var queryId = parseInt(v.queryId) ;
					var queryName = v.text ;
					var isPublished = (v.isPublished==true)? true : false ;
					
					qObjIdName[queryId] = queryName ;
					qObjIdIspub[queryId] = isPublished ;
				},me) ;
				var qmergeQueryIds = [] ;
				Ext.Array.each( respObj.data_qmerges , function(v) {
					Ext.Array.each( v.qmerge_queries , function(v2) {
						var queryId = parseInt(v2) ;
						if( !Ext.Array.contains(qmergeQueryIds,queryId) ) {
							qmergeQueryIds.push(queryId) ;
						}
					},me) ;
				},me) ;
				
				var qMenuItems = [] ;
				Ext.Array.each( respObj.data_qmerges , function(v) {
					var qMenuSubItems = [] ;
					Ext.Array.each( v.qmerge_queries , function(v2) {
						var queryId = parseInt(v2) ;
						if( typeof qObjIdName[queryId] === 'undefined' ) {
							return ;
						}
						qMenuSubItems.push({
							queryId : queryId,
							isPublished: (qObjIdIspub[queryId] == true)? true:false,
							text: qObjIdName[queryId],
							icon: 'images/op5img/ico_process_16.gif' ,
							cls: (qObjIdIspub[queryId] == true)? me.clsForPublished:null,
							handler: function(){
								me.switchToQueryOpen( queryId ) ;
							}
						}) ;
					},me) ;
					
					qMenuItems.push({
						qmergeId: v.qmergeId,
						isPublished: v.isPublished,
						text: v.text,
						icon: 'images/op5img/ico_filechild_16.gif' ,
						cls: (v.isPublished == true)? me.clsForPublished:null,
						handler: function(){
							me.switchToQmergeOpen( parseInt(v.qmergeId) ) ;
						},
						menu:qMenuSubItems
					});
				},me) ;
				Ext.Array.each( respObj.data_queries , function(v) {
					var queryId = parseInt(v.queryId) ;
					if( Ext.Array.contains(qmergeQueryIds,queryId) ) {
						return ;
					}
					
					qMenuItems.push({
						queryId: queryId,
						isPublished: v.isPublished,
						text: v.text,
						icon: 'images/op5img/ico_process_16.gif' ,
						cls: (v.isPublished == true)? me.clsForPublished:null,
						handler: function(){
							me.switchToQueryOpen( queryId ) ;
						}
					});
				},me) ;
				Ext.Array.sort( qMenuItems, function(o1,o2) {
					if( o1.text < o2.text ) {
						return -1 ;
					} else if(  o1.text > o2.text ) {
						return 1 ;
					} else {
						return 0 ;
					}
				}) ;
				
				
				var menuItems = [] ;
				
				// ajout du "new"
				if( respObj.data_filetargets && respObj.data_filetargets.length > 0 ) {
					var subMenuFiles = Ext.Array.clone( respObj.data_filetargets ) ;
					Ext.Array.each( subMenuFiles, function(o) {
						Ext.apply(o,{
							handler: function() {
								
								me.switchToQueryNew( o.fileId ) ;
							}
						}) ;
					}) ;
					menuItems.push({
						icon: 'images/op5img/ico_new_16.gif' ,
						text: 'Create Query on ' ,
						menu: subMenuFiles
					}) ;
				}
				// ajout du "new" Qmerge
				if( respObj.data_queries && respObj.data_queries.length > 0 ) {
					menuItems.push({
						icon: 'images/op5img/ico_casier_small.gif' ,
						text: 'Create Qmerge on queries' ,
						handler : function() {
							me.switchToQmergeNew() ;
						},
						scope : me
					}) ;
				}
				
				if( respObj.data_filetargets && respObj.data_filetargets.length > 0
						&& qMenuItems.length > 0 ) {
					
					menuItems.push('-') ;
				}
				
				menuItems = Ext.Array.union(menuItems,qMenuItems) ;
				
				if( true ) {
					menuItems.push('-') ;
					menuItems.push({
						icon: 'images/op5img/ico_config_small.gif' ,
						text: 'Cfg templates' ,
						handler: function() {
							me.switchToQueryTemplate() ;
						},
						scope:me
					}) ;
				}
				
				
				
				me.queriesMenu.add(menuItems) ;
				
				
				me.fireEvent('toolbarloaded','queries') ;
			},
			scope: me
		});
	}
	
});