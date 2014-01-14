Ext.define('Optima5.Modules.CrmBase.DataWindow' ,{
	extend: 'Ext.window.Window',
	requires: [
		'Optima5.Modules.CrmBase.DataWindowToolbar',
		'Optima5.Modules.CrmBase.BiblePanel',
		'Optima5.Modules.CrmBase.FilePanel',
		'Optima5.Modules.CrmBase.DefineStorePanel',
		'Optima5.Modules.CrmBase.DataImportPanel'
	],
	
	optimaModule: null,
	
	dataType:'', /* 'bible','file' */
	bibleId:null,
	fileId:null,
	parentFileId:null,
	
	
	statics: {
		sOpenDefineWindow : function(optimaModule, defineDataType, defineIsNew, defineDataId) {
			var params = new Object() ;
			Ext.apply(params,{
				optimaModule: optimaModule
			}) ;
			if( defineIsNew == true ){
				Ext.apply( params, {
					defineDataType: defineDataType ,
					defineIsNew: true
				}) ;
			}
			else
			{
				switch( defineDataType )
				{
					case 'bible' :
						Ext.apply( params, {
							defineIsNew: false,
							defineDataType: defineDataType ,
							defineBibleId : defineDataId
						}) ;
					break ;
					
					case 'file' :
						Ext.apply( params, {
							defineIsNew: false,
							defineDataType: defineDataType ,
							defineFileId : defineDataId
						}) ;
					break ;
					
					default:
						Ext.Msg.alert('Status', 'Shouldnt happen !!!');
						return ;
					break ;
				}
			}
			
			var definestorepanel = Ext.create('Optima5.Modules.CrmBase.DefineStorePanel',params) ;
			definestorepanel.on('beforedestroy',function(panel){
				if( panel.up('window') ) {
					var parentwin = panel.up('window') ;
					panel.on('destroy',function() {
						parentwin.close() ;
					}) ;
				}
			});
			
			optimaModule.createWindow({
				title:'Store definition',
				width:720,
				height:600,
				iconCls: 'op5-crmbase-definewindow-icon',
				animCollapse:false,
				border: false,
				items: [ definestorepanel ]
			}) ;
		}
	},
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:DataWindow','No module reference ?') ;
		}
		
		var cfgValid = false ;
		switch( me.dataType ) {
			case 'bible' :
				if( me.bibleId && me.bibleId != '' ) {
					Ext.apply(me,{
						items:[Ext.create('Optima5.Modules.CrmBase.BiblePanel',{
							itemId:'biblePanel',
							border: false,
							optimaModule: me.optimaModule,
							listeners: {
								load: {
									fn: me.onReload,
									scope: me
								}
							}
						})]
					}) ;
					cfgValid = true ;
				}
				break ;
				
			case 'file' :
				if( me.fileId && me.fileId != '' ) {
					Ext.apply(me,{
						items:[Ext.create('Optima5.Modules.CrmBase.FilePanel',{
							itemId:'filePanel',
							border: false,
							optimaModule: me.optimaModule,
							listeners: {
								load: {
									fn: me.onReload,
									scope: me
								},
								viewchange: {
									fn: me.onFileViewChanged,
									scope: me
								}
							}
						})]
					}) ;
					cfgValid = true ;
				}
				break ;
				
			default : break ;
		}
		if( !cfgValid ) {
			Optima5.Helper.logError('CrmBase:DataWindow','Invalid config') ;
		}
		
		Ext.apply(me,{
			border: false,
			tbar: Ext.create('Optima5.Modules.CrmBase.DataWindowToolbar',{
				itemId:'tbar',
				optimaModule: me.optimaModule,
				dataType: me.dataType,
				listeners:{
					toolbaritemclick: me.onToolbarItemClick,
					scope:me
				}
			})
		}) ;
		
		
		me.on('show', function() {
			// configure panel + load data
			me.configureComponents() ;
		},me,{single:true}) ;
		
		me.callParent() ;
		
		me.mon(me.optimaModule,'op5broadcast',me.onCrmeventBroadcast,me) ;
	},
	onReload: function() {
		var me = this ;
		me.getToolbar().enableDropStore( me.getPanel().isEmpty() ) ;
	},
	onFileViewChanged: function(viewId) {
		var me = this ;
		switch( viewId ) {
			case 'editgrid' :
				me.getToolbar().enableNew( true ) ;
				break ;
			
			default :
				me.getToolbar().enableNew( false ) ;
				break ;
		}
	},
	
	onCrmeventBroadcast: function( crmEvent, eventParams ) {
		var me = this ;
		switch( crmEvent ) {
			case 'datachange' :
			case 'definechange' :
			case 'togglepublishdata' :
				switch( eventParams.dataType ) {
					case 'bible' :
						if( me.dataType=='bible' && eventParams.bibleId == me.bibleId ) {
						} else {
							return ;
						}
						break ;
					case 'file' :
						if( me.dataType=='file' && ( eventParams.fileId == me.fileId || eventParams.fileId == me.parentFileId ) ) {
						} else {
							return ;
						}
						break ;
					default :
						return ;
				}
				break ;
			
			default :
				return ;
		}
		
		switch( crmEvent ) {
			case 'togglepublishdata' :
				return me.configureComponents(true) ;
			case 'definechange' :
				return me.configureComponents() ;
			case 'datachange' :
				return me.getPanel().reload() ;
		}
	},
	getToolbar: function() {
		var me = this ;
		return me.child('#tbar');
	},
	getPanel: function() {
		var me = this ;
		switch( me.dataType ) {
			case 'bible' :
				return me.child('#biblePanel') ;
			case 'file' :
				return me.child('#filePanel') ;
			default :
				return null ;
		}
	},
	
	configureComponents: function( toolbarOnly ) {
		var me = this ,
			params = {} ;
		
		switch( me.dataType ) {
			case 'bible' :
				params = {
					_action : 'data_getBibleCfg',
					bible_code : me.bibleId
				};
				break ;
				
			case 'file' :
				params = {
					_action : 'data_getFileGrid_config',
					file_code : me.fileId
				};
				break ;
		}
			
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				me.onConfigLoad( Ext.decode(response.responseText).data, toolbarOnly ) ;
			},
			scope: me
		});
	},
	onConfigLoad: function( ajaxData, toolbarOnly ) {
		var me = this ;
		
		me.bibleId = me.fileId = me.parentFileId = null ;
		
		switch( me.dataType ) {
			case 'bible' :
				me.bibleId = ajaxData.define_bible.bible_code ;
				
				me.setTitle( me.optimaModule.getWindowTitle( ajaxData.define_bible.text ) ) ;
				me.child('#tbar').reconfigure( ajaxData.define_bible, ajaxData.auth_status ) ;
				if( !toolbarOnly ) {
					me.child('#biblePanel').reconfigure( me.bibleId, ajaxData ) ;
				}
				break ;
			case 'file' :
				me.fileId = ajaxData.define_file.file_code ;
				if( ajaxData.define_file.file_parent_code != '' ) {
					me.parentFileId = ajaxData.define_file.file_parent_code ;
				}
				
				me.setTitle( me.optimaModule.getWindowTitle( ajaxData.define_file.text ) ) ;
				me.child('#tbar').reconfigure( ajaxData.define_file, ajaxData.auth_status ) ;
				if( !toolbarOnly ) {
					me.child('#filePanel').reconfigure( me.fileId, ajaxData ) ;
				}
				break ;
		}
	},
	onToolbarItemClick: function( menuId, menuItemId, checked ) {
		var me = this ;
		//console.log(menuId+':'+menuItemId+' '+checked) ;
		switch( menuId ) {
			case 'new' :
				return me.getPanel().onClickNew() ;
				break ;
				
			case 'file' :
				switch( menuItemId ) {
					case 'importdata' :
						return me.openDataImportPanel() ;
					case 'export-excel' :
						return me.getPanel().exportExcel() ;
					case 'export-gallery' :
						return me.getPanel().exportGallery() ;
					default : break ;
				}
				break ;
				
			case 'view' :
				switch( menuItemId ) {
					case 'grid' :
					case 'editgrid' :
					case 'calendar' :
					case 'gallery' :
					case 'gmap' :
						var viewmode = menuItemId ;
						return me.getPanel().switchToPanel(viewmode) ;
					default:
						break ;
				}
				break ;
				
			case 'options' :
				switch( menuItemId ) {
					case 'toggle-android' :
						return me.storeTogglePublish( checked ) ;
					case 'definestore' :
						return me.openDefineWindow( false ) ;
					case 'dropstore' :
						return me.handleDeleteStore() ;
					default : break ;
				}
				break ;
				
			case 'refresh' :
				if( me.getPanel() ) {
					me.getPanel().reload() ;
				}
				break ;
		}
	},
	
	openDefineWindow : function() {
		var me = this ;
		
		switch( me.dataType )
		{
			case 'bible' :
				Optima5.Modules.CrmBase.DataWindow.sOpenDefineWindow(me.optimaModule,'bible',false,me.bibleId) ;
			break ;
			
			case 'file' :
				Optima5.Modules.CrmBase.DataWindow.sOpenDefineWindow(me.optimaModule,'file',false,me.fileId) ;
			break ;
			
			default:
				Ext.Msg.alert('Status', 'Shouldnt happen !!!');
				return ;
			break ;
		}
	},
	handleDeleteStore: function() {
		var me = this,
			msg ;
		
		msg = "Drop " ;
		switch( this.dataType ) {
			case 'bible' :
				msg+= ' bible ' + this.bibleId ;
				break ;
			case 'file' :
				msg+= ' file ' + this.fileId ;
				break ;
			default :
				return ;
		}
		msg+= ' and all associated data ?' ;
		
		Ext.Msg.show({
			title:'Delete file record',
			msg: msg ,
			icon: Ext.Msg.WARNING,
			buttons: Ext.Msg.YESNO,
			fn:function(buttonId){
				switch( buttonId ) {
					case 'yes':
						me.doDeleteStore() ;
						break ;
				}
			},
			scope:me
		}) ;
	},
	doDeleteStore: function() {
		var me = this ;
		
		var ajaxParams = {
			_action : 'define_drop'
		};
		switch( this.dataType )
		{
			case 'bible' :
				Ext.apply( ajaxParams, {
					data_type: 'bible',
					bible_code : this.bibleId
				}) ;
			break ;
			
			case 'file' :
				Ext.apply( ajaxParams, {
					data_type: 'file',
					file_code : this.fileId
				}) ;
			break ;
			
			default:
				Ext.Msg.alert('Status', 'Shouldnt happen !!!');
				return ;
			break ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('definechange',{
						dataType:me.dataType,
						bibleId:me.bibleId,
						fileId:me.fileId
					}) ;
					me.destroy() ;
				}
			},
			scope: me
		});
	},
	storeTogglePublish: function( isPublished ) {
		var me = this ;
		
		var ajaxParams = {
			_action : 'define_togglePublish',
			isPublished: isPublished
		};
		switch( this.dataType )
		{
			case 'bible' :
				Ext.apply( ajaxParams, {
					data_type: 'bible',
					bible_code : this.bibleId
				}) ;
			break ;
			
			case 'file' :
				Ext.apply( ajaxParams, {
					data_type: 'file',
					file_code : this.fileId
				}) ;
			break ;
			
			default:
				Ext.Msg.alert('Status', 'Shouldnt happen !!!');
				return ;
			break ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				// Rebuild helper on event "toolbarloaded"
				me.optimaModule.postCrmEvent('togglepublishdata',{
					dataType:me.dataType,
					bibleId:me.bibleId,
					fileId:me.fileId
				}) ;
			},
			scope: me
		});
	},
	
	
	openDataImportPanel: function() {
		var me = this ;
		
		var setSizeFromParent = function( parentPanel, targetPanel ) {
			targetPanel.setSize({
				width: parentPanel.getSize().width - 20,
				height: parentPanel.getSize().height - 60
			}) ;
		};
		
		var dataImportPanel = Ext.create('Optima5.Modules.CrmBase.DataImportPanel',{
			parentDataWindow: me,
			width:800, // dummy initial size, for border layout to work
			height:600, // ...
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		
		dataImportPanel.mon(me,'resize', function() {
			setSizeFromParent( me, dataImportPanel ) ;
		},me) ;
		
		// Size + position
		setSizeFromParent(me,dataImportPanel) ;
		dataImportPanel.on('destroy',function() {
			me.getEl().unmask() ;
			// me.fireEvent('qbookztemplatechange') ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		dataImportPanel.show();
		dataImportPanel.getEl().alignTo(me.getEl(), 't-t?',[0,50]);
	}
	
});
